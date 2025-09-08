import { importProvidedOrGeneratedKey, jwkDetermineUse, toJwk } from '@sphereon/ssi-sdk-ext.key-utils'
import { DIDDocument, IAgentContext, IIdentifier, IKeyManager } from '@veramo/core'
import { AbstractIdentifierProvider } from '@veramo/did-manager'
import base64url from 'base64url'
import Debug from 'debug'
import { IAddKeyArgs, IAddServiceArgs, ICreateIdentifierArgs, IRemoveKeyArgs, IRequiredContext } from './types/jwk-provider-types'
import { JsonWebKey } from '@sphereon/ssi-types'

const debug = Debug('sphereon:did-provider-jwk')

/**
 * {@link @veramo/did-manager#DIDManager} identifier provider for `did:ion` identifiers
 * @public
 */
export class JwkDIDProvider extends AbstractIdentifierProvider {
  private readonly defaultKms?: string

  constructor(options: { defaultKms?: string }) {
    super()
    this.defaultKms = options.defaultKms
  }

  /** {@inheritDoc @veramo/veramo-core#IDIDManager.didManagerCreate} */
  async createIdentifier(args: ICreateIdentifierArgs, context: IRequiredContext): Promise<Omit<IIdentifier, 'provider'>> {
    const key = await importProvidedOrGeneratedKey(
      {
        // @ts-ignore
        kms: args.kms ?? this.defaultKms,
        alias: args.alias,
        options: args.options,
      },
      context
    )

    const use = jwkDetermineUse(key.type, args?.options?.use)
    const jwk: JsonWebKey = toJwk(key.publicKeyHex, key.type, { use, key, noKidThumbprint: true })
    debug(JSON.stringify(jwk, null, 2))
    const did = `did:jwk:${base64url(JSON.stringify(jwk))}`
    const identifier: Omit<IIdentifier, 'provider'> = {
      did,
      controllerKeyId: `${did}#0`,
      keys: [key],
      services: [],
    }

    debug('Created DID: ', identifier.did)
    return identifier
  }

  /** {@inheritDoc @veramo/veramo-core#IDIDManager.didManagerUpdate} */
  async updateIdentifier?(
    args: { did: string; document: Partial<DIDDocument>; options?: { [x: string]: any } },
    context: IAgentContext<IKeyManager>
  ): Promise<IIdentifier> {
    throw new Error('not implemented yet')
  }

  /** {@inheritDoc @veramo/veramo-core#IDIDManager.didManagerDelete} */
  async deleteIdentifier(identifier: IIdentifier, context: IRequiredContext): Promise<boolean> {
    // JWKs are entirely in memory constructs, without on chain support. Veramo can store them in the did store, but that is not the responsibility of the DID provider itself.
    return true
  }

  /** {@inheritDoc @veramo/veramo-core#IDIDManager.didManagerAddKey} */
  async addKey(args: IAddKeyArgs, context: IRequiredContext): Promise<any> {
    return Promise.reject(Error('Not supported for DID JWKs'))
  }

  /** {@inheritDoc @veramo/veramo-core#IDIDManager.didManagerRemoveKey} */
  async removeKey(args: IRemoveKeyArgs, context: IRequiredContext): Promise<any> {
    return Promise.reject(Error('Not supported for DID JWKs'))
  }

  /** {@inheritDoc @veramo/veramo-core#IDIDManager.didManagerAddService} */
  async addService(args: IAddServiceArgs, context: IRequiredContext): Promise<any> {
    return Promise.reject(Error('Not supported for DID JWKs'))
  }

  /** {@inheritDoc @veramo/veramo-core#IDIDManager.didManagerRemoveService} */
  async removeService(args: IRemoveKeyArgs, context: IRequiredContext): Promise<any> {
    return Promise.reject(Error('Not supported for DID JWKs'))
  }
}
