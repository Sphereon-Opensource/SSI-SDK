import {IAgentContext, IPluginMethodMap} from '@veramo/core';
import { com } from '@sphereon/openid-federation-client';
import ICryptoCallbackServiceJS = com.sphereon.oid.fed.client.crypto.ICryptoCallbackServiceJS;
import {
    CreateJwsCompactArgs,
    IJwsValidationResult,
    IJwtService,
    JwtCompactResult,
    VerifyJwsArgs
} from '@sphereon/ssi-sdk-ext.jwt-service';

export interface IOIDFClient extends IPluginMethodMap {
    resolveTrustChain(args: ResolveTrustChainArgs, context: RequiredContext): Promise<ResolveTrustChainCallbackResult>
    signJwt(args: CreateJwsCompactArgs, context: RequiredContext ): Promise<JwtCompactResult>
    verifyJwt(args: VerifyJwsArgs, context: RequiredContext): Promise<IJwsValidationResult>
}

export type ResolveTrustChainArgs = {
    entityIdentifier: string,
    trustAnchors: Array<string>
}

export type OIDFClientArgs = {
    cryptoServiceCallback?: CryptoServiceCallbackArgs
}

export type CryptoServiceCallbackArgs = ICryptoCallbackServiceJS

type Nullable<T> = T | null | undefined

export type ResolveTrustChainCallbackResult = Nullable<Array<string>>

export type RequiredContext = IAgentContext<IJwtService>
