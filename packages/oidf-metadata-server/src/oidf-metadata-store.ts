import {
  IFederationMetadataClearArgs,
  FederationMetadataExistsArgs,
  IFederationMetadataGetArgs,
  IFederationMetadataListArgs,
  IFederationMetadataPersistArgs,
  FederationMetadataRemoveArgs,
  IFederationMetadataStoreOpts,
  IOIDFMetadataStore,
  OpenidFederationMetadata,
  OptionalOpenidFederationMetadata,
  OptionalOpenidFederationValueData,
  FederationMetadataImportArgs,
} from './types/metadata-store'
import { IKeyValueStore, KeyValueStore } from '@sphereon/ssi-sdk.kv-store-temp'
import { IAgentPlugin } from '@veramo/core'

import { schema } from './index'
import { IMetadataImportArgs } from '@sphereon/ssi-types'

export class OIDFMetadataStore implements IAgentPlugin {
  private readonly defaultStoreId: string
  private readonly defaultNamespace: string
  private readonly _openidFederationMetadataStores: Map<string, IKeyValueStore<OpenidFederationMetadata>>

  readonly schema = schema.IOIDFMetadataStore
  readonly methods: IOIDFMetadataStore = {
    oidfStoreGetMetadata: this.oidfStoreGetMetadata.bind(this),
    oidfStoreListMetadata: this.oidfStoreListMetadata.bind(this),
    oidfStoreHasMetadata: this.oidfStoreHasMetadata.bind(this),
    oidfStorePersistMetadata: this.oidfStorePersistMetadata.bind(this),
    oidfStoreImportMetadatas: this.oidfStoreImportMetadatas.bind(this),
    oidfStoreRemoveMetadata: this.oidfStoreRemoveMetadata.bind(this),
    oidfStoreClearAllMetadata: this.oidfStoreClearAllMetadata.bind(this),
  }

  constructor(options?: IFederationMetadataStoreOpts) {
    this.defaultStoreId = options?.defaultStoreId ?? '_default'
    this.defaultNamespace = options?.defaultNamespace ?? 'oidFederation'

    if (options?.openidFederationMetadataStores && options.openidFederationMetadataStores instanceof Map) {
      this._openidFederationMetadataStores = options.openidFederationMetadataStores
    } else if (options?.openidFederationMetadataStores) {
      this._openidFederationMetadataStores = new Map().set(this.defaultStoreId, options.openidFederationMetadataStores)
    } else {
      this._openidFederationMetadataStores = new Map().set(
        this.defaultStoreId,
        new KeyValueStore({
          namespace: this.defaultNamespace,
          store: new Map<string, OpenidFederationMetadata>(),
        }),
      )
    }
  }

  private store(args: { stores: Map<string, IKeyValueStore<OpenidFederationMetadata>>; storeId?: string }): IKeyValueStore<OpenidFederationMetadata> {
    const storeId = this.storeIdStr({ storeId: args.storeId })
    const store = args.stores.get(storeId)
    if (!store) {
      throw Error(`Could not get federation metadata store: ${storeId}`)
    }
    return store
  }

  async oidfStoreGetMetadata({ correlationId, storeId, namespace }: IFederationMetadataGetArgs): Promise<OptionalOpenidFederationMetadata> {
    return this.store({
      stores: this._openidFederationMetadataStores,
      storeId,
    }).get(this.prefix({ namespace, correlationId }))
  }

  async oidfStoreListMetadata({ storeId, namespace }: IFederationMetadataListArgs): Promise<Array<OpenidFederationMetadata>> {
    const result = await this.store({
      stores: this._openidFederationMetadataStores,
      storeId,
    }).getMany([`${this.namespaceStr({ namespace })}`])
    return result.filter((value) => !!value)
  }

  async oidfStoreHasMetadata({ correlationId, storeId, namespace }: FederationMetadataExistsArgs): Promise<boolean> {
    return this.store({
      stores: this._openidFederationMetadataStores,
      storeId,
    }).has(this.prefix({ namespace, correlationId }))
  }

  async oidfStorePersistMetadata(args: IFederationMetadataPersistArgs): Promise<OptionalOpenidFederationValueData> {
    const namespace = this.namespaceStr(args)
    const storeId = this.storeIdStr(args)
    const { metadataType, correlationId, metadata, ttl } = args
    if (metadataType !== 'openidFederation') {
      return undefined
    }

    const existingOpenIdFederation = await this.store({
      stores: this._openidFederationMetadataStores,
      storeId,
    }).getAsValueData(this.prefix({ namespace, correlationId }))

    if (!existingOpenIdFederation.value || (existingOpenIdFederation.value && args.overwriteExisting !== false)) {
      return await this.store({
        stores: this._openidFederationMetadataStores,
        storeId,
      }).set(this.prefix({ namespace, correlationId }), metadata as OpenidFederationMetadata, ttl)
    }
    return existingOpenIdFederation
  }

  async oidfStoreImportMetadatas(items: Array<IMetadataImportArgs>): Promise<boolean> {
    await Promise.all(
      items.map((args) => {
        const fedArgs = args as FederationMetadataImportArgs
        return this.oidfStorePersistMetadata(fedArgs)
      }),
    )
    return true
  }

  async oidfStoreRemoveMetadata(args: FederationMetadataRemoveArgs): Promise<boolean> {
    const namespace = this.namespaceStr(args)
    const storeId = this.storeIdStr(args)

    return this.store({
      stores: this._openidFederationMetadataStores,
      storeId,
    }).delete(this.prefix({ namespace, correlationId: args.correlationId }))
  }

  async oidfStoreClearAllMetadata({ storeId }: IFederationMetadataClearArgs): Promise<boolean> {
    return await this.store({
      stores: this._openidFederationMetadataStores,
      storeId,
    })
      .clear()
      .then(() => true)
  }

  private storeIdStr({ storeId }: { storeId?: string }): string {
    return storeId ?? this.defaultStoreId
  }

  private namespaceStr({ namespace }: { namespace?: string }): string {
    return namespace ?? this.defaultNamespace
  }

  private prefix({ namespace, correlationId }: { namespace?: string; correlationId: string }): string {
    return `${this.namespaceStr({ namespace })}:${correlationId}`
  }
}
