import oidf from '@sphereon/openid-federation-client'
import { JWK } from '@sphereon/ssi-types'
import { IAgentPlugin } from '@veramo/core'
import { Request } from 'cross-fetch'
import { schema } from '../'
import { IOIDFClient, OIDFClientArgs, IRequiredContext, ResolveTrustChainArgs } from '../types/IOIDFClient'

export const oidfClientMethods: Array<string> = ['resolveTrustChain']

export class OIDFClient implements IAgentPlugin {
  private readonly fetchServiceCallback?: oidf.IFetchService
  private readonly cryptoServiceCallback?: oidf.ICryptoService
  readonly methods: IOIDFClient = {
    resolveTrustChain: this.resolveTrustChain.bind(this),
  }
  readonly schema = schema.IOIDFClient

  constructor(args?: OIDFClientArgs) {
    const { fetchServiceCallback, cryptoServiceCallback } = { ...args }

    this.fetchServiceCallback = fetchServiceCallback
    this.cryptoServiceCallback = cryptoServiceCallback
  }

  private defaultCryptoJSImpl(context: IRequiredContext): oidf.ICryptoService {
    return {
      verify: async (jwt: string, key: JWK): Promise<boolean> => {
        const verification = await context.agent.jwtVerifyJwsSignature({ jws: jwt, jwk: key })
        return !verification.error
      },
    }
  }

  private defaultFetchJSImpl(context: IRequiredContext): oidf.IFetchService {
    return {
      async fetchStatement(endpoint: string): Promise<string> {
        const requestInfo = new Request(endpoint, {
          method: 'GET',
        })

        const response = await context.agent.resourceResolve({
          input: requestInfo,
          resourceType: 'application/entity-statement+jwt',
        })

        if (response.status != 200) {
          throw new Error(`Failed to fetch statement from ${endpoint}`)
        }

        return await response.text()
      },
    }
  }

  private getOIDFClient(context: IRequiredContext): oidf.FederationClient {
    return new oidf.FederationClient(
      this.fetchServiceCallback || this.defaultFetchJSImpl(context),
      this.cryptoServiceCallback || this.defaultCryptoJSImpl(context),
    )
  }

  private async resolveTrustChain(args: ResolveTrustChainArgs, context: IRequiredContext): Promise<oidf.TrustChainResolveResponse> {
    const { entityIdentifier, trustAnchors } = args

    const oidfClient = this.getOIDFClient(context)

    return await oidfClient.resolveTrustChain(entityIdentifier, trustAnchors, 10)
  }
}
