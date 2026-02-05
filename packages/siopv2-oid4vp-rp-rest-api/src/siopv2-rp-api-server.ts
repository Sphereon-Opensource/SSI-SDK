import { agentContext } from '@sphereon/ssi-sdk.core'
import { copyGlobalAuthToEndpoints, ExpressSupport } from '@sphereon/ssi-express-support'
import { ISIOPv2RP } from '@sphereon/ssi-sdk.siopv2-oid4vp-rp-auth'
import { TAgent } from '@veramo/core'
import express, { Express, Request, Response, Router } from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
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

  private readonly OID4VP_OPENAPI_FILE = path.join(__dirname, '..', 'oid4vp-openapi.yml')
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
   * Spec source priority:
   * 1. OID4VP_OPENAPI_SPEC env var (URL or file path)
   * 2. Bundled universal-OID4VP-openapi.yaml file
   * 3. Fallback to SwaggerHub URL
   */
  private setupSwaggerUi() {
    const envSpec = process.env.OID4VP_OPENAPI_SPEC
    const apiDocsPath = '/api-docs'
    const specPath = '/api-docs/spec.yaml'
    const fullApiDocsPath = `${this._basePath}${apiDocsPath}`
    const fullSpecPath = `${this._basePath}${specPath}`

    // Spec cache shared across all modes
    let cachedSpec: any = null

    // Determine spec source: env var > bundled file > SwaggerHub URL
    const isRemoteUrl = envSpec?.startsWith('http://') || envSpec?.startsWith('https://')
    const isEnvLocalFile = envSpec && !isRemoteUrl
    // Resolve relative paths from package root
    const resolvedEnvFile = isEnvLocalFile && !path.isAbsolute(envSpec) ? path.join(__dirname, '..', envSpec) : envSpec
    const hasBundledFile = fs.existsSync(this.OID4VP_OPENAPI_FILE)
    const localFile = isEnvLocalFile ? resolvedEnvFile : hasBundledFile ? this.OID4VP_OPENAPI_FILE : undefined
    const isLocalFile = !!localFile

    if (isEnvLocalFile && !fs.existsSync(resolvedEnvFile!)) {
      console.log(`[OID4VP] OpenAPI spec file not found at ${resolvedEnvFile}. Swagger UI disabled.`)
      return
    }

    const specSource = isRemoteUrl ? envSpec : isLocalFile ? localFile : this.OID4VP_SWAGGER_URL
    console.log(`[OID4VP] API docs: ${fullApiDocsPath} (spec: ${specSource})`)

    // Unified spec fetcher
    const getSpec = async (req?: Request): Promise<any> => {
      if (cachedSpec) {
        return cachedSpec
      }

      if (isLocalFile && localFile) {
        const content = fs.readFileSync(localFile, 'utf-8')
        try {
          cachedSpec = JSON.parse(content)
        } catch {
          // YAML - return as string, swagger-ui will parse it
          cachedSpec = content
        }
      } else {
        const url = isRemoteUrl ? envSpec! : this.OID4VP_SWAGGER_URL
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

    // Swagger UI
    this._router.use(
      apiDocsPath,
      swaggerUi.serve,
      swaggerUi.setup(undefined, { swaggerOptions: { url: fullSpecPath } }),
    )
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
