import { copyGlobalAuthToEndpoint, ExpressSupport } from '@sphereon/ssi-express-support'
import { agentContext } from '@sphereon/ssi-sdk.core'
import { IStatusListPlugin } from '@sphereon/ssi-sdk.vc-status-list'
import { TAgent } from '@veramo/core'

import express, { Express, Router } from 'express'
import {
  createNewStatusListEndpoint,
  getStatusListCredentialEndpoint,
  getStatusListCredentialIndexStatusEndpoint,
  updateW3CStatusEndpoint,
} from './api-functions'
import { IStatusListOpts } from './types'
import { IRequiredPlugins } from '@sphereon/ssi-sdk.vc-status-list-issuer-drivers'

export class StatuslistManagementApiServer {
  get router(): express.Router {
    return this._router
  }

  private readonly _express: Express
  private readonly _agent: TAgent<IRequiredPlugins>
  private readonly _opts?: IStatusListOpts
  private readonly _router: Router

  constructor(args: { agent: TAgent<IRequiredPlugins & IStatusListPlugin>; expressSupport: ExpressSupport; opts: IStatusListOpts }) {
    const { agent, opts } = args
    this._agent = agent
    if (opts?.endpointOpts?.globalAuth) {
      copyGlobalAuthToEndpoint({ opts, key: 'vcApiCredentialStatus' })
      copyGlobalAuthToEndpoint({ opts, key: 'createStatusList' })
      copyGlobalAuthToEndpoint({ opts, key: 'getStatusList' })
    }

    this._opts = opts
    this._express = args.expressSupport.express
    this._router = express.Router()

    const context = agentContext(agent)

    const features = opts?.enableFeatures ?? ['status-list-management', 'status-list-hosting', 'w3c-vc-api-credential-status']
    console.log(`Status List API enabled, with features: ${JSON.stringify(features)}`)

    // Credential Status (List) endpoints
    if (features.includes('status-list-management')) {
      createNewStatusListEndpoint(this.router, context, opts.endpointOpts.createStatusList)
    }
    if (features.includes('status-list-hosting')) {
      getStatusListCredentialEndpoint(this.router, context, opts.endpointOpts.getStatusList)
      getStatusListCredentialIndexStatusEndpoint(this.router, context, opts.endpointOpts.getStatusList)
    }
    if (features.includes('w3c-vc-api-credential-status')) {
      updateW3CStatusEndpoint(this.router, context, opts.endpointOpts.vcApiCredentialStatus)
    }
    this._express.use(opts?.endpointOpts?.basePath ?? '', this.router)
  }

  get agent(): TAgent<IRequiredPlugins> {
    return this._agent
  }

  get opts(): IStatusListOpts | undefined {
    return this._opts
  }

  get express(): Express {
    return this._express
  }
}

/*
function copyGlobalAuthToEndpoint(opts: IStatusListOpts, key: string) {
    if (opts?.endpointOpts?.globalAuth) {
        // @ts-ignore
        opts.endpointOpts[key] = {
            // @ts-ignore
            ...opts.endpointOpts[key],
            // @ts-ignore
            endpoint: {...opts.endpointOpts.globalAuth, ...opts.endpointOpts[key]?.endpoint},
        }
    }
}
*/
