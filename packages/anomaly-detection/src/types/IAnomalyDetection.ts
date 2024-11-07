import {IAgentContext, IPluginMethodMap} from '@veramo/core'
import {IResourceResolver} from "@sphereon/ssi-sdk.resource-resolver";

export interface IAnomalyDetection extends IPluginMethodMap {
  lookupLocation(args: LookupLocationArgs, context: IRequiredContext): Promise<LookupLocationResult>
}

export type LookupLocationArgs = {
  ipOrHostname: string,
}

export type LookupLocationResult = {
  continent?: string
  country?: string
} | null

export type IRequiredContext = IAgentContext<IResourceResolver>
