import { agentContext } from '@sphereon/ssi-sdk.core'
import { TAgent } from '@veramo/core'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import * as dotenv from 'dotenv-flow'
import express, { Express } from 'express'
import {
  deleteCredentialEndpoint,
  getCredentialEndpoint,
  getCredentialsEndpoint,
  issueCredentialEndpoint,
  verifyCredentialEndpoint,
} from './api-functions'
import { IRequiredPlugins, IVCAPIOpts } from './types'

export class VcApiServer {
  private readonly _express: Express
  private readonly _agent: TAgent<IRequiredPlugins>
  private readonly _opts?: IVCAPIOpts

  constructor(args: { agent: TAgent<IRequiredPlugins>; express?: Express; opts?: IVCAPIOpts }) {
    const { agent, opts } = args
    this._agent = agent
    this._opts = opts
    const existingExpress = !!args.express
    this._express = args.express ?? express()
    this.setupExpress(existingExpress)
    const router = express.Router()
    const context = agentContext(agent)

    // Credential endpoints
    issueCredentialEndpoint(router, context, {
      issueCredentialOpts: opts?.issueCredentialOpts,
      issueCredentialPath: opts?.pathOpts?.issueCredentialPath,
    })
    getCredentialEndpoint(router, context, { getCredentialPath: opts?.pathOpts?.getCredentialPath })
    getCredentialsEndpoint(router, context, { getCredentialsPath: opts?.pathOpts?.getCredentialsPath })
    deleteCredentialEndpoint(router, context, { deleteCredentialsPath: opts?.pathOpts?.deleteCredentialPath }) // not in spec. TODO: Authz
    verifyCredentialEndpoint(router, context, {
      verifyCredentialPath: opts?.pathOpts?.verifyCredentialPath,
      fetchRemoteContexts: opts?.issueCredentialOpts?.fetchRemoteContexts,
    })
    this._express.use(opts?.pathOpts?.basePath ?? '', router)
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

  private setupExpress(existingExpress: boolean) {
    dotenv.config()
    if (!existingExpress) {
      const port = this.opts?.serverOpts?.port || process.env.PORT || 5000
      const secret = this.opts?.serverOpts?.cookieSigningKey || process.env.COOKIE_SIGNING_KEY
      const hostname = this.opts?.serverOpts?.hostname || '0.0.0.0'
      this._express.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*')
        // Request methods you wish to allow
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')

        // Request headers you wish to allow
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')

        // Set to true if you need the website to include cookies in the requests sent
        // to the API (e.g. in case you use sessions)
        res.setHeader('Access-Control-Allow-Credentials', 'true')
        next()
      })
      // this.express.use(cors({ credentials: true }));
      // this.express.use('/proxy', proxy('www.gssoogle.com'));
      this._express.use(bodyParser.urlencoded({ extended: true }))
      this._express.use(bodyParser.json())
      this._express.use(cookieParser(secret))
      this._express.listen(port as number, hostname, () => console.log(`Listening on ${hostname}, port ${port}`))
    }
  }
}
