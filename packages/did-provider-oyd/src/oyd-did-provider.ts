import { importProvidedOrGeneratedKey } from '@sphereon/ssi-sdk-ext.key-utils'
import { IAgentContext, IIdentifier, IKey, IKeyManager, IService, TKeyType } from '@veramo/core'
import { AbstractIdentifierProvider } from '@veramo/did-manager'
import { KeyManager } from '@veramo/key-manager'
import fetch from 'cross-fetch'
import Multibase from 'multibase'
import Multicodec from 'multicodec'

// @ts-ignore
import * as u8a from 'uint8arrays'

import Debug from 'debug'
import type {
  CMSMCallbackOpts,
  OydConstructorOptions,
  OydCreateIdentifierOptions,
  // OydDidHoldKeysArgs,
  OydDidSupportedKeyTypes,
} from './types/oyd-provider-types'

const PROVIDER_NAME = 'OYD DID Provider'
const debug = Debug('veramo:oyd-did:identifier-provider')
const DEFAULT_OYDID_REGISTRAR_URL = 'https://oydid-registrar.data-container.net/1.0/createIdentifier'

// A CMSM create takes three calls with a server-managed revocation key and four
// when the client manages it too. The bound only guards against a registrar
// that keeps answering 201; it is not a protocol constant.
const MAX_CMSM_PHASES = 8

type IContext = IAgentContext<IKeyManager>

/**
 * {@link @veramo/did-manager#DIDManager} identifier provider for `did:oyd` identifiers
 * @public
 */
export class OydDIDProvider extends AbstractIdentifierProvider {
  private readonly defaultKms?: string
  private readonly cmsmCallbackOpts?: CMSMCallbackOpts
  private readonly registrarUrl: string

  constructor(options?: OydConstructorOptions) {
    super()
    this.defaultKms = options?.defaultKms
    this.cmsmCallbackOpts = options?.clientManagedSecretMode
    this.registrarUrl = options?.registrarUrl ?? DEFAULT_OYDID_REGISTRAR_URL
  }

  private async assertedKms(...kms: (string | undefined)[]): Promise<string> {
    if (!kms || kms.length === 0) {
      return Promise.reject(Error('KMS must be provided either as a parameter or via defaultKms.'))
    }
    const result = kms.find((k) => !!k)
    if (!result) {
      return Promise.reject(Error('KMS must be provided either as a parameter or via defaultKms.'))
    }
    return result
  }

  async createIdentifier(
    { kms, alias, options }: { kms?: string; alias?: string; options: OydCreateIdentifierOptions },
    context: IContext,
  ): Promise<Omit<IIdentifier, 'provider'>> {
    const resolvedKms = await this.assertedKms(kms, this.defaultKms)

    if ((this.cmsmCallbackOpts && !options.cmsm) || (options.cmsm && options.cmsm.enabled !== false)) {
      if (!this.cmsmCallbackOpts) {
        return Promise.reject(Error('did:oyd: no cmsm options defined on oyd did provider, but cmsm was enabled on the call!'))
      }
      return await this.createIdentifierWithCMSM({ kms: resolvedKms, options }, context)
    }

    const body = {
      options: {
        cmsm: false,
        key_type: options.type ?? 'Secp256r1',
      },
    }
    let didDoc: any | undefined
    try {
      const response = await fetch(this.registrarUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        debug('Error response from OydDID Registrar: ', response)
        return Promise.reject(Error('Network response was not ok: ' + response.statusText))
      }
      didDoc = await response.json()
    } catch (error: any) {
      debug('Unexpected error from OydDID Registrar: ', error)
      return Promise.reject(Error('There has been a problem with the fetch operation: ' + error.toString()))
    }

    const keyType: OydDidSupportedKeyTypes = options?.type ?? 'Secp256r1'
    const key = await importProvidedOrGeneratedKey(
      {
        providerName: PROVIDER_NAME,
        kms: resolvedKms,
        alias: alias ?? options.alias ?? options.kid ?? `${didDoc.did}#key-doc`,
        options: {
          key: {
            kid: `${didDoc.did}#key-doc`,
            type: keyType,
            publicKeyHex: didDoc.keys[0].publicKeyHex,
            privateKeyHex: didDoc.keys[0].privateKeyHex,
          },
        },
      },
      context,
    )

    const identifier: Omit<IIdentifier, 'provider'> = {
      did: didDoc.did,
      controllerKeyId: key.kid,
      keys: [key],
      services: [],
    }
    debug('Created', identifier.did)
    return identifier
  }

