import { DIDDocument, IAgentContext, IIdentifier, IKey, IKeyManager } from '@veramo/core'
import { AbstractIdentifierProvider } from '@veramo/did-manager'
import base64url from 'base64url'
import { determineUse, toJwk, generatePrivateKeyHex } from '../src/functions'
import {
  IAddKeyArgs,
  IAddServiceArgs,
  ICreateIdentifierArgs,
  IImportProvidedOrGeneratedKeyArgs,
  IRemoveKeyArgs,
  IRequiredContext,
  Key,
  KeyUse,
} from './types/jwk-provider-types'
import Debug from 'debug'

const debug = Debug('veramo:jwk-did-provider')

/**
 * {@link @veramo/did-manager#DIDManager} identifier provider for `did:ion` identifiers
 * @public
 */
export class JwkDIDProvider extends AbstractIdentifierProvider {
  private readonly defaultKms: string

  constructor(options: { defaultKms: string }) {
    super()
    this.defaultKms = options.defaultKms
  }

  /** {@inheritDoc @veramo/veramo-core#IDIDManager.didManagerCreate} */
  async createIdentifier(args: ICreateIdentifierArgs, context: IRequiredContext): Promise<Omit<IIdentifier, 'provider'>> {
    const key = await this.importProvidedOrGeneratedKey(
      {
        kms: args.kms,
        options: args.options,
      },
      context
    )

    const use = determineUse(key.type, args?.options?.use)
    const jwk: JsonWebKey = toJwk(key.publicKeyHex, key.type, use)
    const identifier: Omit<IIdentifier, 'provider'> = {
      did: `did:jwk:${base64url(JSON.stringify(jwk))}`,
      controllerKeyId: '#0',
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

  /**
   * We optionally generate and then import our own keys.
   *
   * @param args The key arguments
   * @param context The Veramo agent context
   * @private
   */
  private async importProvidedOrGeneratedKey(args: IImportProvidedOrGeneratedKeyArgs, context: IRequiredContext): Promise<IKey> {
    const type = args.options?.type ? args.options.type : args.options?.key?.type ? (args.options.key.type as Key) : Key.Secp256k1

    if (args.options && args.options?.use === KeyUse.Encryption && type === Key.Ed25519) {
      throw new Error('Ed25519 keys are only valid for signatures')
    }

    let privateKeyHex: string
    if (args.options?.key) {
      if (!args.options.key.privateKeyHex) {
        throw new Error(`We need to have a private key when importing a key`)
      }
      privateKeyHex = args.options.key.privateKeyHex
    } else {
      privateKeyHex = generatePrivateKeyHex(type)
    }

    return context.agent.keyManagerImport({
      kms: args.kms || this.defaultKms,
      type,
      privateKeyHex,
    })
  }
}
