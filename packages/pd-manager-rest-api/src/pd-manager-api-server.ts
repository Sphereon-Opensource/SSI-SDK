import { agentContext } from '@sphereon/ssi-sdk.core'
import { TAgent } from '@veramo/core'

import express, { Express, Router } from 'express'
import { IPDManagerAPIEndpointOpts, IRequiredPlugins } from './types'
import { pdDeleteEndpoint, pdHasEndpoint, pdPersistEndpoint, pdReadEndpoint, pdsDeleteEndpoint, pdsReadEndpoint } from './api-functions'
import { copyGlobalAuthToEndpoints, ExpressSupport } from '@sphereon/ssi-express-support'

type PdManagerApiServerArgs = {
  agent: TAgent<IRequiredPlugins>
  expressSupport: ExpressSupport
  opts?: IPDManagerAPIEndpointOpts
}

export class PdManagerApiServer {
  private readonly _express: Express
  private readonly _agent: TAgent<IRequiredPlugins>
  private readonly _opts?: IPDManagerAPIEndpointOpts
  private readonly _router: Router

  constructor(args: PdManagerApiServerArgs) {
    const { agent, opts } = args
    this._agent = agent
    copyGlobalAuthToEndpoints({ opts, keys: ['pdRead', 'pdWrite', 'pdUpdate', 'pdDelete'] })
    if (opts?.endpointOpts?.globalAuth?.securePDManagerEndpoints) {
      copyGlobalAuthToEndpoints({ opts, keys: ['pdRead', 'pdWrite', 'pdUpdate', 'pdDelete'] })
    }
    this._opts = opts
    this._express = args.expressSupport.express
    this._router = express.Router()
    const context = agentContext(agent)
    const features = opts?.enableFeatures ?? ['pd_read', 'pd_write', 'pd_delete']
    console.log(`Contact Manager API enabled, with features: ${JSON.stringify(features)}}`)

    // endpoints
    if (features.includes('pd_read')) {
      pdReadEndpoint(this.router, context, this._opts?.endpointOpts?.pdRead)
      pdHasEndpoint(this.router, context, this._opts?.endpointOpts?.pdRead)
      pdsReadEndpoint(this.router, context, this._opts?.endpointOpts?.pdRead)
    }
    if (features.includes('pd_write')) {
      pdPersistEndpoint(this.router, context, this._opts?.endpointOpts?.pdWrite)
    }
    if (features.includes('pd_delete')) {
      pdDeleteEndpoint(this.router, context, this._opts?.endpointOpts?.pdDelete)
      pdsDeleteEndpoint(this.router, context, this._opts?.endpointOpts?.pdDelete)
    }
    this._express.use(opts?.endpointOpts?.basePath ?? '', this.router)
  }

  get express(): Express {
    return this._express
  }

  get router(): Router {
    return this._router
  }

  get agent(): TAgent<IRequiredPlugins> {
    return this._agent
  }

  get opts(): IPDManagerAPIEndpointOpts | undefined {
    return this._opts
  }
}
