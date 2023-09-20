import { agentContext } from '@sphereon/ssi-sdk.core'
import { TAgent } from '@veramo/core'

import express, { Express, Router } from 'express'
import { IContactManagerAPIEndpointOpts, IRequiredPlugins } from './types'
import {
  identityReadEndpoints,
  partiesReadEndpoint,
  partyDeleteEndpoint,
  partyReadEndpoint,
  partiesTypeReadEndpoint,
  partyWriteEndpoint,
  partyTypeReadEndpoint,
  identitiesReadEndpoint,
} from './api-functions'
import { copyGlobalAuthToEndpoints, ExpressSupport } from '@sphereon/ssi-express-support'

export class ContactManagerApiServer {
  private readonly _express: Express
  private readonly _agent: TAgent<IRequiredPlugins>
  private readonly _opts?: IContactManagerAPIEndpointOpts
  private readonly _router: Router

  constructor(args: { agent: TAgent<IRequiredPlugins>; expressSupport: ExpressSupport; opts?: IContactManagerAPIEndpointOpts }) {
    const { agent, opts } = args
    this._agent = agent
    copyGlobalAuthToEndpoints({ opts, keys: ['partyRead', 'partyWrite', 'partyTypeRead', 'identityRead'] })
    if (opts?.endpointOpts?.globalAuth?.secureContactManagerEndpoints) {
      copyGlobalAuthToEndpoints({ opts, keys: ['partyRead', 'partyWrite', 'partyTypeRead', 'identityRead'] })
    }
    this._opts = opts
    this._express = args.expressSupport.express
    this._router = express.Router()
    const context = agentContext(agent)
    const features = opts?.enableFeatures ?? ['party_read', 'party_write', 'party_type_read', 'identity_read']
    console.log(`Contact Manager API enabled, with features: ${JSON.stringify(features)}}`)

    // endpoints
    if (features.includes('party_read')) {
      partiesReadEndpoint(this.router, context, this._opts?.endpointOpts?.partyRead)
      partyReadEndpoint(this.router, context, this._opts?.endpointOpts?.partyRead)
    }
    if (features.includes('party_write')) {
      partyWriteEndpoint(this.router, context, this._opts?.endpointOpts?.partyWrite)
      partyDeleteEndpoint(this.router, context, this._opts?.endpointOpts?.partyWrite)
    }
    if (features.includes('party_type_read')) {
      partiesTypeReadEndpoint(this.router, context, this._opts?.endpointOpts?.partyTypeRead)
      partyTypeReadEndpoint(this.router, context, this._opts?.endpointOpts?.partyTypeRead)
    }
    if (features.includes('identity_read')) {
      identitiesReadEndpoint(this.router, context, this._opts?.endpointOpts?.identityRead)
      identityReadEndpoints(this.router, context, this._opts?.endpointOpts?.identityRead)
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
  get opts(): IContactManagerAPIEndpointOpts | undefined {
    return this._opts
  }
}
