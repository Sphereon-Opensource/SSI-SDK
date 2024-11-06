import { FederationEndpoints, IOID4MetadataServerOpts, IRequiredContext, OpenidFederationMetadata } from './types'
import { ExpressSupport } from '@sphereon/ssi-express-support'
import express, { Express } from 'express'

export class OIDFMetadataServer {
  private readonly _expressSupport: ExpressSupport
  private readonly _router: express.Router
  private readonly _context: IRequiredContext
  private readonly _opts?: IOID4MetadataServerOpts

  constructor(args: { context: IRequiredContext; expressSupport: ExpressSupport; opts?: IOID4MetadataServerOpts }) {
    const { context, expressSupport, opts } = args
    this._context = context
    this._expressSupport = expressSupport
    this._opts = opts
    this._router = express.Router()
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

  private hostEndpoints = (metadataEndpoints: Array<OpenidFederationMetadata>) => {
    metadataEndpoints.forEach((metadataEndpoint) => {
      this._router.get(metadataEndpoint.subjectBaseUrl + FederationEndpoints.WELL_KNOWN_OPENID_FEDERATION)
    })
  }

  static async init(args: {
    context: IRequiredContext
    expressSupport: ExpressSupport
    opts?: IOID4MetadataServerOpts
  }): Promise<OIDFMetadataServer> {
    const { context, expressSupport, opts } = args
    const oidfMetadataServer = new OIDFMetadataServer({ context, expressSupport, opts })
    oidfMetadataServer.up()
    return oidfMetadataServer
  }
}
