import {IPluginMethodMap} from '@veramo/core'

export interface IAnomalyDetection extends IPluginMethodMap {
  lookupLocation(args: LookupLocationArgs): Promise<LookupLocationResult>
}

export type LookupLocationArgs = {
  ipOrHostname: string,
}

export type LookupLocationResult = {
  continent?: string
  country?: string
} | null
