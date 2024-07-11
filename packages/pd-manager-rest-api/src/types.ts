import { GenericAuthArgs, ISingleEndpointOpts } from '@sphereon/ssi-express-support'
import { IPDManager } from '@sphereon/ssi-sdk.pd-manager'
import { IAgentContext } from '@veramo/core'

export type PDManagerMRestApiFeatures = 'pd_read' | 'pd_write' | 'pd_delete'

export interface IPDManagerAPIEndpointOpts {
  endpointOpts?: {
    basePath?: string
    globalAuth?: GenericAuthArgs & { securePDManagerEndpoints?: boolean }
    pdRead?: ISingleEndpointOpts // Overrides read pd entity path
    pdWrite?: ISingleEndpointOpts // Overrides write pd entity path
    pdDelete?: ISingleEndpointOpts // Overrides write pd entity path
  }
  enableFeatures?: PDManagerMRestApiFeatures[]
}

export type IRequiredPlugins = IPDManager
export type IRequiredContext = IAgentContext<IRequiredPlugins>
