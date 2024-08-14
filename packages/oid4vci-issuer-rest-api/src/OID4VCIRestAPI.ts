import { CredentialDataSupplier, VcIssuer } from '@sphereon/oid4vci-issuer'
import { OID4VCIServer } from '@sphereon/oid4vci-issuer-server'
import { IOID4VCIServerOpts } from '@sphereon/oid4vci-issuer-server'
import { ExpressSupport } from '@sphereon/ssi-express-support'
import { getAccessTokenSignerCallback, IIssuerInstanceArgs, IssuerInstance } from '@sphereon/ssi-sdk.oid4vci-issuer'
import { DIDDocument } from 'did-resolver'
import { Express } from 'express'
import { IRequiredContext } from './types'

export interface IOID4VCIRestAPIOpts extends IOID4VCIServerOpts {}

export class OID4VCIRestAPI {
  private readonly _expressSupport: ExpressSupport
  private readonly _context: IRequiredContext
  private readonly _opts?: IOID4VCIRestAPIOpts
  private readonly _restApi: OID4VCIServer<DIDDocument>
  private readonly _instance: IssuerInstance
  private readonly _issuer: VcIssuer<DIDDocument>

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
    return new OID4VCIRestAPI({ context, issuerInstanceArgs, expressSupport, opts, instance, issuer })
  }

  private constructor(args: {
    issuer: VcIssuer<DIDDocument>
    instance: IssuerInstance
    context: IRequiredContext
    issuerInstanceArgs: IIssuerInstanceArgs
    expressSupport: ExpressSupport
    opts: IOID4VCIRestAPIOpts
  }) {
    const { context, opts } = args
    this._context = context
    this._opts = opts ?? {}
    this._expressSupport = args.expressSupport
    this._issuer = args.issuer
    this._instance = args.instance
    this._restApi = new OID4VCIServer<DIDDocument>(args.expressSupport, { ...opts, issuer: this._issuer })
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

  get restApi(): OID4VCIServer<DIDDocument> {
    return this._restApi
  }

  get instance(): IssuerInstance {
    return this._instance
  }

  get issuer(): VcIssuer<DIDDocument> {
    return this._issuer
  }

  async stop(): Promise<boolean> {
    return this._expressSupport.stop()
  }
}
