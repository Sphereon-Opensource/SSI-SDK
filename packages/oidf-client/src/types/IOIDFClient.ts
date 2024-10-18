import {IPluginMethodMap} from "@veramo/core";
import {
    Nullable
} from "../../../../../OpenID-Federation/build/js/packages/openid-federation-modules-openid-federation-client";

export interface IOIDFClient extends IPluginMethodMap {
    resolveTrustChain(args: ResolveTrustChainArgs): Promise<ResolveTrustChainCallbackResult>
    verifyJwt(args: VerifyJwtArgs): Promise<VerifyJwtResult>
}

export type ResolveTrustChainArgs = {
    entityIdentifier: string,
    trustAnchors: Array<string>
}

export type VerifyJwtArgs = {
    jwt: string
}

export type ResolveTrustChainCallbackResult = Nullable<Array<string>>

export type VerifyJwtResult = boolean
