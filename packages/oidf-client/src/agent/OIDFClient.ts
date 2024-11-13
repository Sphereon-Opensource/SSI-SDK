import {FederationClient, ICryptoService, IFetchService} from '@sphereon/openid-federation-client'
import {JWK} from "@sphereon/ssi-types";
import {IAgentPlugin} from '@veramo/core'
import {Request} from "cross-fetch";
import {ResolveTrustChainCallbackResult, schema} from '../index'
import {
  IOIDFClient,
  OIDFClientArgs,
  IRequiredContext,
  ResolveTrustChainArgs
} from '../types/IOIDFClient'

export const oidfClientMethods: Array<string> = ['resolveTrustChain']

export class OIDFClient implements IAgentPlugin {
  private readonly fetchServiceCallback?: IFetchService
  private readonly cryptoServiceCallback?: ICryptoService
  readonly methods: IOIDFClient = {
    resolveTrustChain: this.resolveTrustChain.bind(this),
  }
  readonly schema = schema.IOIDFClient

  constructor(args: OIDFClientArgs) {
    const {fetchServiceCallback, cryptoServiceCallback} = {...args}

    this.fetchServiceCallback = fetchServiceCallback
    this.cryptoServiceCallback = cryptoServiceCallback
  }

  private defaultCryptoJSImpl(context: IRequiredContext): ICryptoService {
    return {
      verify: async (jwt: string, key: JWK): Promise<boolean> => {
        const verification = await context.agent.jwtVerifyJwsSignature({jws: jwt, jwk: key})
        return verification.error === undefined
      }
    }
  }

  private defaultFetchJSImpl(context: IRequiredContext): IFetchService {
    return {
      async fetchStatement(endpoint: string): Promise<string> {
        const requestInfo = new Request(endpoint, {
          method: 'GET'
        })

        const response = await context.agent.resourceResolve({
          input: requestInfo,
          resourceType: 'application/entity-statement+jwt',
        })

        return await response.text()
      }
    }
  }

  private getOIDFClient(context: IRequiredContext): FederationClient {
    return new FederationClient(
      this.fetchServiceCallback || this.defaultFetchJSImpl(context),
      this.cryptoServiceCallback || this.defaultCryptoJSImpl(context)
    )
  }

  private async resolveTrustChain(args: ResolveTrustChainArgs, context: IRequiredContext): Promise<ResolveTrustChainCallbackResult> {
    const { entityIdentifier, trustAnchors } = args

    const oidfClient = this.getOIDFClient(context)

    return await oidfClient.resolveTrustChain(entityIdentifier, trustAnchors, 10)
  }
}
