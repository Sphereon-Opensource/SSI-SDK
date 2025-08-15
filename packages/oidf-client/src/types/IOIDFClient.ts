import { IResourceResolver } from '@sphereon/ssi-sdk.resource-resolver'
import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import { ICryptoService, IFetchService, TrustChainResolveResponse } from '@sphereon/openid-federation-client'
import { JWK } from 'jose'

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

/**
 * Partial opy of IJWTService to break cyclic dep between identifier-resolution, jwt-service and oidf-client
 */
export interface IJwtService extends IPluginMethodMap {
  jwtVerifyJwsSignature(args: VerifyJwsArgs, context: IRequiredContext): Promise<any>
}

export type VerifyJwsArgs = {
  jws: any
  jwk?: JWK // Jwk will be resolved from jws, but you can also provide one
  opts?: any
}