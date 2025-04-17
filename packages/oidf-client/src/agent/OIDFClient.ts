import { JoseCurveString, JoseSignatureAlgorithmString, JwkKeyTypeString } from '@sphereon/ssi-types'
import { IAgentPlugin } from '@veramo/core'
import { Request } from 'cross-fetch'
import { schema } from '../'
import { IOIDFClient, IRequiredContext, OIDFClientArgs, ResolveTrustChainArgs } from '../types/IOIDFClient'
import { FederationClient, ICryptoService, IFetchService, Jwk, TrustChainResolveResponse } from '@sphereon/openid-federation-client'

export const oidfClientMethods: Array<string> = ['resolveTrustChain']

export class OIDFClient implements IAgentPlugin {
  private readonly fetchServiceCallback?: IFetchService
  private readonly cryptoServiceCallback?: ICryptoService
  readonly methods: IOIDFClient = {
    resolveTrustChain: this.resolveTrustChain.bind(this),
  }
  readonly schema = schema.IOIDFClient

  constructor(args?: OIDFClientArgs) {
    const { fetchServiceCallback, cryptoServiceCallback } = { ...args }

    this.fetchServiceCallback = fetchServiceCallback
    this.cryptoServiceCallback = cryptoServiceCallback
  }

  private defaultCryptoJSImpl(context: IRequiredContext): ICryptoService {
    return {
      verify: async (jwt: string, key: Jwk): Promise<boolean> => {
        const verification = await context.agent.jwtVerifyJwsSignature({
          jws: jwt,
          jwk: {
            alg: key.alg as JoseSignatureAlgorithmString | undefined,
            crv: key.crv as JoseCurveString | undefined,
            kty: key.kty as JwkKeyTypeString,
            x: key.x ?? (undefined as string | undefined),
            y: key.y ?? (undefined as string | undefined),
            n: key.n ?? (undefined as string | undefined),
            e: key.e ?? (undefined as string | undefined),
            use: key.use ?? (undefined as string | undefined),
            kid: key.kid,
          },
        })
        return !verification.error
      },
    }
  }

  private defaultFetchJSImpl(context: IRequiredContext): IFetchService {
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

  private getOIDFClient(context: IRequiredContext): FederationClient {
    return new FederationClient(
      this.cryptoServiceCallback || this.defaultCryptoJSImpl(context),
      this.fetchServiceCallback || this.defaultFetchJSImpl(context),
    )
  }

  private async resolveTrustChain(args: ResolveTrustChainArgs, context: IRequiredContext): Promise<TrustChainResolveResponse> {
    const { entityIdentifier, trustAnchors } = args

    const oidfClient = this.getOIDFClient(context)

    return await oidfClient.resolveTrustChain(entityIdentifier, trustAnchors, 10)
  }
}
