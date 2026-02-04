import { agentContext } from '@sphereon/ssi-sdk.core'
import { copyGlobalAuthToEndpoints, ExpressSupport } from '@sphereon/ssi-express-support'
import { ISIOPv2RP } from '@sphereon/ssi-sdk.siopv2-oid4vp-rp-auth'
import { TAgent } from '@veramo/core'
import express, { Express, Request, Response, Router } from 'express'
import fs from 'fs'
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

  /**
   * Sets up Swagger UI for API documentation.
   * Supports three modes via OID4VP_OPENAPI_SPEC environment variable:
   * - Remote URL: Fetches spec from URL and serves via proxy endpoint
   * - Local file: Serves spec from filesystem
   * - Default: Uses built-in SwaggerHub spec
   */
  private setupSwaggerUi() {
    const openApiSpec = process.env.OID4VP_OPENAPI_SPEC
    const apiDocsPath = '/api-docs'
    const specPath = '/api-docs/spec.yaml'
    const fullApiDocsPath = `${this._basePath}${apiDocsPath}`
    const fullSpecPath = `${this._basePath}${specPath}`

    // Spec cache shared across all modes
    let cachedSpec: any = null

    // Determine spec source
    const isRemoteUrl = openApiSpec?.startsWith('http://') || openApiSpec?.startsWith('https://')
    const isLocalFile = openApiSpec && !isRemoteUrl

    if (isLocalFile && !fs.existsSync(openApiSpec)) {
      console.log(`[OID4VP] OpenAPI spec file not found at ${openApiSpec}. Swagger UI disabled.`)
      return
    }

    const specSource = isRemoteUrl ? openApiSpec : isLocalFile ? `file://${openApiSpec}` : this.OID4VP_SWAGGER_URL
    console.log(`[OID4VP] API docs: ${fullApiDocsPath} (spec: ${specSource})`)

    // Unified spec fetcher
    const getSpec = async (req?: Request): Promise<any> => {
      if (cachedSpec) {
        return cachedSpec
      }

      if (isLocalFile) {
        const content = fs.readFileSync(openApiSpec, 'utf-8')
        try {
          cachedSpec = JSON.parse(content)
        } catch {
          // YAML - return as string, swagger-ui will parse it
          cachedSpec = content
        }
      } else {
        const url = isRemoteUrl ? openApiSpec! : this.OID4VP_SWAGGER_URL
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const text = await response.text()
        try {
          cachedSpec = JSON.parse(text)
        } catch {
          cachedSpec = text
        }
      }

      // Set server URL if spec is JSON object
      if (typeof cachedSpec === 'object' && cachedSpec !== null && req) {
        cachedSpec.servers = [{ url: `${req.protocol}://${req.get('host')}${this._basePath}`, description: 'This server' }]
      }

      return cachedSpec
    }

    // Pre-fetch spec in background
    getSpec().catch((err) => console.log(`[OID4VP] Spec pre-fetch failed: ${err.message}`))

    // Serve spec at dedicated endpoint
    this._router.get(specPath, async (req: Request, res: Response) => {
      try {
        const spec = await getSpec(req)
        if (typeof spec === 'string') {
          res.type('text/yaml').send(spec)
        } else {
          res.json(spec)
        }
      } catch (err: any) {
        console.error(`[OID4VP] Spec fetch error: ${err.message}`)
        res.status(502).json({ error: 'Failed to load OpenAPI spec', details: err.message })
      }
    })

    // Swagger UI - custom index handler must come BEFORE static serve
    const serveSwaggerIndex = (req: Request, res: Response, next: any): void => {
      // Only handle exact /api-docs or /api-docs/ requests
      if (req.path === '/' || req.path === '') {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>OID4VP API</title>
  <link rel="stylesheet" type="text/css" href="${fullApiDocsPath}/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${fullApiDocsPath}/swagger-ui-bundle.js"></script>
  <script src="${fullApiDocsPath}/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: "${fullSpecPath}",
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`
        res.type('html').send(html)
        return
      }
      next()
    }
    this._router.use(apiDocsPath, serveSwaggerIndex, swaggerUi.serve)
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
