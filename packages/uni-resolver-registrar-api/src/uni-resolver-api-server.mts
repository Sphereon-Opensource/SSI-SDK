import { agentContext } from '@sphereon/ssi-sdk.core'
import { ExpressBuildResult } from '@sphereon/ssi-sdk.express-support'
import { TAgent } from '@veramo/core'

import express, { Express, Router } from 'express'
import { createDidEndpoint, deactivateDidEndpoint, getDidMethodsEndpoint, resolveDidEndpoint } from './api-functions.mjs'
import { IDidAPIOpts, IRequiredPlugins } from './types.mjs'

export class UniResolverApiServer {
  get router(): express.Router {
    return this._router
  }

  private readonly _express: Express
  private readonly _agent: TAgent<IRequiredPlugins>
  private readonly _opts?: IDidAPIOpts
  private readonly _router: Router

  constructor(args: { agent: TAgent<IRequiredPlugins>; expressArgs: ExpressBuildResult; opts?: IDidAPIOpts }) {
    const { agent, opts } = args
    this._agent = agent
    if (opts?.endpointOpts?.globalAuth) {
      copyGlobalAuthToEndpoint(opts, 'getDidMethods')
      copyGlobalAuthToEndpoint(opts, 'createDid')
      copyGlobalAuthToEndpoint(opts, 'resolveDid')
      copyGlobalAuthToEndpoint(opts, 'deactivateDid')
    }

    this._opts = opts
    this._express = args.expressArgs.express
    this._router = express.Router()

    const context = agentContext(agent)

    const features = opts?.enableFeatures ?? ['did-resolve', 'did-persist']
    console.log(`DID UniResolver API enabled, with features: ${JSON.stringify(features)}}`)

    // DID endpoints
    if (features.includes('did-resolve')) {
      resolveDidEndpoint(this.router, context, opts?.endpointOpts?.resolveDid)
      getDidMethodsEndpoint(this.router, context, opts?.endpointOpts?.getDidMethods)
    }
    if (features.includes('did-persist')) {
      createDidEndpoint(this.router, context, opts?.endpointOpts?.createDid)
      deactivateDidEndpoint(this.router, context, opts?.endpointOpts?.deactivateDid) // not in spec.
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

function copyGlobalAuthToEndpoint(opts: IDidAPIOpts, key: string) {
  if (opts?.endpointOpts?.globalAuth) {
    // @ts-ignore
    opts.endpointOpts[key] = {
      // @ts-ignore
      ...opts.endpointOpts[key],
      // @ts-ignore
      endpoint: { ...opts.endpointOpts.globalAuth, ...opts.endpointOpts[key]?.endpoint },
    }
  }
}
