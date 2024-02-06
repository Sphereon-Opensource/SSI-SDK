import { Express, Router } from 'express'
import { TAgent } from '@veramo/core'
import { AgentRouter, RequestWithAgentRouter } from '@veramo/remote-server'
import { copyGlobalAuthToEndpoint } from '@sphereon/ssi-express-support'
import { RemoteServerApiServerArgs, RemoteServerApiOpts } from './types'

export class RemoteServerApiServer {
  private readonly _agent: TAgent<any>
  private readonly _exposedMethods: Array<string>
  private readonly _express: Express
  private readonly _opts: RemoteServerApiOpts
  private readonly _requestWithAgentRouter: Router
  private readonly _agentRouter: Router

  get agent(): TAgent<any> {
    return this._agent
  }

  get opts(): RemoteServerApiOpts {
    return this._opts
  }

  get exposedMethods(): Array<string> {
    return this._exposedMethods
  }

  get express(): Express {
    return this._express
  }

  get agentRouter(): Router {
    return this._agentRouter
  }

  get requestWithAgentRouter(): Router {
    return this._requestWithAgentRouter
  }

  constructor(args: RemoteServerApiServerArgs) {
    const { agent, expressSupport, opts } = args

    this._agent = agent
    this._opts = opts
    this._exposedMethods = opts.exposedMethods ?? []
    this._express = expressSupport.express
    this._requestWithAgentRouter = RequestWithAgentRouter({ agent: this._agent })
    this._agentRouter = AgentRouter({ exposedMethods: this._exposedMethods })

    if (opts.endpointOpts?.globalAuth) {
      this._exposedMethods.forEach((method) => {
        copyGlobalAuthToEndpoint({ opts, key: method })
      })
    }

    const basePath = opts.endpointOpts?.basePath ?? ''

    this._express.use(this._requestWithAgentRouter)
    this._express.use(basePath, this._agentRouter)
  }
}
