import {IAgentPlugin} from "@veramo/core";
import {
    IOIDFClient,
    ResolveTrustChainArgs,
    ResolveTrustChainCallbackResult,
    VerifyJwtArgs,
    VerifyJwtResult
} from "../types/IOIDFClient";
import {
    com
} from "../../../../../OpenID-Federation/build/js/packages/openid-federation-modules-openid-federation-client";
import {schema} from "../index";
import FederationClient = com.sphereon.oid.fed.client.FederationClient;
import CryptoServiceJS = com.sphereon.oid.fed.client.crypto.CryptoServiceJS;

export const oidfClientMethods: Array<string> = [
    'resolveTrustChain',
    'registerCryptoServiceCallback',
    'verifyJwt'
]

export class OIDFClient implements IAgentPlugin {
    readonly oidfClient: FederationClient
    readonly schema = schema.IContactManager

    constructor() {
        this.oidfClient = new FederationClient()
    }

    readonly methods: IOIDFClient = {
        resolveTrustChain: this.resolveTrustChain.bind(this),
        verifyJwt: this.verifyJwt.bind(this)
    }

    private async resolveTrustChain(args: ResolveTrustChainArgs): Promise<ResolveTrustChainCallbackResult> {
        const { entityIdentifier, trustAnchors } = args
        return this.oidfClient.resolveTrustChain(entityIdentifier, trustAnchors)
    }

    private async verifyJwt(args: VerifyJwtArgs): Promise<VerifyJwtResult> {
        const { jwt } = args
        return await CryptoServiceJS.verify(jwt)
    }
}
