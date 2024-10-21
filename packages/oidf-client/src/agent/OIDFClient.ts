import {IAgentPlugin} from "@veramo/core";
import {
    IOIDFClient,
    OIDFClientArgs,
    ResolveTrustChainArgs,
    ResolveTrustChainCallbackResult
} from "../types/IOIDFClient";
import {
    com
} from "../../../../../OpenID-Federation/build/js/packages/openid-federation-modules-openid-federation-client";
import {schema} from "../index";
import FederationClient = com.sphereon.oid.fed.client.FederationClient;
import CryptoService = com.sphereon.oid.fed.client.crypto.CryptoService;

export const oidfClientMethods: Array<string> = [
    'resolveTrustChain'
]

export class OIDFClient implements IAgentPlugin {
    readonly oidfClient: FederationClient
    readonly schema = schema.IOIDFClient

    constructor(args?: OIDFClientArgs) {
        const { cryptoServiceCallback } = { ...args }
        console.log(cryptoServiceCallback)
        this.oidfClient = new FederationClient()
        CryptoService.register(cryptoServiceCallback)
    }

    readonly methods: IOIDFClient = {
        resolveTrustChain: this.resolveTrustChain.bind(this),
    }

    private async resolveTrustChain(args: ResolveTrustChainArgs): Promise<ResolveTrustChainCallbackResult> {
        const { entityIdentifier, trustAnchors } = args
        return await this.oidfClient.resolveTrustChain(entityIdentifier, trustAnchors)
    }
}
