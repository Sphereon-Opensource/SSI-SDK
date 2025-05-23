import { IResourceResolver } from '@sphereon/ssi-sdk.resource-resolver'
import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import { IJwtService } from '@sphereon/ssi-sdk-ext.jwt-service'
import { ICryptoService, IFetchService, TrustChainResolveResponse } from '@sphereon/openid-federation-client'
export type IRequiredPlugins = IJwtService & IResourceResolver
export type IRequiredContext = IAgentContext<IRequiredPlugins>

export interface IOIDFClient extends IPluginMethodMap {
  resolveTrustChain(args: ResolveTrustChainArgs, context: IRequiredContext): Promise<TrustChainResolveResponse>
}

export type ResolveTrustChainArgs = {
  entityIdentifier: string
  trustAnchors: Array<string>
}

export type OIDFClientArgs = {
  fetchServiceCallback?: IFetchService
  cryptoServiceCallback?: ICryptoService
}
