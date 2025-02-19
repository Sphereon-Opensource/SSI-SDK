import { CredentialDataSupplier, VcIssuer } from '@sphereon/oid4vci-issuer'
import { getBasePath, OID4VCIServer } from '@sphereon/oid4vci-issuer-server'
import { IOID4VCIServerOpts } from '@sphereon/oid4vci-issuer-server'
import { ExpressSupport } from '@sphereon/ssi-express-support'
import {
  createAuthRequestUriCallback,
  getAccessTokenSignerCallback,
  IIssuerInstanceArgs,
  IssuerInstance,
  createVerifyAuthResponseCallback,
} from '@sphereon/ssi-sdk.oid4vci-issuer'
import express, { Express, Request, Response, Router } from 'express'
import { IRequiredContext } from './types'
import swaggerUi from 'swagger-ui-express'

export interface IOID4VCIRestAPIOpts extends IOID4VCIServerOpts {}

export class OID4VCIRestAPI {
  private readonly _expressSupport: ExpressSupport
  private readonly _context: IRequiredContext
  private readonly _opts?: IOID4VCIRestAPIOpts
  private readonly _restApi: OID4VCIServer
  private readonly _instance: IssuerInstance
  private readonly _issuer: VcIssuer
  private readonly _router: Router
  private _baseUrl: URL
  private _basePath: string

  static async init(args: {
    context: IRequiredContext
    issuerInstanceArgs: IIssuerInstanceArgs
    credentialDataSupplier?: CredentialDataSupplier
    expressSupport: ExpressSupport
    opts?: IOID4VCIRestAPIOpts
  }): Promise<OID4VCIRestAPI> {
    const { issuerInstanceArgs, context } = args
    const opts = args.opts ?? {}
    const expressSupport = args.expressSupport
    const instance = await context.agent.oid4vciGetInstance(args.issuerInstanceArgs)
    const issuer = await instance.get({ context, credentialDataSupplier: args.credentialDataSupplier })

    if (!opts.endpointOpts) {
      opts.endpointOpts = {}
    }
    if (!opts.endpointOpts.tokenEndpointOpts) {
      opts.endpointOpts.tokenEndpointOpts = {
        accessTokenIssuer: instance.metadataOptions.credentialIssuer ?? issuer.issuerMetadata.credential_issuer,
      }
    }
    if (
      opts?.endpointOpts.tokenEndpointOpts?.tokenEndpointDisabled !== true &&
      typeof opts?.endpointOpts.tokenEndpointOpts?.accessTokenSignerCallback !== 'function'
    ) {
      const idOpts = instance.issuerOptions.idOpts
      const tokenOpts = {
        iss: opts.endpointOpts.tokenEndpointOpts.accessTokenIssuer ?? instance.metadataOptions.credentialIssuer,
        didOpts: instance.issuerOptions.didOpts,
        idOpts,
      }

      opts.endpointOpts.tokenEndpointOpts.accessTokenSignerCallback = await getAccessTokenSignerCallback(
        {
          ...tokenOpts,
        },
        args.context,
      )
    }

    if (opts?.endpointOpts.authorizationChallengeOpts?.enabled === true) {
      if (!instance.issuerOptions.presentationDefinitionId) {
        throw Error(`Unable to set createAuthRequestUriCallback. No presentationDefinitionId present in issuer options`)
      }

      if (typeof opts?.endpointOpts.authorizationChallengeOpts.createAuthRequestUriCallback !== 'function') {
        if (!opts.endpointOpts.authorizationChallengeOpts?.createAuthRequestUriEndpointPath) {
          throw Error(`Unable to set createAuthRequestUriCallback. No createAuthRequestUriEndpointPath present in options`)
        }

        opts.endpointOpts.authorizationChallengeOpts.createAuthRequestUriCallback = await createAuthRequestUriCallback({
          path: opts.endpointOpts.authorizationChallengeOpts.createAuthRequestUriEndpointPath,
          presentationDefinitionId: instance.issuerOptions.presentationDefinitionId,
        })
      }

      if (typeof opts?.endpointOpts.authorizationChallengeOpts?.verifyAuthResponseCallback !== 'function') {
        if (!opts.endpointOpts.authorizationChallengeOpts?.verifyAuthResponseEndpointPath) {
          throw Error(`Unable to set verifyAuthResponseCallback. No createAuthRequestUriEndpointPath present in options`)
        }

        opts.endpointOpts.authorizationChallengeOpts.verifyAuthResponseCallback = await createVerifyAuthResponseCallback({
          path: opts.endpointOpts.authorizationChallengeOpts.verifyAuthResponseEndpointPath,
          presentationDefinitionId: instance.issuerOptions.presentationDefinitionId,
        })
      }
    }

    return new OID4VCIRestAPI({ context, issuerInstanceArgs, expressSupport, opts, instance, issuer })
  }

  private readonly OID4VCI_SWAGGER_URL = 'https://api.swaggerhub.com/apis/SphereonInt/OID4VCI/0.1.1'

  private constructor(args: {
    issuer: VcIssuer
    instance: IssuerInstance
    context: IRequiredContext
    issuerInstanceArgs: IIssuerInstanceArgs
    expressSupport: ExpressSupport
    opts: IOID4VCIRestAPIOpts
  }) {
    const { context, opts, issuerInstanceArgs } = args
    this._baseUrl = new URL(
      opts?.baseUrl ??
        process.env.BASE_URL ??
        opts?.issuer?.issuerMetadata?.credential_issuer ??
        issuerInstanceArgs.credentialIssuer ??
        'http://localhost',
    )
    this._basePath = getBasePath(this._baseUrl)
    this._context = context
    this._opts = opts ?? {}
    this._expressSupport = args.expressSupport
    this._issuer = args.issuer
    this._instance = args.instance
    this._restApi = new OID4VCIServer(args.expressSupport, { ...opts, issuer: this._issuer })

    // The above setups the generic OID4VCI management and wallet APIs from the OID4VCI lib.
    // Below sets up the management of configurations
    this._router = express.Router()
    this.express.use(this._basePath, this._router)
    this.setupSwaggerUi()
  }

  private setupSwaggerUi() {
    fetch(this.OID4VCI_SWAGGER_URL)
      .then((res) => res.json())
      .then((swagger) => {
        const apiDocs = `/api-docs`
        console.log(`[OID4VCI] API docs available at ${this._basePath}${apiDocs}`)
        swagger.servers = [{ url: this._baseUrl.toString(), description: 'This server' }]
        this._router.use(
          apiDocs,
          (req: Request, res: Response, next: any) => {
            // @ts-ignore
            req.swaggerDoc = swagger
            next()
          },
          swaggerUi.serveFiles(swagger, options),
          swaggerUi.setup(),
        )
      })
      .catch((err) => {
        console.log(`[OID4VCI] Unable to fetch swagger document: ${err}. Will not host api-docs on this instance`)
      })
    const options = {
      // customCss: '.swagger-ui .topbar { display: none }',
    }
  }

  get express(): Express {
    return this._expressSupport.express
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

  async stop(): Promise<boolean> {
    return this._expressSupport.stop()
  }
}
