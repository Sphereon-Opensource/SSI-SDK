import { agentContext } from '@sphereon/ssi-sdk.core'
import { copyGlobalAuthToEndpoints, ExpressSupport } from '@sphereon/ssi-express-support'
import { TAgent } from '@veramo/core'

import express, { Express, Router } from 'express'
import { createDidEndpoint, deleteDidEndpoint, deactivateDidEndpoint, getDidMethodsEndpoint, resolveDidEndpoint } from './api-functions'
import { IDidAPIOpts, IRequiredPlugins } from './types'

export class UniResolverApiServer {
  get router(): express.Router {
    return this._router
  }

  private readonly _express: Express
  private readonly _agent: TAgent<IRequiredPlugins>
  private readonly _opts?: IDidAPIOpts
  private readonly _router: Router

  constructor(args: { agent: TAgent<IRequiredPlugins>; expressSupport: ExpressSupport; opts?: IDidAPIOpts }) {
    const { agent, opts } = args
    this._agent = agent
    copyGlobalAuthToEndpoints({ opts, keys: ['getDidMethods', 'createDid', 'resolveDid', 'deactivateDid'] })
    this._opts = opts
    this._express = args.expressSupport.express
    this._router = express.Router()
    const context = agentContext(agent)
    const features = opts?.enableFeatures ?? ['did-resolve', 'did-persist']
    console.log(`DID Uni Resolver and Registrar API enabled, with features: ${JSON.stringify(features)}}`)

    // DID endpoints
    if (features.includes('did-resolve')) {
      resolveDidEndpoint(this.router, context, opts?.endpointOpts?.resolveDid)
      getDidMethodsEndpoint(this.router, context, opts?.endpointOpts?.getDidMethods)
    }
    if (features.includes('did-persist')) {
      createDidEndpoint(this.router, context, opts?.endpointOpts?.createDid)
      deleteDidEndpoint(this.router, context, opts?.endpointOpts?.deactivateDid) // not in spec.
      deactivateDidEndpoint(this.router, context, opts?.endpointOpts?.deactivateDid)
    }
    this._express.use(opts?.endpointOpts?.basePath ?? '', this.router)
  }

  get agent(): TAgent<IRequiredPlugins> {
    return this._agent
  }

  get opts(): IDidAPIOpts | undefined {
    return this._opts
  }

  get express(): Express {
    return this._express
  }
}
