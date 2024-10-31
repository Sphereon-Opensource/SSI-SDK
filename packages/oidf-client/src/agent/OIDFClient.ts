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
import {com} from '@sphereon/openid-federation-client';
import {schema} from '../index';
import FederationClient = com.sphereon.oid.fed.client.FederationClient;
import DefaultFetchJSImpl = com.sphereon.oid.fed.client.fetch.DefaultFetchJSImpl;
import DefaultTrustChainJSImpl = com.sphereon.oid.fed.client.trustchain.DefaultTrustChainJSImpl;
import DefaultCallbacks = com.sphereon.oid.fed.client.service.DefaultCallbacks;
import {JWK} from "@sphereon/ssi-types";

export const oidfClientMethods: Array<string> = [
    'resolveTrustChain',
    'signJwt',
    'verifyJwt'
]

export class OIDFClient implements IAgentPlugin {
    private oidfClient?: FederationClient
    readonly schema = schema.IOIDFClient

    constructor(args?: OIDFClientArgs) {
        const { cryptoServiceCallback } = { ...args }

        if (cryptoServiceCallback !== undefined && cryptoServiceCallback !== null) {
            DefaultCallbacks.setCryptoServiceDefault(cryptoServiceCallback)
            DefaultCallbacks.setFetchServiceDefault(new DefaultFetchJSImpl())
            // Depends on the crypto and fetch services, thus it must be the last one to be set
            DefaultCallbacks.setTrustChainServiceDefault(new DefaultTrustChainJSImpl())
            this.oidfClient = new FederationClient()
        }
    }

    readonly methods: IOIDFClient = {
        resolveTrustChain: this.resolveTrustChain.bind(this),
        signJwt: this.signJwt.bind(this),
        verifyJwt: this.verifyJwt.bind(this)
    }

    private async resolveTrustChain(args: ResolveTrustChainArgs, context: RequiredContext): Promise<ResolveTrustChainCallbackResult> {
        const { entityIdentifier, trustAnchors } = args
        this.checkAndSetDefaultCryptoService(context);
        return await this.oidfClient?.resolveTrustChain(entityIdentifier, trustAnchors)
    }

    private checkAndSetDefaultCryptoService(context: RequiredContext) {
        if ((context.agent.jwtVerifyJwsSignature !== undefined &&
                context.agent.jwtVerifyJwsSignature !== null) &&
            (this.oidfClient === undefined || this.oidfClient === null)) {
            try {
                DefaultCallbacks.setCryptoServiceDefault({
                    verify: async (jwt: string, key: any): Promise<boolean> => {
                        const jwk: JWK = { ...key }
                        try {
                            console.error(`JWT: ${jwt}\nJWK: ${JSON.stringify(jwk)}`)
                            return !(await context.agent.jwtVerifyJwsSignature({
                                jws: jwt,
                                jwk
                            })).error
                        } catch(e) {
                            console.error(`Error verifying the JWT: ${e.message}`)
                            return Promise.reject(e)
                        }
                    }
                })
                DefaultCallbacks.setFetchServiceDefault(new DefaultFetchJSImpl())
                DefaultCallbacks.setTrustChainServiceDefault(new DefaultTrustChainJSImpl())
                this.oidfClient = new FederationClient()
            } catch (error) {
                throw Error(`Could not initialize the federation client: ${error.message}`)
            }
        }
    }

    private async signJwt(args: CreateJwsCompactArgs, context: RequiredContext): Promise<JwtCompactResult> {
        return await context.agent.jwtCreateJwsCompactSignature(args)
    }

    private async verifyJwt(args: VerifyJwsArgs, context: RequiredContext): Promise<IJwsValidationResult> {
        return await context.agent.jwtVerifyJwsSignature(args)
    }
}
