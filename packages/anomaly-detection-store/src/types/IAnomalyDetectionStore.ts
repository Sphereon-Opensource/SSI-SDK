import {IPluginMethodMap} from '@veramo/core'
import {IKeyValueStore, IValueData} from "@sphereon/ssi-sdk.kv-store-temp";

export interface IAnomalyDetectionStore extends IPluginMethodMap {
  anomalyDetectionStoreDefaultLocationStore(): Promise<AnomalyDetectionStoreLocationResult>
  anomalyDetectionStorePersistLocation(args: AnomalyDetectionStoreLocationPersistArgs): Promise<AnomalyDetectionStoreLocationResultIValueData>
  anomalyDetectionStoreHasLocation(args: AnomalyDetectionStoreArgs): Promise<boolean>
  anomalyDetectionStoreRemoveLocation(args: AnomalyDetectionStoreArgs): Promise<boolean>
  anomalyDetectionStoreClearAllLocations(args: AnomalyDetectionStoreClearAllLocationsArgs): Promise<boolean>
  anomalyDetectionStoreGetLocation(args: AnomalyDetectionStoreArgs): Promise<AnomalyDetectionStoreLocationResultOrUndefined>
}

export type AnomalyDetectionStoreLocation = {
  continent?: string
  country?: string
}

export type AnomalyDetectionStorePersistArgs = {
  ipOrHostname: string
  overwriteExisting?: boolean
  validation?: boolean
  ttl?: number
  storeId?: string
  namespace?: string
}

export type AnomalyDetectionStoreArgs = {
  ipOrHostname: string
  storeId: string
  namespace: string
}

export type AnomalyDetectionStoreClearAllLocationsArgs = Pick<AnomalyDetectionStoreArgs, 'storeId'>

export type AnomalyDetectionStoreLocationPersistArgs = AnomalyDetectionStorePersistArgs & {
  locationArgs: AnomalyDetectionStoreLocation
}

export type AnomalyDetectionStoreLocationResult = IKeyValueStore<AnomalyDetectionStoreLocation>

export type AnomalyDetectionStoreLocationResultOrUndefined = AnomalyDetectionStoreLocation | undefined

export type AnomalyDetectionStoreLocationResultIValueData = IValueData<AnomalyDetectionStoreLocation>
