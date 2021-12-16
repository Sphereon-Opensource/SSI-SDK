import { AbstractIdentifierProvider } from '@veramo/did-manager'
import { IAgentContext, IIdentifier, IKey, IKeyManager, IService, ManagedKeyInfo } from '@veramo/core'
import { DIDRegistrationRequestBuilder, UniRegistrar } from '@sphereon/did-uni-client'
import Debug from 'debug'
import { hexToMultibase, multibaseToHex } from '@sphereon/ssi-sdk-core'
import { ICreateIdentifierOpts, IDidKeyOpts, IManagementKeyOpts } from './types/factom-provider-types'
import { MultibaseFormat } from '@sphereon/ssi-sdk-core/dist/utils/encoding'

const debug = Debug('veramo:did-provider-factom')

export type IRequiredContext = IAgentContext<IKeyManager>

export class FactomDIDProvider extends AbstractIdentifierProvider {
  private readonly defaultKms: string
  private readonly defaultNetwork: string | number
  private readonly registrar: UniRegistrar

  constructor(opts: { defaultKms: string; defaultNetwork?: string | number; registrarUrl?: string }) {
    super()
    this.defaultKms = opts.defaultKms
    this.defaultNetwork = opts.defaultNetwork || 'MAINNET'
    this.registrar = opts.registrarUrl ? new UniRegistrar().setBaseURL(opts.registrarUrl) : new UniRegistrar()
  }

  async createIdentifier(
    {
      kms,
      options,
    }: {
      kms?: string
      options?: ICreateIdentifierOpts
    },
    context: IRequiredContext
  ): Promise<Omit<IIdentifier, 'provider'>> {
    const tags = options?.tags
    const nonce = options?.nonce

    let keys: ManagedKeyInfo[] = []
    const didKeys = !options
      ? undefined
      : await Promise.all(
          options.didKeys.map(async (didKey) => {
            const factomKey = await this.createKey(didKey, context, { kms })
            const { key, ...payload } = factomKey
            // keys.push(key);
            return {
              ...payload,
              priorityRequirement: didKey.priorityRequirement || 0,
            }
          })
        )
    const managementKeys = !options
      ? undefined
      : await Promise.all(
          options.managementKeys.map(async (mgmtKey) => {
            const factomKey = await this.createKey(mgmtKey, context, { kms })
            const { key, ...payload } = factomKey
            keys.push(key)
            return { ...payload, priority: mgmtKey.priority || 0 }
          })
        )

    const factomOpts = {
      didVersion: 'FACTOM_V1_JSON',
      managementKeys,
      didKeys,
      tags,
      nonce,
      network: this.defaultNetwork,
    }
    // todo: add services

    const request = new DIDRegistrationRequestBuilder().withOptions(factomOpts).build()
    const registrationResult = await this.registrar.create('factom', request)

    const identifier: Omit<IIdentifier, 'provider'> = {
      did: registrationResult.didState.identifier as string,
      controllerKeyId: keys.reverse()[0].kid,
      keys,
      services: [],
    }
    debug('Created', identifier.did)
    return identifier
  }

  async deleteIdentifier(args: IIdentifier, context: IAgentContext<IKeyManager>): Promise<boolean> {
    return Promise.resolve(false)
  }

  addKey(args: { identifier: IIdentifier; key: IKey; options?: any }, context: IAgentContext<IKeyManager>): Promise<any> {
    return Promise.resolve(undefined)
  }

  removeKey(args: { identifier: IIdentifier; kid: string; options?: any }, context: IAgentContext<IKeyManager>): Promise<any> {
    return Promise.resolve(undefined)
  }

  addService(args: { identifier: IIdentifier; service: IService; options?: any }, context: IAgentContext<IKeyManager>): Promise<any> {
    return Promise.resolve(undefined)
  }

  removeService(args: { identifier: IIdentifier; id: string; options?: any }, context: IAgentContext<IKeyManager>): Promise<any> {
    return Promise.resolve(undefined)
  }

  private async createKey(
    keyArg: IManagementKeyOpts | IDidKeyOpts,
    context: IAgentContext<IKeyManager>,
    { kms }: { kms?: string; alias?: string; options?: any }
  ) {
    const agentKey = keyArg.privateKeyMultibase
      ? await context.agent.keyManagerImport({
          kms: kms || this.defaultKms,
          type: 'Ed25519',
          privateKeyHex: multibaseToHex(keyArg.privateKeyMultibase).value,
        })
      : await context.agent.keyManagerCreate({
          kms: kms || this.defaultKms,
          type: 'Ed25519',
        })
    let publicKeyMultibase = hexToMultibase(agentKey.publicKeyHex, MultibaseFormat.BASE58).value
    if (!publicKeyMultibase.startsWith('z')) {
      publicKeyMultibase = `z${publicKeyMultibase}`
    }
    const purpose = 'purpose' in keyArg ? keyArg.purpose : undefined
    return {
      key: agentKey,
      type: 'Ed25519VerificationKey2020',
      purpose,
      keyIdentifier: agentKey.kid,
      publicKeyMultibase,
    }
  }
}
