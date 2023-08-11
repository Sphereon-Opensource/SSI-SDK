import { agentContext } from '@sphereon/ssi-sdk.core'
import { ExpressBuildResult } from '@sphereon/ssi-sdk.express-support'
import { TAgent } from '@veramo/core'

import express, { Express, Router } from 'express'
import { didWebDomainEndpoint } from './api-functions.mjs'
import { IDidWebServiceOpts, IRequiredPlugins } from './types.mjs'

export class DidWebServer {
  get router(): express.Router | undefined {
    return this._router
  }

  private readonly _express: Express | undefined
  private readonly _agent: TAgent<IRequiredPlugins> | undefined
  private readonly _opts?: IDidWebServiceOpts
  private readonly _router: Router | undefined

  constructor(args: { agent: TAgent<IRequiredPlugins>; expressArgs: ExpressBuildResult; opts?: IDidWebServiceOpts }) {
    const { agent, opts } = args
    const features = opts?.enableFeatures ?? []
    if (!features.includes('did-web-global-resolution')) {
      console.log('DID WEB Service NOT enabled')
      return
    }

    this._agent = agent
    if (opts?.globalAuth) {
      copyGlobalAuthToEndpoint(opts, 'endpointOpts')
    }

    this._opts = opts
    this._express = args.expressArgs.express
    this._router = express.Router()

    const context = agentContext(agent)

    console.log(`DID WEB Service enabled`)

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
