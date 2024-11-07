import {IAgentContext, IPluginMethodMap} from '@veramo/core'

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

export type IRequiredContext = IAgentContext<never>
