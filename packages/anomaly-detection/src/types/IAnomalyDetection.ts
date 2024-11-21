import {IPluginMethodMap} from '@veramo/core'

export interface IAnomalyDetection extends IPluginMethodMap {
  anomalyDetectionLookupLocation(args: AnomalyDetectionLookupLocationArgs): Promise<AnomalyDetectionLookupLocationResult>
}

export type AnomalyDetectionLookupLocationArgs = {
  ipOrHostname: string,
}

export type AnomalyDetectionLookupLocationResult = {
  continent?: string
  country?: string
}

export type AnomalyDetectionPersistArgs = {
  locationId: string
  overwriteExisting?: boolean
  validation?: boolean
  ttl?: number
  storeId?: string
  namespace?: string
}

export type AnomalyDetectionLocationPersistArgs = AnomalyDetectionPersistArgs & {
  locationArgs: { continent?: string; country?: string }
}
