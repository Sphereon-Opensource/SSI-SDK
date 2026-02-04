import { agentContext } from '@sphereon/ssi-sdk.core'
import { copyGlobalAuthToEndpoints, ExpressSupport } from '@sphereon/ssi-express-support'
import { ISIOPv2RP } from '@sphereon/ssi-sdk.siopv2-oid4vp-rp-auth'
import { TAgent } from '@veramo/core'
import express, { Express, Request, Response, Router } from 'express'
import fs from 'fs'
import path from 'path'
import { getAuthRequestSIOPv2Endpoint, verifyAuthResponseSIOPv2Endpoint } from './siop-api-functions'
import { IRequiredPlugins, ISIOPv2RPRestAPIOpts } from './types'
import {
  authStatusUniversalOID4VPEndpoint,
  createAuthRequestUniversalOID4VPEndpoint,
  getDefinitionsEndpoint,
  removeAuthRequestStateUniversalOID4VPEndpoint,
} from './universal-oid4vp-api-functions'
import swaggerUi from 'swagger-ui-express'

export class SIOPv2RPApiServer {
  private readonly _express: Express
  private readonly _router: Router
  private readonly _agent: TAgent<ISIOPv2RP>
  private readonly _opts?: ISIOPv2RPRestAPIOpts
  private readonly _basePath: string

  private readonly OID4VP_SWAGGER_URL = 'https://api.swaggerhub.com/apis/SphereonInt/OID4VP/0.1.0'
  constructor(args: { agent: TAgent<IRequiredPlugins>; expressSupport: ExpressSupport; opts?: ISIOPv2RPRestAPIOpts }) {
    const { agent, opts } = args
    this._agent = agent
    copyGlobalAuthToEndpoints({ opts, keys: ['webappCreateAuthRequest', 'webappAuthStatus', 'webappDeleteAuthRequest', 'webappGetDefinitions'] })
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
      createAuthRequestUniversalOID4VPEndpoint(this._router, context, opts?.endpointOpts?.webappCreateAuthRequest)
      authStatusUniversalOID4VPEndpoint(this._router, context, opts?.endpointOpts?.webappAuthStatus)
      removeAuthRequestStateUniversalOID4VPEndpoint(this._router, context, opts?.endpointOpts?.webappDeleteAuthRequest)
      getDefinitionsEndpoint(this._router, context, opts?.endpointOpts?.webappGetDefinitions)
    }

    // SIOPv2 endpoints
    if (features.includes('siop')) {
      getAuthRequestSIOPv2Endpoint(this._router, context, opts?.endpointOpts?.siopGetAuthRequest)
      verifyAuthResponseSIOPv2Endpoint(this._router, context, opts?.endpointOpts?.siopVerifyAuthResponse)
    }
    this._basePath = opts?.endpointOpts?.basePath ?? ''
    this._express.use(this._basePath, this.router)
    this._express.set('trust proxy', opts?.endpointOpts?.trustProxy ?? true)
    this.setupSwaggerUi()
  }

  private setupSwaggerUi() {
    const openApiSpec = process.env.OID4VP_OPENAPI_SPEC
    const isUrl = openApiSpec?.startsWith('http://') || openApiSpec?.startsWith('https://')

    if (openApiSpec && isUrl) {
      const apiDocs = `${this._basePath}/api-docs`
      console.log(`[OID4VP] API docs available at ${apiDocs} (using remote spec: ${openApiSpec})`)

      this._router.use(
        '/api-docs',
        swaggerUi.serve,
        swaggerUi.setup(undefined, {
          swaggerOptions: {
            url: openApiSpec,
          },
        }),
      )
    } else if (openApiSpec) {
      if (!fs.existsSync(openApiSpec)) {
        console.log(`[OID4VP] OpenAPI spec file not found at ${openApiSpec}. Will not host api-docs on this instance`)
        return
      }
      const apiDocs = `${this._basePath}/api-docs`
      const specFileName = path.basename(openApiSpec)
      console.log(`[OID4VP] API docs available at ${apiDocs} (using local spec: ${openApiSpec})`)

      this._router.get(`/api-docs/${specFileName}`, (_req: Request, res: Response) => {
        res.sendFile(openApiSpec)
      })

      this._router.use(
        '/api-docs',
        swaggerUi.serve,
        swaggerUi.setup(undefined, {
          swaggerOptions: {
            url: `${this._basePath}/api-docs/${specFileName}`,
          },
        }),
      )
    } else {
      const setupSwaggerMiddleware = (swagger: any) => {
        const apiDocs = `${this._basePath}/api-docs`
        console.log(`[OID4VP] API docs available at ${apiDocs}`)

        this._router.use(
          '/api-docs',
          (req: Request, res: Response, next: any) => {
            const regex = `${apiDocs.replace(/\//, '\/')}`.replace('/oid4vp', '').replace(/\/api-docs.*/, '')
            swagger.servers = [{ url: `${req.protocol}://${req.get('host')}${regex}`, description: 'This server' }]
            // @ts-ignore
            req.swaggerDoc = swagger
            next()
          },
          swaggerUi.serveFiles(swagger, {}),
          swaggerUi.setup(),
        )
      }

      fetch(this.OID4VP_SWAGGER_URL)
        .then((res) => res.json())
        .then((swagger: any) => {
          setupSwaggerMiddleware(swagger)
        })
        .catch((err) => {
          console.log(`[OID4VP] Unable to fetch swagger document: ${err}. Will not host api-docs on this instance`)
        })
    }
  }
  get express(): Express {
    return this._express
  }

  get router(): Router {
    return this._router
  }

  get agent(): TAgent<ISIOPv2RP> {
    return this._agent
  }

  get opts(): ISIOPv2RPRestAPIOpts | undefined {
    return this._opts
  }
}
