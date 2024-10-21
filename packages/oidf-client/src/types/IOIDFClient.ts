import {IPluginMethodMap} from "@veramo/core";
import {
    com,
    Nullable
} from "../../../../../OpenID-Federation/build/js/packages/openid-federation-modules-openid-federation-client";
import ICryptoServiceCallbackJS = com.sphereon.oid.fed.client.crypto.ICryptoServiceCallback;

export interface IOIDFClient extends IPluginMethodMap {
    resolveTrustChain(args: ResolveTrustChainArgs): Promise<ResolveTrustChainCallbackResult>
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
