import {IAgentContext, IPluginMethodMap} from '@veramo/core'
import {GeolocationStoreArgs, IGeolocationStore} from "@sphereon/ssi-sdk.geolocation-store";

export interface IAnomalyDetection extends IPluginMethodMap {
  anomalyDetectionLookupLocation(args: AnomalyDetectionLookupLocationArgs, context: IRequiredContext): Promise<AnomalyDetectionLookupLocationResult>
}

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type AnomalyDetectionLookupLocationArgs = PartialBy<GeolocationStoreArgs, 'storeId' | 'namespace'>

export type AnomalyDetectionLookupLocationResult = {
  continent?: string
  country?: string
}

export type IRequiredContext = IAgentContext<IGeolocationStore>
