import { agentContext } from '@sphereon/ssi-sdk.core'
import { copyGlobalAuthToEndpoints, ExpressSupport } from '@sphereon/ssi-express-support'
import { IPresentationExchange } from '@sphereon/ssi-sdk.presentation-exchange'
import { ISIOPv2RP } from '@sphereon/ssi-sdk.siopv2-oid4vp-rp-auth'
import { TAgent } from '@veramo/core'
import express, {Express, Request, Response, Router} from 'express'
import { getAuthRequestSIOPv2Endpoint, verifyAuthResponseSIOPv2Endpoint } from './siop-api-functions'
import { IRequiredPlugins, ISIOPv2RPRestAPIOpts } from './types'
import {
  authStatusWebappEndpoint,
  createAuthRequestWebappEndpoint,
  getDefinitionsEndpoint,
  removeAuthRequestStateWebappEndpoint,
} from './webapp-api-functions'
import swaggerUi from 'swagger-ui-express'

export class SIOPv2RPApiServer {
  private readonly _express: Express
  private readonly _router: Router
  private readonly _agent: TAgent<IPresentationExchange & ISIOPv2RP>
  private readonly _opts?: ISIOPv2RPRestAPIOpts
  private readonly _basePath: string

  private readonly OID4VP_SWAGGER_URL = 'https://api.swaggerhub.com/apis/SphereonInt/OID4VP/0.1.0'
  constructor(args: { agent: TAgent<IRequiredPlugins>; expressSupport: ExpressSupport; opts?: ISIOPv2RPRestAPIOpts }) {
    const { agent, opts } = args
    this._agent = agent
    copyGlobalAuthToEndpoints({ opts, keys: ['webappCreateAuthRequest', 'webappAuthStatus', 'webappDeleteAuthRequest'] })
    if (opts?.endpointOpts?.globalAuth?.secureSiopEndpoints) {
      copyGlobalAuthToEndpoints({ opts, keys: ['siopGetAuthRequest', 'siopVerifyAuthResponse'] })
    }

    this._opts = opts
    this._express = args.expressSupport.express
    this._router = express.Router()
    const context = agentContext(agent)

    const features = opts?.enableFeatures ?? ['rp-status', 'siop']
    console.log(`SIOPv2 API enabled, with features: ${JSON.stringify(features)}}`)

    // Webapp endpoints
    if (features.includes('rp-status')) {
      createAuthRequestWebappEndpoint(this._router, context, opts?.endpointOpts?.webappCreateAuthRequest)
      authStatusWebappEndpoint(this._router, context, opts?.endpointOpts?.webappAuthStatus)
      removeAuthRequestStateWebappEndpoint(this._router, context, opts?.endpointOpts?.webappDeleteAuthRequest)
      getDefinitionsEndpoint(this._router, context, opts?.endpointOpts?.webappGetDefinitions)
    }

    // SIOPv2 endpoints
    if (features.includes('siop')) {
      getAuthRequestSIOPv2Endpoint(this._router, context, opts?.endpointOpts?.siopGetAuthRequest)
      verifyAuthResponseSIOPv2Endpoint(this._router, context, opts?.endpointOpts?.siopVerifyAuthResponse)
    }
    this._basePath = opts?.endpointOpts?.basePath ?? ''
    this._express.use(this._basePath, this.router)
    this.setupSwaggerUi()
  }

  private setupSwaggerUi() {

    fetch(this.OID4VP_SWAGGER_URL)
        .then((res) => res.json())
        .then((swagger) => {
          const apiDocs = `${this._basePath}/api-docs`
          console.log(`[OID4P] API docs available at ${apiDocs}`)

          this._router.use(
              '/api-docs',
              (req: Request, res: Response, next: any) => {
                const regex = `${apiDocs.replace(/\//, '\/')}`.replace('/oid4vp', '').replace(/\/api-docs.*/, '')
                swagger.servers = [{url: `${req.protocol}://${req.get('host')}${regex}`, description: 'This server'}]
                // @ts-ignore
                req.swaggerDoc = swagger
                next()
              },
              swaggerUi.serveFiles(swagger, options),
              swaggerUi.setup(),
          )
        })
        .catch((err) => {
          console.log(`[OID4VP] Unable to fetch swagger document: ${err}. Will not host api-docs on this instance`)
        })
    const options = {
      // customCss: '.swagger-ui .topbar { display: none }',
    }
  }
  get express(): Express {
    return this._express
  }

  get router(): Router {
    return this._router
  }

  get agent(): TAgent<IPresentationExchange & ISIOPv2RP> {
    return this._agent
  }

  get opts(): ISIOPv2RPRestAPIOpts | undefined {
    return this._opts
  }
}