  async createIdentifierWithCMSM(
    { kms, options }: { kms?: string; options: OydCreateIdentifierOptions },
    context: IContext,
  ): Promise<Omit<IIdentifier, 'provider'>> {
    const cmsmCallbackOpts = this.cmsmCallbackOpts
    if (!cmsmCallbackOpts) {
      return Promise.reject(Error('did:oyd: no cmsm options defined!'))
    }

    const assertedKms = await this.assertedKms(kms, this.defaultKms)
    const pubKey =
      options.key ??
      (await cmsmCallbackOpts.publicKeyCallback(options.kid ?? 'default', assertedKms, options.cmsm?.create !== false, options.type))
    const kid = pubKey.kid
    const keyType = pubKey.type
    const key = base58btc({ publicKeyHex: pubKey.publicKeyHex, keyType })

    // Client-Managed-Secret-Mode is a challenge/response flow. Every
    // intermediate answer is HTTP 201 and names the value to sign (`sign`), the
    // key to sign it with (`with`) and a session handle tying the phases
    // together; that handle has to be echoed back or the registrar starts a new
    // flow. The closing answer is HTTP 200 and carries the DID.
    let request: Record<string, unknown> = {
      key,
      options: { cmsm: true, key_type: keyType },
    }
    let created: any | undefined

    for (let phase = 1; phase <= MAX_CMSM_PHASES && created === undefined; phase++) {
      let response: Response
      try {
        response = await fetch(this.registrarUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        })
      } catch (error: any) {
        debug('Unexpected error from OydDID Registrar: ', error)
        return Promise.reject(Error('There has been a problem with the fetch operation: ' + error.toString()))
      }

      const payload = await response.json().catch(() => undefined)

      if (response.status === 201) {
        if (!payload?.session || !payload?.sign) {
          return Promise.reject(Error('did:oyd: malformed CMSM challenge from the registrar'))
        }
        const signature = await cmsmCallbackOpts.signCallback(this.cmsmSigningKid(payload.with, kid), payload.sign)
        request = { options: { cmsm: true, session: payload.session, sig: signature } }
        continue
      }

      if (!response.ok) {
        debug('Error response from OydDID Registrar: ', payload)
        return Promise.reject(Error(`did:oyd: registrar answered ${response.status}: ${payload?.error ?? response.statusText}`))
      }

      created = payload
    }

    if (created === undefined) {
      return Promise.reject(Error(`did:oyd: CMSM flow did not complete within ${MAX_CMSM_PHASES} phases`))
    }

    // The revocation record is the one artefact the client cannot rebuild: it
    // was signed with a key the registrar never sees, and a secure element does
    // not have to sign deterministically. Without it the DID can neither be
    // updated nor revoked, so it is kept with the key it belongs to. It is a log
    // entry, not a secret.
    const key_with_revocation: IKey = created.log_revoke
      ? { ...pubKey, meta: { ...(pubKey.meta ?? {}), oyd: { logRevoke: created.log_revoke } } }
      : pubKey

