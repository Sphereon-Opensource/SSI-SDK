import {
  IDefinitionCredentialFilterArgs,
  IDefinitionExistsArgs,
  IDefinitionGetArgs,
  IDefinitionPersistArgs,
  IDefinitionRemoveArgs,
  IDefinitionsClearArgs,
  IPEXFilterResult,
  IPEXFilterResultWithInputDescriptor,
  IRequiredContext,
  PEXOpts,
  schema,
  VersionDiscoveryResult,
} from '../index'
import { FindCredentialsArgs, IAgentPlugin } from '@veramo/core'

import { IPresentationExchange } from '../types/IPresentationExchange'
import { IKeyValueStore, IValueData, KeyValueStore } from '@veramo/kv-store'
import { Checked, IPresentationDefinition, PEX } from '@sphereon/pex'
import { CredentialMapper, JWT_PROOF_TYPE_2020, W3CVerifiableCredential } from '@sphereon/ssi-types'
import { InputDescriptorV1, InputDescriptorV2 } from '@sphereon/pex-models'
import { toDIDs } from '@sphereon/ssi-sdk-ext.did-utils'

export class PresentationExchange implements IAgentPlugin {
  private readonly _stores: Map<string, IKeyValueStore<IPresentationDefinition>>
  readonly schema = schema.IDidAuthSiopOpAuthenticator
  private readonly defaultStore: string
  private readonly defaultNamespace: string

  readonly methods: IPresentationExchange = {
    pexStoreGetDefinition: this.pexStoreGetDefinition.bind(this),
    pexStorePersistDefinition: this.pexStorePersistDefinition.bind(this),
    pexStoreHasDefinition: this.pexStoreHasDefinition.bind(this),
    pexStoreRemoveDefinition: this.pexStoreRemoveDefinition.bind(this),
    pexStoreClearDefinitions: this.pexStoreClearDefinitions.bind(this),
    pexDefinitionVersion: this.pexDefinitionVersion.bind(this),
    pexDefinitionFilterCredentials: this.pexDefinitionFilterCredentials.bind(this),
    pexDefinitionFilterCredentialsPerInputDescriptor: this.pexDefinitionFilterCredentialsPerInputDescriptor.bind(this),
  }

  constructor(opts?: PEXOpts) {
    this.defaultStore = opts?.defaultStore ?? '_default'
    this.defaultNamespace = opts?.defaultNamespace ?? 'pex'
    if (opts?.stores && opts.stores instanceof Map) {
      this._stores = opts.stores
    } else if (opts?.stores) {
      this._stores = new Map().set(this.defaultStore, opts.stores)
    } else {
      this._stores = new Map().set(
        this.defaultStore,
        new KeyValueStore({
          namespace: this.defaultNamespace,
          store: new Map<string, IPresentationDefinition>(),
        })
      )
    }
    if (opts && Array.isArray(opts?.importDefinitions)) {
      opts.importDefinitions.forEach(this.pexStorePersistDefinition)
    }
  }

  private async pexStoreGetDefinition({ definitionId, storeId, namespace }: IDefinitionGetArgs): Promise<IPresentationDefinition | undefined> {
    return this.store({ storeId }).get(this.prefix({ namespace, definitionId }))
  }

  private async pexStoreHasDefinition({ definitionId, storeId, namespace }: IDefinitionExistsArgs): Promise<boolean> {
    return this.store({ storeId }).has(this.prefix({ namespace, definitionId }))
  }

  private async pexStorePersistDefinition(args: IDefinitionPersistArgs): Promise<IValueData<IPresentationDefinition>> {
    const { definition, ttl, storeId, namespace } = args
    if (args?.validation !== false) {
      let invalids: Checked[] = []

      try {
        const result = PEX.validateDefinition(definition) // throws an error in case the def is not valid
        const validations = Array.isArray(result) ? result : [result]
        invalids = validations.filter((v) => v.status === 'error')
      } catch (error) {
        invalids.push({
          status: 'error',
          message:
            typeof error === 'string'
              ? error
              : typeof error === 'object' && 'message' in (error as object)
              ? (error as Error).message
              : 'unknown error',
          tag: 'validation',
        })
      }
      if (invalids.length > 0) {
        throw Error(`Invalid definition. ${invalids.map((v) => v.message).toString()}`)
      }
    }
    const definitionId = args.definitionId ?? definition.id
    const existing = await this.store({ storeId }).getAsValueData(this.prefix({ namespace, definitionId }))
    if (!existing.value || (existing.value && args.overwriteExisting !== false)) {
      return await this.store({ storeId }).set(this.prefix({ namespace, definitionId }), definition, ttl)
    }
    return existing
  }

