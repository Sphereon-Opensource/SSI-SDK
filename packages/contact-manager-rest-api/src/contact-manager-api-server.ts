import { agentContext } from '@sphereon/ssi-sdk.core'
import { copyGlobalAuthToEndpoints, ExpressSupport } from '@sphereon/ssi-express-support'
import { TAgent } from '@veramo/core'

import express, { Express, Router } from 'express'
import { ContactManagerMRestApiFeatureEnum, IContactManagerAPIEndpointOpts, IRequiredPlugins } from './types'
import { contactReadEndpoints, contactTypeReadEndpoints, identityReadEndpoints } from './api-functions'
import { ENABLED_EFATURES } from './environment'

export class ContactManagerApiServer {
  get router(): express.Router {
    return this._router
  }

  private readonly _express: Express
  private readonly _agent: TAgent<IRequiredPlugins>
  private readonly _opts?: IContactManagerAPIEndpointOpts
  private readonly _router: Router

  constructor(args: { agent: TAgent<IRequiredPlugins>; expressSupport: ExpressSupport; opts?: IContactManagerAPIEndpointOpts }) {
    const { agent, opts } = args
    this._agent = agent
    copyGlobalAuthToEndpoints({ opts, keys: ['getDidMethods', 'createDid', 'resolveDid', 'deactivateDid'] })
    const enableFeatures = opts?.enableFeatures ?? ENABLED_EFATURES
    this._opts = opts
    this._express = args.expressSupport.express
    this._router = express.Router()
    const context = agentContext(agent)
    const features = enableFeatures ?? [
      ContactManagerMRestApiFeatureEnum.contact_read,
      ContactManagerMRestApiFeatureEnum.contact_write,
      ContactManagerMRestApiFeatureEnum.contact_type_read,
      ContactManagerMRestApiFeatureEnum.contact_type_write,
      ContactManagerMRestApiFeatureEnum.identity_read,
      ContactManagerMRestApiFeatureEnum.identity_write,
    ]
    console.log(`Contact Manager API enabled, with features: ${JSON.stringify(features)}}`)

    // todo: I've commented out the write part of the APIs. We might want to implement and uncomment these in near future
    // endpoints
    if (features.includes(ContactManagerMRestApiFeatureEnum.contact_read)) {
      contactReadEndpoints(this.router, context, this._opts?.endpointOpts?.contactRead)
    }
    if (features.includes(ContactManagerMRestApiFeatureEnum.contact_write)) {
      contactReadEndpoints(this.router, context, this._opts?.endpointOpts?.contactRead)
      // contactWriteEndpoints(this.router, context, this._opts?.endpointOpts.contactWrite)
    }
    if (features.includes(ContactManagerMRestApiFeatureEnum.contact_type_read)) {
      contactTypeReadEndpoints(this.router, context, this._opts?.endpointOpts?.contactTypeRead)
    }
    if (features.includes(ContactManagerMRestApiFeatureEnum.contact_type_write)) {
      contactTypeReadEndpoints(this.router, context, this._opts?.endpointOpts?.contactTypeRead)
      // contactTypeModifyEndpoints(this.router, context, this._opts.endpointOpts?.contactTypeWrite)
    }
    if (features.includes(ContactManagerMRestApiFeatureEnum.identity_read)) {
      identityReadEndpoints(this.router, context, this._opts?.endpointOpts?.identityRead)
    }
    if (features.includes(ContactManagerMRestApiFeatureEnum.contact_write)) {
      identityReadEndpoints(this.router, context, this._opts?.endpointOpts?.identityRead)
      // identityModifyEndpoints(this.router, context, this._opts?.endpointOpts?.identityWrite)
    }
    this._express.use(opts?.endpointOpts?.basePath ?? '', this.router)
  }

  get agent(): TAgent<IRequiredPlugins> {
    return this._agent
  }

  get opts(): IContactManagerAPIEndpointOpts | undefined {
    return this._opts
  }

  get express(): Express {
    return this._express
  }
}
