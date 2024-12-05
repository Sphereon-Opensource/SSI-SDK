import { IPluginMethodMap } from '@veramo/core'
import { IKeyValueStore, IValueData } from '@sphereon/ssi-sdk.kv-store-temp'

export interface IGeolocationStore extends IPluginMethodMap {
  geolocationStoreDefaultLocationStore(): Promise<GeolocationStoreLocationResult>
  geolocationStorePersistLocation(args: GeolocationStoreLocationPersistArgs): Promise<GeolocationStoreLocationResultIValueData>
  geolocationStoreHasLocation(args: GeolocationStoreArgs): Promise<boolean>
  geolocationStoreRemoveLocation(args: GeolocationStoreArgs): Promise<boolean>
  geolocationStoreClearAllLocations(args: GeolocationStoreClearAllLocationsArgs): Promise<boolean>
  geolocationStoreGetLocation(args: GeolocationStoreArgs): Promise<GeolocationStoreLocationResultOrUndefined>
}

export type GeolocationStoreLocation = {
  continent?: string
  country?: string
}

export type GeolocationStorePersistArgs = {
  ipOrHostname: string
  overwriteExisting?: boolean
  validation?: boolean
  ttl?: number
  storeId?: string
  namespace?: string
}

export type GeolocationStoreArgs = {
  ipOrHostname: string
  storeId: string
  namespace: string
}

export type GeolocationStoreClearAllLocationsArgs = Pick<GeolocationStoreArgs, 'storeId'>

export type GeolocationStoreLocationPersistArgs = GeolocationStorePersistArgs & {
  locationArgs: GeolocationStoreLocation
}

export type GeolocationStoreLocationResult = IKeyValueStore<GeolocationStoreLocation>

export type GeolocationStoreLocationResultOrUndefined = GeolocationStoreLocation | undefined

export type GeolocationStoreLocationResultIValueData = IValueData<GeolocationStoreLocation>
