import {
  importProvidedOrGeneratedKey,
  JWK_JCS_PUB_NAME,
  JWK_JCS_PUB_PREFIX,
  jwkJcsEncode,
  JwkKeyUse,
  TKeyType,
  toJwk,
  toRawCompressedHexPublicKey,
} from '@sphereon/ssi-sdk-ext.key-utils'
import { IAgentContext, IIdentifier, IKey, IKeyManager, IService } from '@veramo/core'
import { AbstractIdentifierProvider } from '@veramo/did-manager'
import Debug from 'debug'
import Multibase from 'multibase'
import Multicodec from 'multicodec'
// @ts-ignore
import * as u8a from 'uint8arrays'
const { fromString, toString } = u8a

const debug = Debug('did-provider-key')

type IContext = IAgentContext<IKeyManager>

const keyCodecs = {
  RSA: 'rsa-pub',
  Ed25519: 'ed25519-pub',
  X25519: 'x25519-pub',
  Secp256k1: 'secp256k1-pub',
  Secp256r1: 'p256-pub',
  Bls12381G1: 'bls12_381-g1-pub',
  Bls12381G2: 'bls12_381-g2-pub',
} as const

export class SphereonKeyDidProvider extends AbstractIdentifierProvider {
  private readonly kms?: string

  constructor(options: { defaultKms?: string }) {
    super()
    this.kms = options.defaultKms
  }

  async createIdentifier(
    {
      kms,
      alias,
      options,
    }: {
      kms?: string
      alias?: string
      options?: {
        type?: TKeyType
        codecName?: 'EBSI' | 'jwk_jcs-pub' | Multicodec.CodecName
        key?: {
          type?: Exclude<TKeyType, 'Secp384r1' | 'Secp521r1'>
          privateKeyHex: string
        }
      }
    },
    context: IContext
  ): Promise<Omit<IIdentifier, 'provider'>> {
    let codecName = (options?.codecName?.toUpperCase() === 'EBSI' ? (JWK_JCS_PUB_NAME as Multicodec.CodecName) : options?.codecName) as
      | CodeNameType
      | undefined
    const keyType = (options?.type ?? options?.key?.type ?? (codecName === JWK_JCS_PUB_NAME ? 'Secp256r1' : 'Secp256k1')) as Exclude<
      TKeyType,
      'Secp384r1' | 'Secp521r1'
    >
    // console.log(`keytype: ${keyType}, codecName: ${codecName}`)

    const key = await importProvidedOrGeneratedKey(
      {
        // @ts-ignore
        kms: kms ?? this.kms,
        alias: alias,
        options: { ...options, type: keyType },
      },
      context
    )

    let methodSpecificId: string | undefined

    // did:key uses compressed pub keys
    const compressedPublicKeyHex = toRawCompressedHexPublicKey(fromString(key.publicKeyHex, 'hex'), key.type)
    if (codecName === JWK_JCS_PUB_NAME) {
      const jwk = toJwk(key.publicKeyHex, keyType, { use: JwkKeyUse.Signature, key, noKidThumbprint: true })
      // console.log(`FIXME JWK: ${JSON.stringify(toJwk(privateKeyHex, keyType, { use: JwkKeyUse.Signature, key, isPrivateKey: true }), null, 2)}`)
      methodSpecificId = toString(
        Multibase.encode('base58btc', Multicodec.addPrefix(fromString(JWK_JCS_PUB_PREFIX.valueOf().toString(16), 'hex'), jwkJcsEncode(jwk)))
      )
    } else if (codecName) {
      methodSpecificId = toString(
        Multibase.encode('base58btc', Multicodec.addPrefix(codecName as Multicodec.CodecName, fromString(compressedPublicKeyHex, 'hex')))
      )
    } else {
      codecName = keyCodecs[keyType]

      if (codecName) {
        // methodSpecificId  = bytesToMultibase({bytes: u8a.fromString(key.publicKeyHex, 'hex'), codecName})
        methodSpecificId = toString(
          Multibase.encode('base58btc', Multicodec.addPrefix(codecName as Multicodec.CodecName, fromString(compressedPublicKeyHex, 'hex')))
        ).toString()
      }
    }
    if (!methodSpecificId) {
      throw Error(`Key type ${keyType}, codec ${codecName} is not supported currently for did:key`)
    }
    const identifier: Omit<IIdentifier, 'provider'> = {
      did: `did:key:${methodSpecificId}`,
      controllerKeyId: key.kid,
      keys: [key],
      services: [],
    }
    debug('Created', identifier.did)
    return identifier
  }

  async updateIdentifier(
    args: { did: string; kms?: string | undefined; alias?: string | undefined; options?: any },
    context: IAgentContext<IKeyManager>
  ): Promise<IIdentifier> {
    throw new Error('KeyDIDProvider updateIdentifier not supported yet.')
  }

  async deleteIdentifier(identifier: IIdentifier, context: IContext): Promise<boolean> {
    for (const { kid } of identifier.keys) {
      await context.agent.keyManagerDelete({ kid })
    }
    return true
  }

  async addKey({ identifier, key, options }: { identifier: IIdentifier; key: IKey; options?: any }, context: IContext): Promise<any> {
    throw Error('KeyDIDProvider addKey not supported')
  }

  async addService({ identifier, service, options }: { identifier: IIdentifier; service: IService; options?: any }, context: IContext): Promise<any> {
    throw Error('KeyDIDProvider addService not supported')
  }

  async removeKey(args: { identifier: IIdentifier; kid: string; options?: any }, context: IContext): Promise<any> {
    throw Error('KeyDIDProvider removeKey not supported')
  }

  async removeService(args: { identifier: IIdentifier; id: string; options?: any }, context: IContext): Promise<any> {
    throw Error('KeyDIDProvider removeService not supported')
  }
}

type CodeNameType = Multicodec.CodecName | 'rsa-pub' | 'jwk_jcs-pub'
