import { agentContext } from '@sphereon/ssi-sdk.core'
import { TAgent } from '@veramo/core'

import express, { Express, Router } from 'express'
import { ContactManagerMRestApiFeatureEnum, IContactManagerAPIEndpointOpts, IRequiredPlugins } from './types'
import {
  identityReadEndpoints,
  partyReadEndpoints,
  partyTypeReadEndpoints,
  partyWriteEndpoints
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
    copyGlobalAuthToEndpoints({ opts, keys: ['contactRead', 'contactTypeRead', 'identityRead'] })
    const enableFeatures = opts?.enableFeatures ?? [
      ContactManagerMRestApiFeatureEnum.party_read,
      ContactManagerMRestApiFeatureEnum.party_write,
      ContactManagerMRestApiFeatureEnum.party_type_read,
      ContactManagerMRestApiFeatureEnum.party_type_write,
      ContactManagerMRestApiFeatureEnum.identity_read,
      ContactManagerMRestApiFeatureEnum.identity_write,
    ]
    this._opts = opts
    this._express = args.expressSupport.express
    this._router = express.Router()
    const context = agentContext(agent)
    const features = enableFeatures ?? [
      ContactManagerMRestApiFeatureEnum.party_read,
      ContactManagerMRestApiFeatureEnum.party_write,
      ContactManagerMRestApiFeatureEnum.party_type_read,
      ContactManagerMRestApiFeatureEnum.party_type_write,
      ContactManagerMRestApiFeatureEnum.identity_read,
      ContactManagerMRestApiFeatureEnum.identity_write,
    ]
    console.log(`Contact Manager API enabled, with features: ${JSON.stringify(features)}}`)

    // todo: I've commented out the write part of the APIs. We might want to implement and uncomment these in near future
    // endpoints
    if (features.includes(ContactManagerMRestApiFeatureEnum.party_read)) {
      partyReadEndpoints(this.router, context, this._opts?.endpointOpts?.partyRead)
    }
    if (features.includes(ContactManagerMRestApiFeatureEnum.party_write)) {
      partyWriteEndpoints(this.router, context, this._opts?.endpointOpts?.partyWrite)
    }
    if (features.includes(ContactManagerMRestApiFeatureEnum.party_type_read)) {
      partyTypeReadEndpoints(this.router, context, this._opts?.endpointOpts?.partyTypeRead)
    }
    if (features.includes(ContactManagerMRestApiFeatureEnum.party_type_write)) {
      partyTypeReadEndpoints(this.router, context, this._opts?.endpointOpts?.partyTypeRead)
      // contactTypeModifyEndpoints(this.router, context, this._opts.endpointOpts?.contactTypeWrite)
    }
    if (features.includes(ContactManagerMRestApiFeatureEnum.identity_read)) {
      identityReadEndpoints(this.router, context, this._opts?.endpointOpts?.identityRead)
    }
    if (features.includes(ContactManagerMRestApiFeatureEnum.identity_write)) {
      identityReadEndpoints(this.router, context, this._opts?.endpointOpts?.identityRead)
      // identityModifyEndpoints(this.router, context, this._opts?.endpointOpts?.identityWrite)
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
