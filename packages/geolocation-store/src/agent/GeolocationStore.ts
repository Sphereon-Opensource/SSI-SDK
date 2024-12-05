import { IAgentPlugin } from '@veramo/core'
import {
  GeolocationStoreArgs,
  GeolocationStoreClearAllLocationsArgs,
  GeolocationStoreLocation,
  GeolocationStoreLocationPersistArgs,
  GeolocationStoreLocationResult,
  GeolocationStoreLocationResultIValueData,
  GeolocationStoreLocationResultOrUndefined,
  IGeolocationStore,
  schema,
} from '../index'

import { IKeyValueStore, KeyValueStore, ValueStoreType } from '@sphereon/ssi-sdk.kv-store-temp'

export const geolocationStoreMethods: Array<string> = [
  'geolocationStorePersistLocation',
  'geolocationStoreHasLocation',
  'geolocationStoreRemoveLocation',
  'geolocationStoreClearAllLocations',
  'geolocationStoreGetLocation',
  'geolocationStoreDefaultLocationStore',
]

/**
 * {@inheritDoc IGeolocationStore}
 */
export class GeolocationStore implements IAgentPlugin {
  readonly schema = schema.IAnomalyDetectionStore
  private readonly defaultStoreId: string
  private readonly defaultNamespace: string
  private readonly _dnsLookupStore: Map<string, IKeyValueStore<GeolocationStoreLocation>>

  readonly methods: IGeolocationStore = {
    geolocationStorePersistLocation: this.geolocationStorePersistLocation.bind(this),
    geolocationStoreHasLocation: this.geolocationStoreHasLocation.bind(this),
    geolocationStoreRemoveLocation: this.geolocationStoreRemoveLocation.bind(this),
    geolocationStoreClearAllLocations: this.geolocationStoreClearAllLocations.bind(this),
    geolocationStoreGetLocation: this.geolocationStoreGetLocation.bind(this),
    geolocationStoreDefaultLocationStore: this.geolocationStoreDefaultLocationStore.bind(this),
  }

  constructor(args: {
    defaultStoreId?: string
    defaultNamespace?: string
    dnsLookupStore?: Map<string, IKeyValueStore<GeolocationStoreLocation>> | IKeyValueStore<GeolocationStoreLocation>
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
          store: new Map<string, GeolocationStoreLocation>(),
        }),
      )
    }
  }

  private async geolocationStorePersistLocation(args: GeolocationStoreLocationPersistArgs): Promise<GeolocationStoreLocationResultIValueData> {
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

  private async geolocationStoreHasLocation(args: GeolocationStoreArgs): Promise<boolean> {
    const { storeId, namespace, ipOrHostname } = { ...args }
    return this.store({ stores: this._dnsLookupStore, storeId }).has(this.prefix({ namespace, ipOrHostname }))
  }

  private async geolocationStoreRemoveLocation(args: GeolocationStoreArgs): Promise<boolean> {
    const { storeId, namespace, ipOrHostname } = { ...args }
    return this.store({ stores: this._dnsLookupStore, storeId }).delete(this.prefix({ namespace, ipOrHostname }))
  }

  private async geolocationStoreClearAllLocations(args: GeolocationStoreClearAllLocationsArgs): Promise<boolean> {
    const { storeId } = { ...args }
    return await this.store({ stores: this._dnsLookupStore, storeId })
      .clear()
      .then(() => true)
  }

  private async geolocationStoreGetLocation(args: GeolocationStoreArgs): Promise<GeolocationStoreLocationResultOrUndefined> {
    const { storeId, namespace, ipOrHostname } = { ...args }
    return this.store<GeolocationStoreLocation>({
      stores: this._dnsLookupStore,
      storeId,
    }).get(this.prefix({ namespace, ipOrHostname }))
  }

  private store<T extends ValueStoreType>(args: { stores: Map<string, IKeyValueStore<T>>; storeId?: string }): IKeyValueStore<T> {
    const storeId = this.storeIdStr({ storeId: args.storeId })
    const store = args.stores.get(storeId)
    if (!store) {
      throw Error(`Could not get geolocation store: ${storeId}`)
    }
    return store
  }

  private storeIdStr({ storeId }: { storeId?: string }): string {
    return storeId ?? this.defaultStoreId
  }

  private geolocationStoreDefaultLocationStore(): Promise<GeolocationStoreLocationResult> {
    return Promise.resolve(this.store({ stores: this._dnsLookupStore, storeId: this.defaultStoreId }))
  }

  private namespaceStr({ namespace }: { namespace?: string }): string {
    return namespace ?? this.defaultNamespace
  }

  private prefix({ namespace, ipOrHostname }: { namespace?: string; ipOrHostname: string }): string {
    return `${this.namespaceStr({ namespace })}:${ipOrHostname}`
  }
}