  private async pexStoreRemoveDefinition({ storeId, definitionId, namespace }: IDefinitionRemoveArgs): Promise<boolean> {
    return this.store({ storeId }).delete(this.prefix({ namespace, definitionId }))
  }

  private async pexStoreClearDefinitions({ storeId }: IDefinitionsClearArgs): Promise<boolean> {
    return await this.store({ storeId })
      .clear()
      .then(() => true)
  }

  async pexDefinitionVersion(presentationDefinition: IPresentationDefinition): Promise<VersionDiscoveryResult> {
    return PEX.definitionVersionDiscovery(presentationDefinition)
  }

  async pexDefinitionFilterCredentials(args: IDefinitionCredentialFilterArgs, context: IRequiredContext): Promise<IPEXFilterResult> {
    const credentials = await this.pexFilterCredentials(args.credentialFilterOpts ?? {}, context)
    const holderDIDs = args.holderDIDs ? toDIDs(args.holderDIDs) : toDIDs(await context.agent.dataStoreORMGetIdentifiers())
    const selectResults = new PEX().selectFrom(args.presentationDefinition, credentials ?? [], {
      ...args,
      holderDIDs,
      limitDisclosureSignatureSuites: args.limitDisclosureSignatureSuites ?? ['BbsBlsSignature2020'],
    })
    return {
      id: args.presentationDefinition.id,
      selectResults,
      filteredCredentials: selectResults.verifiableCredential?.map((vc) => CredentialMapper.storedCredentialToOriginalFormat(vc)) ?? [],
    }
  }

  async pexDefinitionFilterCredentialsPerInputDescriptor(
    args: IDefinitionCredentialFilterArgs,
    context: IRequiredContext
  ): Promise<IPEXFilterResultWithInputDescriptor[]> {
    const origDefinition = args.presentationDefinition
    const credentials = await this.pexFilterCredentials(args.credentialFilterOpts ?? {}, context)
    const holderDIDs = args.holderDIDs ? toDIDs(args.holderDIDs) : toDIDs(await context.agent.dataStoreORMGetIdentifiers())
    const limitDisclosureSignatureSuites = args.limitDisclosureSignatureSuites

    const promises = new Map<InputDescriptorV1 | InputDescriptorV2, Promise<IPEXFilterResult>>()
    origDefinition.input_descriptors.forEach((inputDescriptor) => {
      const presentationDefinition = {
        id: inputDescriptor.id,
        input_descriptors: [inputDescriptor],
      }
      promises.set(
        inputDescriptor,
        this.pexDefinitionFilterCredentials(
          {
            credentialFilterOpts: { verifiableCredentials: credentials },
            presentationDefinition,
            holderDIDs,
            limitDisclosureSignatureSuites,
          },
          context
        )
      )
    })
    await Promise.all(promises.values())
    const result: IPEXFilterResultWithInputDescriptor[] = []
    for (const entry of promises.entries()) {
      result.push({ ...(await entry[1]), inputDescriptor: entry[0] })
    }
    return result
  }

  private async pexFilterCredentials(
    filterOpts: {
      verifiableCredentials?: W3CVerifiableCredential[]
      filter?: FindCredentialsArgs
    },
    context: IRequiredContext
  ): Promise<W3CVerifiableCredential[]> {
    if (filterOpts?.verifiableCredentials && filterOpts.verifiableCredentials.length > 0) {
      return filterOpts.verifiableCredentials as W3CVerifiableCredential[]
    }
    return (await context.agent.dataStoreORMGetVerifiableCredentials(filterOpts?.filter))
      .map((uniqueVC) => uniqueVC.verifiableCredential)
      .map((vc) => (vc.proof && vc.proof.type === JWT_PROOF_TYPE_2020 ? vc.proof.jwt : vc))
  }

  /*private assertIdentifier(identifier?: IIdentifier): void {
    if (!identifier) {
      throw Error(`OID4VP needs an identifier at this point`)
    }
  }*/

  private store({ storeId }: { storeId?: string }): IKeyValueStore<IPresentationDefinition> {
    const store = this._stores.get(storeId ?? this.defaultStore)
    if (!store) {
      throw Error(`Could not get definition store: ${storeId ?? this.defaultStore}`)
    }
    return store
  }

  private namespace({ namespace }: { namespace?: string }): string {
    return namespace ?? this.defaultStore
  }

  private prefix({ namespace, definitionId }: { namespace?: string; definitionId: string }) {
    return `${this.namespace({ namespace })}:${definitionId}`
  }
}
