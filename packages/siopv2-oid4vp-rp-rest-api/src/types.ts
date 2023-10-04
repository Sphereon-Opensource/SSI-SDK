import { GenericAuthArgs, ISingleEndpointOpts } from '@sphereon/ssi-express-support'
import { IPresentationExchange } from '@sphereon/ssi-sdk.presentation-exchange'
import { ISIOPv2RP } from '@sphereon/ssi-sdk.siopv2-oid4vp-rp-auth'
import { IAgentContext, ICredentialVerifier } from '@veramo/core'

export type SiopFeatures = 'rp-status' | 'siop'
export interface ISIOPv2RPRestAPIOpts {
  enableFeatures?: SiopFeatures[]
  endpointOpts?: {
    basePath?: string
    globalAuth?: GenericAuthArgs & { secureSiopEndpoints?: boolean }
    webappCreateAuthRequest?: ICreateAuthRequestWebappEndpointOpts // Override the create Auth Request path. Needs to contain correlationId and definitionId path params!
    webappDeleteAuthRequest?: ISingleEndpointOpts // Override the delete Auth Request path. Needs to contain correlationId and definitionId path params!
    webappAuthStatus?: ISingleEndpointOpts // Override the Auth status path. CorrelationId and definitionId need to come from the body!
    siopVerifyAuthResponse?: ISingleEndpointOpts // Override the siop Verify Response path. Needs to contain correlationId and definitionId path params!
    siopGetAuthRequest?: ISingleEndpointOpts // Override the siop get Auth Request path. Needs to contain correlationId and definitionId path params!
  }
}
export interface IWebappEndpointOpts extends ISingleEndpointOpts {
  webappBaseURI?: string
}

export interface ISIOPEndpointOpts extends ISingleEndpointOpts {
  siopBaseURI?: string
}

export interface ICreateAuthRequestWebappEndpointOpts extends ISingleEndpointOpts {
  siopBaseURI?: string
  webappAuthStatusPath?: string
  webappBaseURI?: string
}

export type IRequiredPlugins = /*IDataStoreORM & IResolver & IDIDManager & IKeyManager &  */ ICredentialVerifier & ISIOPv2RP & IPresentationExchange
export type IRequiredContext = IAgentContext<IRequiredPlugins>
