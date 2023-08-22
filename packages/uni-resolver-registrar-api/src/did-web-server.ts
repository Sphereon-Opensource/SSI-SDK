import { agentContext } from '@sphereon/ssi-sdk.core'
import { ExpressSupport } from '@sphereon/ssi-express-support'
import { TAgent } from '@veramo/core'

import express, { Express, Router } from 'express'
import { didWebDomainEndpoint } from './api-functions'
import { IDidWebServiceOpts, IRequiredPlugins } from './types'

export class DidWebServer {
  get router(): express.Router | undefined {
    return this._router
  }

  private readonly _express: Express | undefined
  private readonly _agent: TAgent<IRequiredPlugins> | undefined
  private readonly _opts?: IDidWebServiceOpts
  private readonly _router: Router | undefined

  constructor(args: { agent: TAgent<IRequiredPlugins>; expressSupport: ExpressSupport; opts?: IDidWebServiceOpts }) {
    const { agent, opts } = args
    const features = opts?.enableFeatures ?? []
    if (!features.includes('did-web-global-resolution')) {
      console.log('did:web hosting service NOT enabled')
      return
    }

    this._agent = agent
    if (opts?.globalAuth) {
      copyGlobalAuthToEndpoint(opts, 'endpointOpts')
    }

    this._opts = opts
    this._express = args.expressSupport.express
    this._router = express.Router()

    const context = agentContext(agent)

    console.log(`did:web hosting service enabled`)

    didWebDomainEndpoint(this.router!, context, opts?.endpointOpts)
    this._express.use(this.router!)
  }

  get agent(): TAgent<IRequiredPlugins> | undefined {
    return this._agent
  }

  get opts(): IDidWebServiceOpts | undefined {
    return this._opts
  }

  get express(): Express | undefined {
    return this._express
  }
}

function copyGlobalAuthToEndpoint(opts: IDidWebServiceOpts, key: string) {
  if (opts?.globalAuth) {
    // @ts-ignore
    opts[key] = {
      ...opts?.globalAuth,
      // @ts-ignore
      ...opts[key],
    }
  }
}
