import { FederationEndpoints, FederationMetadataServerOpts, IRequiredContext } from './types/metadata-server'
import { ExpressSupport } from '@sphereon/ssi-express-support'
import express, { Express, Request, Response, Router } from 'express'
import { OpenidFederationMetadata } from './types/metadata-store'
import { ILayer } from 'express-serve-static-core'
import { logger } from './index'

export class OIDFMetadataServer {
  private readonly _context: IRequiredContext
  private readonly _routers: Map<string, express.Router>
  private readonly _app: Express
  private readonly _opts?: FederationMetadataServerOpts
  private _routerMiddleware: Array<express.RequestHandler>

  constructor(args: { context: IRequiredContext; expressSupport: ExpressSupport; opts?: FederationMetadataServerOpts }) {
    const { expressSupport, context, opts } = args
    this._context = context
    this._app = expressSupport.express
    this._opts = opts
    this._routers = new Map()
    this._routerMiddleware = []
  }

  private getHostAndPath(url: string): { hostname: string; basePath: string } {
    try {
      const urlObj = new URL(url)
      return {
        hostname: urlObj.hostname,
        basePath: urlObj.pathname.replace(/\/+$/, ''), // Remove trailing slashes
      }
    } catch (error) {
      logger.error(`Invalid URL provided: ${url}`, error)
      throw new Error(`Invalid URL provided: ${url}`)
    }
  }

  public async down() {
    // Remove all mounted middleware
    this._routerMiddleware.forEach((middleware) => {
      const index = this._app._router.stack.findIndex((layer: ILayer) => layer.handle === middleware)
      if (index !== -1) {
        this._app._router.stack.splice(index, 1)
      }
    })

    // Clear the collections
    this._routerMiddleware = []
    this._routers.clear()
  }

  public async up() {
    // Clean up existing routes first
    await this.down()

    const metadataEndpoints = await this._context.agent.oidfStoreListMetadata({
      storeId: this._opts?.storeId,
      namespace: this._opts?.namespace,
    })
    const filteredEndpoints = metadataEndpoints.filter((endpoint) => endpoint.enabled !== false)
    this.hostEndpoints(filteredEndpoints)
  }

  private hostEndpoints = (metadataEndpoints: Array<OpenidFederationMetadata>) => {
    logger.debug('metadataEndpoints', metadataEndpoints)

    // Group endpoints by hostname
    const endpointsByHost = new Map<string, Array<{ basePath: string; endpoint: OpenidFederationMetadata }>>()

    metadataEndpoints.forEach((endpoint) => {
      const { hostname, basePath } = this.getHostAndPath(endpoint.baseUrl)

      if (!endpointsByHost.has(hostname)) {
        endpointsByHost.set(hostname, [])
      }
      endpointsByHost.get(hostname)?.push({ basePath, endpoint })
    })

    // Create and configure routers for each hostname
    endpointsByHost.forEach((endpoints, hostname) => {
      const router: Router = express.Router()
      logger.debug('assigning OIDF metadata router to', hostname)
      this._routers.set(hostname, router)

      endpoints.forEach(({ basePath, endpoint }) => {
        const federationPath = basePath + FederationEndpoints.WELL_KNOWN_OPENID_FEDERATION
        logger.debug('mapping OIDF metadata HTTP GET to', federationPath)

        router.get(federationPath, async (request: Request, response: Response) => {
          try {
            const asciiData = Buffer.from(endpoint.jwt, 'ascii')
            response.setHeader('Content-Type', 'application/entity-statement+jwt')
            return response.send(asciiData)
          } catch (error) {
            logger.error('Error processing federation metadata request:', error)
            return response.status(500).send('Internal server error')
          }
        })
      })

      // Mount the router for this hostname and keep track of the middleware
      const middleware = (request: Request, response: Response, next: express.NextFunction) => {
        const forwardedHost = request.headers['x-forwarded-host']?.toString()?.split(':')[0]
        const reqHostname = forwardedHost ?? request.hostname
        if (reqHostname === hostname) {
          router(request, response, next)
        } else {
          next()
        }
      }
      this._routerMiddleware.push(middleware)
      this._app.use(middleware)
    })
  }

  static async init(args: {
    context: IRequiredContext
    expressSupport: ExpressSupport
    opts?: FederationMetadataServerOpts
  }): Promise<OIDFMetadataServer> {
    const { expressSupport, context, opts } = args
    const oidfMetadataServer = new OIDFMetadataServer({ context, expressSupport, opts })
    await oidfMetadataServer.up()
    return oidfMetadataServer
  }
}
