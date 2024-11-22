import {IAgentPlugin} from '@veramo/core'
import {
  AnomalyDetectionStoreArgs,
  AnomalyDetectionStoreClearAllLocationsArgs,
  AnomalyDetectionStoreLocation,
  AnomalyDetectionStoreLocationPersistArgs,
  AnomalyDetectionStoreLocationResult,
  AnomalyDetectionStoreLocationResultIValueData,
  AnomalyDetectionStoreLocationResultOrUndefined,
  IAnomalyDetectionStore,
  schema
} from '../index'

import {IKeyValueStore, KeyValueStore, ValueStoreType} from "@sphereon/ssi-sdk.kv-store-temp";

export const anomalyDetectionStoreMethods: Array<string> = [
  'anomalyDetectionStorePersistLocation',
  'anomalyDetectionStoreHasLocation',
  'anomalyDetectionStoreRemoveLocation',
  'anomalyDetectionStoreClearAllLocations',
  'anomalyDetectionStoreGetLocation',
  'anomalyDetectionStoreDefaultLocationStore'
]

/**
 * {@inheritDoc IAnomalyDetectionStore}
 */
export class AnomalyDetectionStore implements IAgentPlugin {
  readonly schema = schema.IAnomalyDetectionStore
  private readonly defaultStoreId: string
  private readonly defaultNamespace: string
  private readonly _dnsLookupStore: Map<string, IKeyValueStore<AnomalyDetectionStoreLocation>>

  readonly methods: IAnomalyDetectionStore = {
    anomalyDetectionStorePersistLocation: this.anomalyDetectionStorePersistLocation.bind(this),
    anomalyDetectionStoreHasLocation: this.anomalyDetectionStoreHasLocation.bind(this),
    anomalyDetectionStoreRemoveLocation: this.anomalyDetectionStoreRemoveLocation.bind(this),
    anomalyDetectionStoreClearAllLocations: this.anomalyDetectionStoreClearAllLocations.bind(this),
    anomalyDetectionStoreGetLocation: this.anomalyDetectionStoreGetLocation.bind(this),
    anomalyDetectionStoreDefaultLocationStore: this.anomalyDetectionStoreDefaultLocationStore.bind(this)
  }

  constructor(args: {
    defaultStoreId?: string;
    defaultNamespace?: string;
    dnsLookupStore?: Map<string, IKeyValueStore<AnomalyDetectionStoreLocation>> | IKeyValueStore<AnomalyDetectionStoreLocation>
  }) {
    this.defaultStoreId = args?.defaultStoreId ?? '_default'
    this.defaultNamespace = args?.defaultNamespace ?? 'anomaly-detection'

    if (args?.dnsLookupStore !== undefined && args?.dnsLookupStore !== null && args.dnsLookupStore instanceof Map) {
      this._dnsLookupStore = args.dnsLookupStore
    } else {
      this._dnsLookupStore = new Map().set(
          this.defaultStoreId,
          new KeyValueStore({
            namespace: this.defaultNamespace,
            store: new Map<string, AnomalyDetectionStoreLocation>(),
          }),
      )
    }
  }

  private async anomalyDetectionStorePersistLocation(args: AnomalyDetectionStoreLocationPersistArgs): Promise<AnomalyDetectionStoreLocationResultIValueData> {
    const storeId = this.storeIdStr(args)
    const namespace = this.namespaceStr(args)
    const { ipOrHostname, locationArgs, ttl } = args

    if (args?.validation !== false) {
      // TODO
    }
    const existing = await this.store({ stores: this._dnsLookupStore, storeId }).getAsValueData(
        this.prefix({
          namespace,
          ipOrHostname,
        }),
    )
    if (!existing.value || (existing.value && args?.overwriteExisting !== false)) {
      return await this.store({ stores: this._dnsLookupStore, storeId }).set(
          this.prefix({
            namespace,
            ipOrHostname,
          }),
          locationArgs,
          ttl,
      )
    }
    return existing
  }

  private async anomalyDetectionStoreHasLocation(args: AnomalyDetectionStoreArgs): Promise<boolean> {
    const { storeId, namespace, ipOrHostname  } = { ...args }
    return this.store({ stores: this._dnsLookupStore, storeId }).has(this.prefix({ namespace, ipOrHostname }))
  }

  private async anomalyDetectionStoreRemoveLocation(args: AnomalyDetectionStoreArgs): Promise<boolean> {
    const { storeId, namespace, ipOrHostname } = { ...args }
    return this.store({ stores: this._dnsLookupStore, storeId }).delete(this.prefix({ namespace, ipOrHostname }))
  }

  private async anomalyDetectionStoreClearAllLocations(args: AnomalyDetectionStoreClearAllLocationsArgs): Promise<boolean> {
    const { storeId } = { ...args }
    return await this.store({ stores: this._dnsLookupStore, storeId })
        .clear()
        .then(() => true)
  }

  private async anomalyDetectionStoreGetLocation(args: AnomalyDetectionStoreArgs): Promise<AnomalyDetectionStoreLocationResultOrUndefined> {
    const { storeId, namespace, ipOrHostname } = { ... args }
    return this.store<AnomalyDetectionStoreLocation>({
      stores: this._dnsLookupStore,
      storeId,
    }).get(this.prefix({ namespace, ipOrHostname }))
  }

  private store<T extends ValueStoreType>(args: { stores: Map<string, IKeyValueStore<T>>; storeId?: string }): IKeyValueStore<T> {
    const storeId = this.storeIdStr({ storeId: args.storeId })
    const store = args.stores.get(storeId)
    if (!store) {
      throw Error(`Could not get issuer metadata store: ${storeId}`)
    }
    return store
  }

  private storeIdStr({ storeId }: { storeId?: string }): string {
    return storeId ?? this.defaultStoreId
  }

  private anomalyDetectionStoreDefaultLocationStore(): Promise<AnomalyDetectionStoreLocationResult> {
    return Promise.resolve(this.store({ stores: this._dnsLookupStore, storeId: this.defaultStoreId }))
  }

  private namespaceStr({ namespace }: { namespace?: string }): string {
    return namespace ?? this.defaultNamespace
  }

  private prefix({ namespace, ipOrHostname }: { namespace?: string; ipOrHostname: string }): string {
    return `${this.namespaceStr({ namespace })}:${ipOrHostname}`
  }
}
