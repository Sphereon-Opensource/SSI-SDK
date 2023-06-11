// noinspection JSUnusedGlobalSymbols

import { CredentialDataSupplier, VcIssuer } from '@sphereon/oid4vci-issuer'
import { OID4VCIServer } from '@sphereon/oid4vci-issuer-server'
import { IOID4VCIServerOpts } from '@sphereon/oid4vci-issuer-server/lib/OID4VCIServer'
import { IIssuerInstanceArgs, IssuerInstance } from '@sphereon/ssi-sdk.oid4vci-issuer'
import { getAccessTokenSignerCallback } from '@sphereon/ssi-sdk.oid4vci-issuer/dist/functions'
import bodyParser from 'body-parser'
import * as dotenv from 'dotenv-flow'
import express, { Express } from 'express'
import { IRequiredContext } from './types'

export interface IOID4VCIRestAPIOpts extends IOID4VCIServerOpts {}

export class OID4VCIRestAPI {
  private readonly _express: Express
  private readonly _context: IRequiredContext
  private readonly _opts?: IOID4VCIRestAPIOpts
  private readonly _restApi: OID4VCIServer
  private readonly _instance: IssuerInstance
  private readonly _issuer: VcIssuer

  static async init(args: {
    context: IRequiredContext
    issuerInstanceArgs: IIssuerInstanceArgs
    credentialDataSupplier?: CredentialDataSupplier
    express?: Express
    opts?: IOID4VCIRestAPIOpts
  }): Promise<OID4VCIRestAPI> {
    const { issuerInstanceArgs, express, context } = args
    const instance = await context.agent.oid4vciGetInstance(args.issuerInstanceArgs)
    const issuer = await instance.get({ context, credentialDataSupplier: args.credentialDataSupplier })
    const opts = args.opts ?? {}
    if (!opts.tokenEndpointOpts) {
      opts.tokenEndpointOpts = { accessTokenIssuer: instance.metadataOptions.credentialIssuer ?? issuer.issuerMetadata.credential_issuer }
    }
    if (opts?.tokenEndpointOpts?.tokenEndpointDisabled !== true && typeof opts?.tokenEndpointOpts?.accessTokenSignerCallback !== 'function') {
      opts.tokenEndpointOpts.accessTokenSignerCallback = getAccessTokenSignerCallback(
        {
          iss: opts.tokenEndpointOpts.accessTokenIssuer ?? instance.metadataOptions.credentialIssuer,
          didOpts: instance.issuerOptions.didOpts,
        },
        args.context
      )
    }
    if (!opts.serverOpts) {
      opts.serverOpts = {
        port: 5000,
        host: '0.0.0.0',
        app: args.express,
      }
    }
    return new OID4VCIRestAPI({ context, issuerInstanceArgs, express, opts, instance, issuer })
  }

  private constructor(args: {
    issuer: VcIssuer
    instance: IssuerInstance
    context: IRequiredContext
    issuerInstanceArgs: IIssuerInstanceArgs
    express?: Express
    opts: IOID4VCIRestAPIOpts
  }) {
    const { context, opts } = args
    this._context = context
    this._opts = opts ?? {}
    const existingExpress = !!args.express
    this._express = existingExpress ? args.express! : express()
    this.setupExpress(existingExpress)
    this._issuer = args.issuer
    this._instance = args.instance

    this._opts.serverOpts = {
      ...opts.serverOpts,
      app: this._express,
    }
    this._restApi = new OID4VCIServer({ ...opts, issuer: this._issuer })
  }

  private setupExpress(existingExpress: boolean) {
    dotenv.config()
    if (!existingExpress) {
      const port = this._opts?.serverOpts?.port || process.env.PORT || 5000
      const hostname = this._opts?.serverOpts?.host || '0.0.0.0'
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
      this._express.listen(port as number, hostname, () => console.log(`Listening on ${hostname}, port ${port}`))
    }
  }

  get express(): Express {
    return this._express
  }

  get context(): IRequiredContext {
    return this._context
  }

  get opts(): IOID4VCIRestAPIOpts | undefined {
    return this._opts
  }

  get restApi(): OID4VCIServer {
    return this._restApi
  }

  get instance(): IssuerInstance {
    return this._instance
  }

  get issuer(): VcIssuer {
    return this._issuer
  }
}
