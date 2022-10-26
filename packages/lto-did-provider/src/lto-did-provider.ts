import { AbstractIdentifierProvider } from '@veramo/did-manager'
import { DIDDocument, IAgentContext, IIdentifier, IKey, IKeyManager, IService, TKeyType } from '@veramo/core'
import { Account, LTO } from 'lto-api'
import { DIDService, hexToBase58, base58ToHex } from '@sphereon/lto-did-ts'
import Debug from 'debug'
import { ICreateIdentifierOpts, ILtoDidProviderOpts, IRequiredContext, IDidConnectionMode, IAddKeyOpts } from './types/lto-provider-types'
import { UniRegistrar } from '@sphereon/did-uni-client'

const debug = Debug('veramo:did-provider-lto')

export class LtoDidProvider extends AbstractIdentifierProvider {
  private readonly defaultKms: string
  private readonly opts: ILtoDidProviderOpts
  private readonly uniRegistrar?: UniRegistrar

  constructor(opts: ILtoDidProviderOpts) {
    super()
    this.defaultKms = opts.defaultKms
    this.opts = { ...opts }
    this.uniRegistrar = this.isUniRegistrarMode()
      ? this.opts.registrarUrl
        ? new UniRegistrar().setBaseURL(this.opts.registrarUrl)
        : new UniRegistrar()
      : undefined
  }

  async createIdentifier(
    { kms, options }: { kms?: string; options?: ICreateIdentifierOpts },
    context: IRequiredContext
  ): Promise<Omit<IIdentifier, 'provider'>> {
    if (this.isUniRegistrarMode()) {
      return this.createIdentifierUsingUniRegistrar(context, kms, options)
    } else {
      return this.createIdentifierUsingNodeRPC(context, kms, options)
    }
  }

  private isUniRegistrarMode() {
    return this.opts?.connectionMode === IDidConnectionMode.UNI
  }

  private async createIdentifierUsingUniRegistrar(
    _context: IAgentContext<IKeyManager>,
    _kms?: string,
    _options?: ICreateIdentifierOpts
  ): Promise<Omit<IIdentifier, 'provider'>> {
    if (!this.uniRegistrar) {
      throw new Error(`Uni registrar mode used, but no registrar is present`)
    }

    throw new Error('Not implemented yet')

    /*const registrarOpts = {
            /!*didVersion: 'FACTOM_V1_JSON',
            managementKeys,
            didKeys,
            tags,
            nonce,
            network: this.network,*!/
        }
        // todo: add services

        const request = new DIDRegistrationRequestBuilder().withOptions(registrarOpts).build()
        const registrationResult = await this.uniRegistrar.create('lto', request)

        const identifier: Omit<IIdentifier, 'provider'> = {
            did: registrationResult.didState.identifier as string,
            controllerKeyId: keys.reverse()[0].kid,
            keys,
            services: [],
        }
        debug('Created', identifier.did)
        return identifier*/
  }

  private async createIdentifierUsingNodeRPC(
    context: IAgentContext<IKeyManager>,
    kms?: string,
    options?: ICreateIdentifierOpts
  ): Promise<Omit<IIdentifier, 'provider'>> {
    const ltoAPI = new LTO(this.opts?.network)
    const providedPrivateKeyBase58 = options?.privateKeyHex ? hexToBase58(options?.privateKeyHex) : undefined
    const didAccount = providedPrivateKeyBase58 ? ltoAPI.createAccountFromPrivateKey(providedPrivateKeyBase58) : ltoAPI.createAccount()
    const didService = this.didService(didAccount.getPrivateSignKey())
    const didKey = await this.createKey(
      context,
      { kms },
      didAccount,
      didAccount.sign.privateKey ? base58ToHex(didAccount.getPrivateSignKey()) : undefined
    )

    return didService
      .createDID({
        verificationMethods: undefined,
        _didAccount: didAccount,
        // We add the verification methods ourselves below so that we can create/import the keys into Veramo's keystore
      })
      .then((did) => {
        const keys = [didKey]

        if (options?.verificationMethods) {
          options.verificationMethods.map(async (verificationMethod) => {
            const account = ltoAPI.createAccount()
            const privateKeyBase58 = account.getPrivateSignKey()
            const verificationKey = await this.createKey(context, { kms }, account, base58ToHex(privateKeyBase58))
            await didService.addVerificationMethod({
              verificationMethodPrivateKeyBase58: privateKeyBase58,
              verificationMethod,
              createVerificationDID: true,
            })
            keys.push(verificationKey)
          })
        }

        // The #sign constant for the controller key is set in stone on the LTO Network
        const identifier: Omit<IIdentifier, 'provider'> = {
          did,
          controllerKeyId: `${did}#sign`,
          keys,
          services: [],
        }
        debug('Created', identifier.did)
        return identifier
      })
  }

