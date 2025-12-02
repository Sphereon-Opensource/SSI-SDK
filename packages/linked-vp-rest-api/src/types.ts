import { GenericAuthArgs, ISingleEndpointOpts } from '@sphereon/ssi-express-support'
import { ILinkedVPManager } from '@sphereon/ssi-sdk.linked-vp'
import { IAgentContext } from '@veramo/core'

export type LinkedVPManagerRestApiFeatures = 'publish-management' | 'service-entries' | 'generate-presentation'

export interface ILinkedVPManagerAPIEndpointOpts {
  endpointOpts?: {
    basePath?: string
    globalAuth?: GenericAuthArgs & { secureLinkedVPManagerEndpoints?: boolean }
    publishManagement?: ISingleEndpointOpts // Overrides publish/unpublish/has endpoints
    serviceEntries?: ISingleEndpointOpts // Overrides service entries endpoint
    generatePresentation?: ISingleEndpointOpts // Overrides generate presentation endpoint
  }
  enableFeatures?: LinkedVPManagerRestApiFeatures[]
}

export type IRequiredPlugins = ILinkedVPManager
export type IRequiredContext = IAgentContext<IRequiredPlugins>
