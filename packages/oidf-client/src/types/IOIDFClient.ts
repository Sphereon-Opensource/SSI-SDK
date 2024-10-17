import {IPluginMethodMap} from "@veramo/core";
import {
    com,
    Nullable
} from "../../../../../OpenID-Federation/build/js/packages/openid-federation-modules-openid-federation-client";
import ICryptoServiceCallbackJS = com.sphereon.oid.fed.client.crypto.ICryptoServiceCallbackJS;

export interface IOIDFClient extends IPluginMethodMap {
    resolveTrustChain(args: ResolveTrustChainArgs): Promise<ResolveTrustChainCallbackResult>
    registerCryptoServiceCallback(args: RegisterCryptoServiceCallbackArgs): Promise<RegisterCryptoServiceCallbackResult>
    verifyJwt(args: VerifyJwtArgs): Promise<VerifyJwtResult>
}

export type ResolveTrustChainArgs = {
    entityIdentifier: string,
    trustAnchors: Array<string>
}

export type RegisterCryptoServiceCallbackArgs = ICryptoServiceCallbackJS

export type VerifyJwtArgs = {
    jwt: string
}

export type ResolveTrustChainCallbackResult = Nullable<Array<string>>

export type RegisterCryptoServiceCallbackResult = void

export type VerifyJwtResult = boolean
