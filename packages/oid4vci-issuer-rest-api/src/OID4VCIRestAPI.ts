// noinspection JSUnusedGlobalSymbols

import { CredentialDataSupplier, VcIssuer } from '@sphereon/oid4vci-issuer'
import { OID4VCIServer } from '@sphereon/oid4vci-issuer-server'
import { IOID4VCIServerOpts } from '@sphereon/oid4vci-issuer-server/lib/OID4VCIServer'
import { IIssuerInstanceArgs, IssuerInstance } from '@sphereon/ssi-sdk.oid4vci-issuer'
import { getAccessTokenKeyRef, getAccessTokenSignerCallback } from '@sphereon/ssi-sdk.oid4vci-issuer'
import bodyParser from 'body-parser'
import { DIDDocument } from 'did-resolver'
import * as dotenv from 'dotenv-flow'
import express, { Express } from 'express'
import { IRequiredContext } from './types'

export interface IOID4VCIRestAPIOpts extends IOID4VCIServerOpts {}

export class OID4VCIRestAPI {
  private readonly _express: Express
  private readonly _context: IRequiredContext
  private readonly _opts?: IOID4VCIRestAPIOpts
  private readonly _restApi: OID4VCIServer<DIDDocument>
  private readonly _instance: IssuerInstance
  private readonly _issuer: VcIssuer<DIDDocument>

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
      let keyRef: string | undefined
      const tokenOpts = {
        iss: opts.tokenEndpointOpts.accessTokenIssuer ?? instance.metadataOptions.credentialIssuer,
        didOpts: instance.issuerOptions.didOpts,
      }
      if (!tokenOpts.didOpts.identifierOpts.kid || tokenOpts.didOpts.identifierOpts.kid.startsWith('did:')) {
        keyRef = await getAccessTokenKeyRef(tokenOpts, context)
      }

      opts.tokenEndpointOpts.accessTokenSignerCallback = getAccessTokenSignerCallback(
        {
          ...tokenOpts,
          keyRef,
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
    issuer: VcIssuer<DIDDocument>
    instance: IssuerInstance
    context: IRequiredContext
    issuerInstanceArgs: IIssuerInstanceArgs
    express?: Express
    opts: IOID4VCIRestAPIOpts
  }) {
    const { context, opts } = args
    this._context = context
    this._opts = opts ?? {}
    this._express = OID4VCIRestAPI.setupExpress(opts)
    this._issuer = args.issuer
    this._instance = args.instance

    this._opts.serverOpts = {
      ...opts.serverOpts,
      app: this._express,
    }
    this._restApi = new OID4VCIServer<DIDDocument>({ ...opts, issuer: this._issuer })
  }

  public static setupExpress(opts: IOID4VCIServerOpts): Express {
    dotenv.config()
    const existingExpress = !!opts.serverOpts?.app
    const app = opts.serverOpts?.app ?? express()
    if (!existingExpress) {
      const port = opts.serverOpts?.port || process.env.PORT || 5000
      const hostname = opts.serverOpts?.host || '0.0.0.0'
      app.use((req, res, next) => {
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
      app.use(bodyParser.urlencoded({ extended: true }))
      app.use(bodyParser.json())
      app.listen(port as number, hostname, () => console.log(`Listening on ${hostname}, port ${port}`))
      if (!opts.serverOpts) {
        opts.serverOpts = {}
      }
      // make sure that if these opts are passed on to another instance, it uses the existing app
      opts.serverOpts.app = app
    }
    return app
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

  get restApi(): OID4VCIServer<DIDDocument> {
    return this._restApi
  }

  get instance(): IssuerInstance {
    return this._instance
  }

  get issuer(): VcIssuer<DIDDocument> {
    return this._issuer
  }
}