    const identifier: Omit<IIdentifier, 'provider'> = {
      did: created.did,
      controllerKeyId: pubKey.kid,
      keys: [key_with_revocation],
      services: [],
    }
    debug('Created', identifier.did)
    return identifier
  }

  /**
   * Which key the registrar is asking for. With a server-managed revocation key
   * every challenge names `key-doc`, so this is the document key throughout.
   * `key-rev` only appears once the client supplies a revocation key of its own,
   * which this provider does not do yet.
   */
  private cmsmSigningKid(requestedKey: string | undefined, documentKid: string): string {
    if (requestedKey === 'key-rev') {
      throw Error('did:oyd: the registrar asked for a client-managed revocation key, which this provider does not manage')
    }
    return documentKid
  }

  async updateIdentifier(
    args: { did: string; kms?: string | undefined; alias?: string | undefined; options?: any },
    context: IAgentContext<IKeyManager>,
  ): Promise<IIdentifier> {
    throw new Error('OydDIDProvider updateIdentifier not supported yet.')
  }

  async deleteIdentifier(identifier: IIdentifier, context: IContext): Promise<boolean> {
    for (const { kid } of identifier.keys) {
      await context.agent.keyManagerDelete({ kid })
    }
    return true
  }

  async addKey({ identifier, key, options }: { identifier: IIdentifier; key: IKey; options?: any }, context: IContext): Promise<any> {
    return { success: true }
  }

  async addService({ identifier, service, options }: { identifier: IIdentifier; service: IService; options?: any }, context: IContext): Promise<any> {
    return { success: true }
  }

  async removeKey(args: { identifier: IIdentifier; kid: string; options?: any }, context: IContext): Promise<any> {
    return { success: true }
  }

  async removeService(args: { identifier: IIdentifier; id: string; options?: any }, context: IContext): Promise<any> {
    return { success: true }
  }
}

const keyCodecs = {
  RSA: 'rsa-pub',
  Ed25519: 'ed25519-pub',
  X25519: 'x25519-pub',
  Secp256k1: 'secp256k1-pub',
  Secp256r1: 'p256-pub',
  Bls12381G1: 'bls12_381-g1-pub',
  Bls12381G2: 'bls12_381-g2-pub',
} as const

const base58btc = ({ publicKeyHex, keyType = 'Secp256r1' }: { publicKeyHex: string; keyType?: TKeyType }): string => {
  const codecName = keyCodecs[keyType]

  // methodSpecificId  = bytesToMultibase({bytes: u8a.fromString(key.publicKeyHex, 'hex'), codecName})
  return u8a
    .toString(Multibase.encode('base58btc', Multicodec.addPrefix(codecName as Multicodec.CodecName, u8a.fromString(publicKeyHex, 'hex'))))
    .toString()
}

export function defaultOydCmsmPublicKeyCallback(
  keyManager: KeyManager,
): (kid: string, kms?: string, create?: boolean, createKeyType?: TKeyType) => Promise<IKey> {
  return async (kid: string, kms?: string, create?: boolean, createKeyType?: TKeyType): Promise<IKey> => {
    try {
      const existing = await keyManager.keyManagerGet({ kid })
      if (existing) {
        return existing
      }
    } catch (error: any) {}
    if (create) {
      if (!kms) {
        return Promise.reject(Error('No KMS provided, whilst creating a new key!'))
      }
      const alias = kid ?? `oyd-${new Date().toISOString()}`

      const agent = keyManager
      const key = await importProvidedOrGeneratedKey(
        {
          providerName: PROVIDER_NAME,
          kms,
          alias,
          options: {
            key: {
              type: createKeyType ?? 'Secp256r1',
            },
          },
        },
        {
          //@ts-ignore
          agent,
        },
      )
      return key

      // return await keyManager.keyManagerCreate({ kms, type: createKeyType ?? 'Secp256r1' })
    }
    return Promise.reject(Error('No existing key found, and create is false!'))
  }
}

export function defaultOydCmsmSignCallback(keyManager: KeyManager): (kid: string, data: string) => Promise<string> {
  return async (kid: string, data: string): Promise<string> => {
    return keyManager.keyManagerSign({ keyRef: kid, data, encoding: 'utf-8' })
  }
}

export class DefaultOydCmsmCallbacks implements CMSMCallbackOpts {
  private readonly keyManager: KeyManager

  constructor(keyManager: KeyManager) {
    this.keyManager = keyManager
  }

  publicKeyCallback(kid: string, kms?: string, create?: boolean, createKeyType?: TKeyType): Promise<IKey> {
    return defaultOydCmsmPublicKeyCallback(this.keyManager)(kid, kms, create, createKeyType)
  }

  signCallback(kid: string, value: string): Promise<string> {
    return defaultOydCmsmSignCallback(this.keyManager)(kid, value)
  }
}