  /** {@inheritDoc @veramo/veramo-core#IDIDManager.didManagerUpdate} */
  async updateIdentifier?(
    args: { did: string; document: Partial<DIDDocument>; options?: { [x: string]: any } },
    context: IAgentContext<IKeyManager>
  ): Promise<IIdentifier> {
    throw new Error('not implemented yet')
  }

  async deleteIdentifier(args: IIdentifier, context: IAgentContext<IKeyManager>): Promise<boolean> {
    console.log(`Onchain deletion of LTO DID not supported yet: ${args.did}`)
    return new Promise(() => false)
  }

  async addKey(args: { identifier: IIdentifier; key: IKey; options: IAddKeyOpts }, context: IAgentContext<IKeyManager>): Promise<string> {
    if (!args.identifier.controllerKeyId) {
      return Promise.reject(new Error('No controller key id found'))
    }

    const identifierKey = args.identifier.keys.find((key) => key.kid === args.identifier.controllerKeyId)
    if (!identifierKey) {
      return Promise.reject(new Error(`No matching key found for controllerKeyId: ${args.identifier.controllerKeyId}`))
    }

    const privateKeyBase58 = identifierKey.privateKeyHex ? hexToBase58(identifierKey.privateKeyHex) : undefined
    if (!privateKeyBase58) {
      return Promise.reject(new Error(`No private key hex found for kid: ${identifierKey.kid}`))
    }

    return this.didService(privateKeyBase58)
      .addVerificationMethod({
        verificationMethodPrivateKeyBase58: args.key.privateKeyHex,
        verificationMethod: args.options.verificationMethod,
        createVerificationDID: true,
      })
      .then((account) => `did:lto:${account.address}#sign`)
  }

  removeKey(args: { identifier: IIdentifier; kid: string; options?: any }, context: IAgentContext<IKeyManager>): Promise<any> {
    return Promise.reject(new Error('Not implemented yet'))
  }

  addService(args: { identifier: IIdentifier; service: IService; options?: any }, context: IAgentContext<IKeyManager>): Promise<any> {
    return Promise.reject(new Error('Not implemented yet'))
  }

  removeService(args: { identifier: IIdentifier; id: string; options?: any }, context: IAgentContext<IKeyManager>): Promise<any> {
    return Promise.reject(new Error('Not implemented yet'))
  }

  private didService(didPrivateKeyBase58: string): DIDService {
    return new DIDService({ ...this.opts, didPrivateKeyBase58 })
  }

  private async createKey(
    context: IAgentContext<IKeyManager>,
    { kms }: { kms?: string; alias?: string; options?: any },
    didAccount?: Account,
    privateKeyHex?: string,
    keyType?: TKeyType
  ): Promise<IKey> {
    const key = privateKeyHex
      ? await context.agent.keyManagerImport({
          kms: kms || this.defaultKms,
          publicKeyHex: didAccount ? base58ToHex(didAccount.getPublicSignKey()) : undefined,
          kid: didAccount ? `did:lto:${didAccount.address}#sign` : undefined,
          type: keyType || 'Ed25519',
          privateKeyHex,
        })
      : await context.agent.keyManagerCreate({
          kms: kms || this.defaultKms,
          type: keyType || 'Ed25519',
        })

    return key
  }
}
