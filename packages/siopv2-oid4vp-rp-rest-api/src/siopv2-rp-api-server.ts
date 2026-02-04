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

      let cachedSpec: string | null = null
      let fetchPromise: Promise<string> | null = null

      // Helper function to fetch and cache the spec
      const fetchSpec = async (): Promise<string> => {
        if (cachedSpec) {
          return cachedSpec
        }

        if (fetchPromise) {
          return fetchPromise
        }

        fetchPromise = fetch(openApiSpec)
          .then((res) => {
            if (!res.ok) {
              throw new Error(`Failed to fetch OpenAPI spec: HTTP ${res.status}`)
            }
            return res.text()
          })
          .then((text) => {
            cachedSpec = text
            fetchPromise = null
            return text
          })
          .catch((err) => {
            fetchPromise = null
            throw err
          })

        return fetchPromise
      }

      // Start fetching in the background for faster first load
      fetchSpec().catch((err) => {
        console.log(`[OID4VP] Failed to pre-fetch remote OpenAPI spec: ${err}`)
      })

      // Serve the YAML/JSON at a proxied endpoint with on-demand fetching
      this._router.get('/api-docs/openapi.yaml', async (_req: Request, res: Response) => {
        try {
          const spec = await fetchSpec()
          res.setHeader('Content-Type', 'text/yaml')
          res.send(spec)
        } catch (err) {
          console.error(`[OID4VP] Error serving OpenAPI spec: ${err}`)
          res.status(502).send(`Failed to fetch OpenAPI spec: ${err}`)
        }
      })

      // Set up Swagger UI with the proxied endpoint
      this._router.use(
        '/api-docs',
        swaggerUi.serve,
        swaggerUi.setup(undefined, {
          swaggerOptions: {
            url: `${this._basePath}/api-docs/openapi.yaml`,
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
      const apiDocs = `${this._basePath}/api-docs`
      console.log(`[OID4VP] API docs available at ${apiDocs}`)

      let cachedSwagger: any = null
      let fetchPromise: Promise<any> | null = null

      // Helper function to fetch and cache the swagger doc
      const fetchSwagger = async (): Promise<any> => {
        if (cachedSwagger) {
          return cachedSwagger
        }

        if (fetchPromise) {
          return fetchPromise
        }

        fetchPromise = fetch(this.OID4VP_SWAGGER_URL)
          .then((res) => res.json())
          .then((swagger: any) => {
            cachedSwagger = swagger
            fetchPromise = null
            return swagger
          })
          .catch((err) => {
            fetchPromise = null
            throw err
          })

        return fetchPromise
      }

      // Start fetching in the background for faster first load
      fetchSwagger().catch((err) => {
        console.log(`[OID4VP] Failed to pre-fetch swagger document: ${err}`)
      })

      // Set up Swagger UI with on-demand spec loading
      this._router.use(
        '/api-docs',
        async (req: Request, res: Response, next: any) => {
          try {
            const swagger = await fetchSwagger()
            swagger.servers = [{ url: `${req.protocol}://${req.get('host')}${this._basePath}`, description: 'This server' }]
            // @ts-ignore
            req.swaggerDoc = swagger
            next()
          } catch (err) {
            console.error(`[OID4VP] Error loading swagger document: ${err}`)
            res.status(502).send(`Failed to load API documentation: ${err}`)
          }
        },
        swaggerUi.serveFiles(undefined as any, {}),
        swaggerUi.setup(),
      )
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
