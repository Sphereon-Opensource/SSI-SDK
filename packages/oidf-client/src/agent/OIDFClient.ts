import {IAgentPlugin} from "@veramo/core";
import {
    CreateJwsCompactArgs,
    IJwsValidationResult,
    JwtCompactResult,
    VerifyJwsArgs,
} from '@sphereon/ssi-sdk-ext.jwt-service'
import {
    IOIDFClient,
    OIDFClientArgs,
    RequiredContext,
    ResolveTrustChainArgs,
    ResolveTrustChainCallbackResult
} from '../types/IOIDFClient';
import { com } from '@sphereon/openid-federation-client';
import {schema} from '../index';
import FederationClient = com.sphereon.oid.fed.client.FederationClient;
import DefaultFetchJSImpl = com.sphereon.oid.fed.client.fetch.DefaultFetchJSImpl
import DefaultTrustChainJSImpl = com.sphereon.oid.fed.client.trustchain.DefaultTrustChainJSImpl
import DefaultCallbacks = com.sphereon.oid.fed.client.service.DefaultCallbacks

export const oidfClientMethods: Array<string> = [
    'resolveTrustChain',
    'signJwt',
    'verifyJwt'
]

export class OIDFClient implements IAgentPlugin {
    readonly oidfClient: FederationClient
    readonly schema = schema.IOIDFClient

    constructor(args?: OIDFClientArgs) {
        const { cryptoServiceCallback } = { ...args }
        DefaultCallbacks.setFetchServiceDefault(new DefaultFetchJSImpl())
        DefaultCallbacks.setTrustChainServiceDefault(new DefaultTrustChainJSImpl())
        if (cryptoServiceCallback) {
            DefaultCallbacks.setCryptoServiceDefault(cryptoServiceCallback)
        }
        //FIXME set default Federation client crypto callback
        this.oidfClient = new FederationClient()
    }

    readonly methods: IOIDFClient = {
        resolveTrustChain: this.resolveTrustChain.bind(this),
        signJwt: this.signJwt.bind(this),
        verifyJwt: this.verifyJwt.bind(this)
    }

    private async resolveTrustChain(args: ResolveTrustChainArgs): Promise<ResolveTrustChainCallbackResult> {
        const { entityIdentifier, trustAnchors } = args
        return await this.oidfClient.resolveTrustChain(entityIdentifier, trustAnchors)
    }

    private async signJwt(args: CreateJwsCompactArgs, context: RequiredContext): Promise<JwtCompactResult> {
        return await context.agent.jwtCreateJwsCompactSignature(args)
    }

    private async verifyJwt(args: VerifyJwsArgs, context: RequiredContext): Promise<IJwsValidationResult> {
        return await context.agent.jwtVerifyJwsSignature(args)
    }
}
