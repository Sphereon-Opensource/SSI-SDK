import { ExpressSupport } from '@sphereon/ssi-express-support'
import { agentContext } from '@sphereon/ssi-sdk.core'
import { TAgent } from '@veramo/core'

import express, { Express, Router } from 'express'
import { getAllJWKSEndpoint, getDIDJWKSEndpoint } from './api-functions'
import { logger } from './index'
import { IRequiredPlugins, IPublicKeyHostingOpts } from './types'

export class PublicKeyHosting {
  get router(): express.Router {
    return this._router
  }

  private readonly _express: Express
  private readonly _agent: TAgent<IRequiredPlugins>
  private readonly _opts?: IPublicKeyHostingOpts
  private readonly _router: Router

  constructor(args: { agent: TAgent<IRequiredPlugins>; expressSupport: ExpressSupport; opts?: IPublicKeyHostingOpts }) {
    const { agent, opts } = args
    this._agent = agent
    if (opts?.endpointOpts?.globalAuth) {
      copyGlobalAuthToEndpoint(opts, 'allJWKS')
      copyGlobalAuthToEndpoint(opts, 'DIDJWKS')
    }

    this._opts = opts
    this._express = args.expressSupport.express
    this._router = express.Router()

    const context = agentContext(agent)

    const features = opts?.hostingOpts?.enableFeatures ?? ['all-jwks', 'did-jwks']
    logger.info(`Public key hosting enabled, with features: ${JSON.stringify(features)}`)

    // Credential endpoints
    if (features.includes('all-jwks')) {
      getAllJWKSEndpoint(this.router, context, {
        ...opts?.endpointOpts?.allJWKS,
      })
    }
    if (features.includes('did-jwks')) {
      getDIDJWKSEndpoint(this.router, context, opts?.endpointOpts?.DIDJWKS)
    }
    this._express.use(opts?.endpointOpts?.basePath ?? '', this.router)
  }

  get agent(): TAgent<IRequiredPlugins> {
    return this._agent
  }

  get opts(): IPublicKeyHostingOpts | undefined {
    return this._opts
  }

  get express(): Express {
    return this._express
  }
}

function copyGlobalAuthToEndpoint(opts: IPublicKeyHostingOpts, key: string) {
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
