import {IAgentContext, IPluginMethodMap} from '@veramo/core'
import {AnomalyDetectionStoreArgs, IAnomalyDetectionStore} from "@sphereon/ssi-sdk.anomaly-detection-store";
import {Optional} from "nx/src/project-graph/plugins";

export interface IAnomalyDetection extends IPluginMethodMap {
  anomalyDetectionLookupLocation(args: AnomalyDetectionLookupLocationArgs, context: IRequiredContext): Promise<AnomalyDetectionLookupLocationResult>
}

export type AnomalyDetectionLookupLocationArgs = Optional<AnomalyDetectionStoreArgs, 'storeId' | 'namespace'>

export type AnomalyDetectionLookupLocationResult = {
  continent?: string
  country?: string
}

export type IRequiredContext = IAgentContext<IAnomalyDetectionStore>
