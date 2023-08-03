import { ExpressBuildResult, ISingleEndpointOpts } from '@sphereon/ssi-sdk.express-support'
import { IPresentationExchange } from '@sphereon/ssi-sdk.presentation-exchange'
import { ISIOPv2RP } from '@sphereon/ssi-sdk.siopv2-oid4vp-rp-auth'
import { TAgent } from '@veramo/core'
import express, { Express, Router } from 'express'
import { agentContext } from '@sphereon/ssi-sdk.core'
import { getAuthRequestSIOPv2Endpoint, verifyAuthResponseSIOPv2Endpoint } from './siop-api-functions'
import { ICreateAuthRequestWebappEndpointOpts, IRequiredPlugins } from './types'
import { authStatusWebappEndpoint, createAuthRequestWebappEndpoint, removeAuthRequestStateWebappEndpoint } from './webapp-api-functions'

export interface ISIOPv2RPRestAPIOpts {
  webappCreateAuthRequest?: ICreateAuthRequestWebappEndpointOpts // Override the create Auth Request path. Needs to contain correlationId and definitionId path params!
  webappDeleteAuthRequest?: ISingleEndpointOpts // Override the delete Auth Request path. Needs to contain correlationId and definitionId path params!
  webappAuthStatus?: ISingleEndpointOpts // Override the Auth status path. CorrelationId and definitionId need to come from the body!
  siopVerifyAuthResponse?: ISingleEndpointOpts // Override the siop Verify Response path. Needs to contain correlationId and definitionId path params!
  siopGetAuthRequest?: ISingleEndpointOpts // Override the siop get Auth Request path. Needs to contain correlationId and definitionId path params!
}

export class SIOPv2RPApiServer {
  private readonly _express: Express
  private readonly _router: Router
  private readonly _agent: TAgent<IPresentationExchange & ISIOPv2RP>
  private readonly _opts?: ISIOPv2RPRestAPIOpts

  constructor(args: { agent: TAgent<IRequiredPlugins>; expressArgs: ExpressBuildResult; opts?: ISIOPv2RPRestAPIOpts }) {
    const { agent, opts } = args
    this._agent = agent
    this._opts = opts
    this._express = args.expressArgs.express
    this._router = express.Router()
    const context = agentContext(agent)

    // Webapp endpoints
    createAuthRequestWebappEndpoint(this._router, context, opts?.webappCreateAuthRequest)
    authStatusWebappEndpoint(this._router, context, opts?.webappAuthStatus)
    removeAuthRequestStateWebappEndpoint(this._router, context, opts?.webappDeleteAuthRequest)

    // SIOPv2 endpoints
    getAuthRequestSIOPv2Endpoint(this._router, context, opts?.siopGetAuthRequest)
    verifyAuthResponseSIOPv2Endpoint(this._router, context, opts?.siopVerifyAuthResponse)
  }

  get express(): Express {
    return this._express
  }

  get router(): Router {
    return this._router
  }

  get agent(): TAgent<IPresentationExchange & ISIOPv2RP> {
    return this._agent
  }

  get opts(): ISIOPv2RPRestAPIOpts | undefined {
    return this._opts
  }
}
