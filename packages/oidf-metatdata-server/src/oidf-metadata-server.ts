import { FederationEndpoints, IOID4MetadataServerOpts, IRequiredContext, OpenidFederationMetadata } from './types'
import { ExpressSupport } from '@sphereon/ssi-express-support'
import express, { Request, Response, Express, Router } from 'express'
import { IAgentPlugin } from '@veramo/core'

export default class OIDFMetadataServer implements IAgentPlugin {
  private readonly _routers: Map<string, express.Router>
  private readonly _context: IRequiredContext
  private readonly _opts?: IOID4MetadataServerOpts
  private readonly _app: Express

  // map the methods your plugin is declaring to their implementation
  readonly methods: ISDJwtPlugin = {
    createSdJwtVc: this.createSdJwtVc.bind(this),
    createSdJwtPresentation: this.createSdJwtPresentation.bind(this),
    verifySdJwtVc: this.verifySdJwtVc.bind(this),
    verifySdJwtPresentation: this.verifySdJwtPresentation.bind(this),
  }

  constructor(args: { context: IRequiredContext; expressSupport: ExpressSupport; opts?: IOID4MetadataServerOpts }) {
    const { context, expressSupport, opts } = args
    this._context = context
    this._opts = opts
    this._app = expressSupport.express
    this._routers = new Map()
  }

  public async up() {
    const metadataEndpoints = (await this._context.agent.oid4vciStoreListMetadata({
      metadataType: 'openidFederation',
      storeId: this._opts?.storeId,
      namespace: this._opts?.namespace,
    })) as Array<OpenidFederationMetadata | undefined>

    const filteredEndpoints = metadataEndpoints.filter((endpoint): endpoint is OpenidFederationMetadata => endpoint !== undefined && endpoint.enabled)
    this.hostEndpoints(filteredEndpoints)
  }

  private getHostAndPath(url: string): { hostname: string; basePath: string } {
    const urlObj = new URL(url)
    return {
      hostname: urlObj.hostname,
      basePath: urlObj.pathname.replace(/\/+$/, ''), // Remove trailing slashes
    }
  }

  private hostEndpoints = (metadataEndpoints: Array<OpenidFederationMetadata>) => {
    // Group endpoints by hostname
    const endpointsByHost = new Map<string, Array<{ basePath: string; endpoint: OpenidFederationMetadata }>>()

    metadataEndpoints.forEach((endpoint) => {
      const { hostname, basePath } = this.getHostAndPath(endpoint.subjectBaseUrl)

      if (!endpointsByHost.has(hostname)) {
        endpointsByHost.set(hostname, [])
      }
      endpointsByHost.get(hostname)?.push({ basePath, endpoint })
    })

    // Create and configure routers for each hostname
    endpointsByHost.forEach((endpoints, hostname) => {
      const router: Router = express.Router()
      this._routers.set(hostname, router)

      endpoints.forEach(({ basePath, endpoint }) => {
        const federationPath = basePath + FederationEndpoints.WELL_KNOWN_OPENID_FEDERATION

        router.get(federationPath, async (request: Request, response: Response) => {
          const asciiData = Buffer.from(endpoint.jwt, 'ascii')
          response.setHeader('Content-Type', 'application/entity-statement+jwt')
          return response.send(asciiData)
        })
      })

      // Mount the router for this hostname
      this._app.use((request: Request, response: Response, next: express.NextFunction) => {
        if (request.hostname === hostname) {
          router(request, response, next)
        } else {
          next()
        }
      })
    })
  }

  static async init(args: {
    context: IRequiredContext
    expressSupport: ExpressSupport
    opts?: IOID4MetadataServerOpts
  }): Promise<OIDFMetadataServer> {
    const { context, expressSupport, opts } = args
    const oidfMetadataServer = new OIDFMetadataServer({ context, expressSupport, opts })
    await oidfMetadataServer.up()
    return oidfMetadataServer
  }
}
