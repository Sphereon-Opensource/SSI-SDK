import { GenericAuthArgs, ISingleEndpointOpts } from '@sphereon/ssi-express-support'
import { IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { IAgentContext, IDIDManager, IKeyManager } from '@veramo/core'

export type IRequiredPlugins = IDIDManager & IKeyManager & IIdentifierResolution
export type IRequiredContext = IAgentContext<IRequiredPlugins>

export interface IPublicKeyHostingOpts {
  endpointOpts?: IPKHostingAPIEndpointOpts
  hostingOpts?: IHostingOpts
}

export interface IPKHostingAPIEndpointOpts {
  basePath?: string
  globalAuth?: GenericAuthArgs
  allJWKS?: ISingleEndpointOpts
  DIDJWKS?: ISingleEndpointOpts
}

export type publicKeyHostingFeatures = 'all-jwks' | 'did-jwks'

export interface IHostingOpts {
  enableFeatures?: publicKeyHostingFeatures[] // Feature to enable. If not defined or empty, all features will be enabled
}
