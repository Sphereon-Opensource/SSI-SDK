import {IResourceResolver} from "@sphereon/ssi-sdk.resource-resolver";
import {IAgentContext, IPluginMethodMap} from '@veramo/core';
import {
    IJwtService,
} from '@sphereon/ssi-sdk-ext.jwt-service';
import { ICryptoService, IFetchService } from '@sphereon/openid-federation-client'

export type IRequiredPlugins = IJwtService & IResourceResolver
export type IRequiredContext = IAgentContext<IRequiredPlugins>

type Nullable<T> = T | null | undefined

export interface IOIDFClient extends IPluginMethodMap {
    resolveTrustChain(args: ResolveTrustChainArgs, context: IRequiredContext): Promise<ResolveTrustChainCallbackResult>
}

export type ResolveTrustChainArgs = {
    entityIdentifier: string,
    trustAnchors: Array<string>
}

export type OIDFClientArgs = {
    fetchServiceCallback?: IFetchService
    cryptoServiceCallback?: ICryptoService
}

export type ResolveTrustChainCallbackResult = Nullable<Array<string>>
