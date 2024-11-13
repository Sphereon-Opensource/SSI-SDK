import {IResourceResolver} from "@sphereon/ssi-sdk.resource-resolver";
import {IAgentContext, IPluginMethodMap} from '@veramo/core';
import {
    IJwtService,
} from '@sphereon/ssi-sdk-ext.jwt-service';
import { ICryptoService, IFetchService } from '@sphereon/openid-federation-client'

export type IRequiredPlugins = IJwtService
export type IRequiredContext = IAgentContext<IRequiredPlugins>

export interface IOIDFClient extends IPluginMethodMap {
    resolveTrustChain(args: ResolveTrustChainArgs, context: RequiredContext): Promise<ResolveTrustChainCallbackResult>
}

export type ResolveTrustChainArgs = {
    entityIdentifier: string,
    trustAnchors: Array<string>
}

export type OIDFClientArgs = {
    fetchServiceCallback?: FetchServiceCallbackArgs
    cryptoServiceCallback?: CryptoServiceCallbackArgs
}

export type CryptoServiceCallbackArgs = ICryptoService
export type FetchServiceCallbackArgs = IFetchService

type Nullable<T> = T | null | undefined

export type ResolveTrustChainCallbackResult = Nullable<Array<string>>

export type RequiredContext = IAgentContext<IJwtService & IResourceResolver>
