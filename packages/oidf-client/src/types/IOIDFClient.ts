import {IAgentContext, IPluginMethodMap} from "@veramo/core";
import {
    com,
    Nullable
} from "../../../../../OpenID-Federation/build/js/packages/openid-federation-modules-openid-federation-client";
import ICryptoServiceCallbackJS = com.sphereon.oid.fed.client.crypto.ICryptoServiceCallback;
import {
    CreateJwsCompactArgs,
    IJwsValidationResult,
    IJwtService,
    JwsCompactResult,
    VerifyJwsArgs
} from "@sphereon/ssi-sdk-ext.jwt-service";

export interface IOIDFClient extends IPluginMethodMap {
    resolveTrustChain(args: ResolveTrustChainArgs): Promise<ResolveTrustChainCallbackResult>
    signJwt(args: CreateJwsCompactArgs, context: RequiredContext ): Promise<JwsCompactResult>
    verifyJwt(args: VerifyJwsArgs, context: RequiredContext): Promise<IJwsValidationResult>
}

export type ResolveTrustChainArgs = {
    entityIdentifier: string,
    trustAnchors: Array<string>
}

export type OIDFClientArgs = {
    cryptoServiceCallback?: CryptoServiceCallbackArgs
}

export type CryptoServiceCallbackArgs = ICryptoServiceCallbackJS

export type ResolveTrustChainCallbackResult = Nullable<Array<string>>

export type RequiredContext = IAgentContext<IJwtService>
