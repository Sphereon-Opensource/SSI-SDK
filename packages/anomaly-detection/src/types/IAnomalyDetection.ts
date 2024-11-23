import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import { AnomalyDetectionStoreArgs, IAnomalyDetectionStore } from '@sphereon/ssi-sdk.anomaly-detection-store'

export interface IAnomalyDetection extends IPluginMethodMap {
  anomalyDetectionLookupLocation(args: AnomalyDetectionLookupLocationArgs, context: IRequiredContext): Promise<AnomalyDetectionLookupLocationResult>
}

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type AnomalyDetectionLookupLocationArgs = PartialBy<AnomalyDetectionStoreArgs, 'storeId' | 'namespace'>

export type AnomalyDetectionLookupLocationResult = {
  continent?: string
  country?: string
}

export type IRequiredContext = IAgentContext<IAnomalyDetectionStore>
