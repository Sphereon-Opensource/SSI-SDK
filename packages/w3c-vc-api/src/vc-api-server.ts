import { agentContext } from '@sphereon/ssi-sdk.core'
import { ExpressBuildResult } from '@sphereon/ssi-sdk.express-support'
import { TAgent } from '@veramo/core'

import express, { Express, Router } from 'express'
import {
  deleteCredentialEndpoint,
  getCredentialEndpoint,
  getCredentialsEndpoint,
  issueCredentialEndpoint,
  verifyCredentialEndpoint,
} from './api-functions'
import { IRequiredPlugins, IVCAPIOpts, IVCIApiFeatures } from './types'

export class VcApiServer {
  get router(): express.Router {
    return this._router
  }

  private readonly _express: Express
  private readonly _agent: TAgent<IRequiredPlugins>
  private readonly _opts?: IVCAPIOpts
  private readonly _router: Router

  constructor(args: { agent: TAgent<IRequiredPlugins>; expressArgs: ExpressBuildResult; opts?: IVCAPIOpts }) {
    const { agent, opts } = args
    this._agent = agent
    if (opts?.endpointOpts?.globalAuth) {
      copyGlobalAuthToEndpoint(opts, 'issueCredential')
      copyGlobalAuthToEndpoint(opts, 'getCredential')
      copyGlobalAuthToEndpoint(opts, 'getCredentials')
      copyGlobalAuthToEndpoint(opts, 'deleteCredential')
      copyGlobalAuthToEndpoint(opts, 'verifyCredential')
    }

    this._opts = opts
    this._express = args.expressArgs.express
    this._router = express.Router()

    const context = agentContext(agent)

    const features = opts?.issueCredentialOpts?.enableFeatures ?? [
      IVCIApiFeatures.VC_ISSUE,
      IVCIApiFeatures.VC_PERSISTENCE,
      IVCIApiFeatures.VC_VERIFY,
    ]
    console.log(`VC API enabled, with features: ${JSON.stringify(features)}`)

    // Credential endpoints
    if (features.includes(IVCIApiFeatures.VC_ISSUE)) {
      issueCredentialEndpoint(this.router, context, {
        ...opts?.endpointOpts?.issueCredential,
        issueCredentialOpts: opts?.issueCredentialOpts,
      })
    }
    if (features.includes(IVCIApiFeatures.VC_PERSISTENCE)) {
      getCredentialEndpoint(this.router, context, opts?.endpointOpts?.getCredential)
      getCredentialsEndpoint(this.router, context, opts?.endpointOpts?.getCredentials)
      deleteCredentialEndpoint(this.router, context, opts?.endpointOpts?.deleteCredential) // not in spec.
    }
    if (features.includes(IVCIApiFeatures.VC_VERIFY)) {
      verifyCredentialEndpoint(this.router, context, {
        ...opts?.endpointOpts?.verifyCredential,
        fetchRemoteContexts: opts?.issueCredentialOpts?.fetchRemoteContexts,
      })
    }
    this._express.use(opts?.endpointOpts?.basePath ?? '', this.router)
  }

  get agent(): TAgent<IRequiredPlugins> {
    return this._agent
  }

  get opts(): IVCAPIOpts | undefined {
    return this._opts
  }

  get express(): Express {
    return this._express
  }
}

function copyGlobalAuthToEndpoint(opts: IVCAPIOpts, key: string) {
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
