import { CredentialDataSupplier, CredentialSignerCallback, VcIssuer } from '@sphereon/oid4vci-issuer'
import { getBasePath, OID4VCIServer } from '@sphereon/oid4vci-issuer-server'
import { IOID4VCIServerOpts } from '@sphereon/oid4vci-issuer-server'
import { ExpressSupport } from '@sphereon/ssi-express-support'
import { isDidIdentifier, isIIdentifier } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { ensureRawDocument } from '@sphereon/ssi-sdk.data-store-types'
import { AddCredentialArgs, CredentialCorrelationType } from '@sphereon/ssi-sdk.credential-store'
import {
  createAuthRequestUriCallback,
  getAccessTokenSignerCallback,
  IIssuerInstanceArgs,
  IssuerInstance,
  createVerifyAuthResponseCallback,
} from '@sphereon/ssi-sdk.oid4vci-issuer'
import { CredentialMapper, CredentialRole, OriginalVerifiableCredential } from '@sphereon/ssi-types'
import express, { Express, Request, Response, Router } from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { IRequiredContext } from './types'
import swaggerUi from 'swagger-ui-express'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export interface IOID4VCIRestAPIOpts extends IOID4VCIServerOpts {
  /**
   * When `true`, every credential issued through this OID4VCI REST API is persisted as a
   * {@link CredentialRole.ISSUER} `DigitalCredential` row via the `ICredentialStore` plugin
   * (agent method `crsAddCredential`). Requires the `credential-store` plugin to be present
   * on the agent. Defaults to `false`.
   *
   * Persistence failures are surfaced (fail-fast): when this flag is enabled and the store
   * call throws, the enclosing issuance request fails with an error rather than silently
   * dropping the row. That is intentional — a silent drop is exactly the defect DEV-35 fixes.
   */
  persistIssuedCredentials?: boolean
}

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
    const wrapCredentialSignerCallback = opts.persistIssuedCredentials
      ? OID4VCIRestAPI.buildPersistenceSignerWrapper({ context, instance })
      : undefined
    const issuer = await instance.get({ context, credentialDataSupplier: args.credentialDataSupplier, wrapCredentialSignerCallback })

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

  /**
   * Builds a {@link CredentialSignerCallback} wrapper that persists each issued credential as a
   * {@link CredentialRole.ISSUER} `DigitalCredential` row after delegating the actual signing to
   * the underlying signer. Issuer identity is resolved from the *signed* credential (so any
   * issuer normalization performed by the signer is preserved in the persisted row). The
   * correlation type is derived from the resolved issuer id (`did:` prefix -> DID, otherwise URL),
   * matching the pattern used by the holder-side persistence in `OID4VCIHolder`.
   *
   * Persistence errors propagate to the caller (fail-fast). Callers that opt into
   * `persistIssuedCredentials` are explicitly requesting the row; a silent drop here would
   * reproduce the DEV-35 defect.
   */
  private static buildPersistenceSignerWrapper(args: {
    context: IRequiredContext
    instance: IssuerInstance
  }): (original: CredentialSignerCallback) => CredentialSignerCallback {
    const { context, instance } = args
    return (originalSigner: CredentialSignerCallback): CredentialSignerCallback => {
      return async (signerArgs) => {
        const signed = await originalSigner(signerArgs)
        const rawDocument = ensureRawDocument(signed as OriginalVerifiableCredential)
        const uniform = CredentialMapper.toUniformCredential(signed as OriginalVerifiableCredential)
        let issuerId = CredentialMapper.issuerCorrelationIdFromIssuerType(uniform.issuer)
        if (!issuerId) {
          const fromIdOpts = instance.issuerOptions.idOpts?.identifier ?? instance.issuerOptions.didOpts?.idOpts?.identifier
          if (typeof fromIdOpts === 'string') {
            issuerId = fromIdOpts
          }
        }
        if (!issuerId) {
          return Promise.reject(Error('Cannot persist issued credential: unable to determine issuer identifier from signed credential'))
        }

        const identifier = await context.agent.identifierManagedGet({
          identifier: issuerId,
          issuer: issuerId,
          vmRelationship: 'assertionMethod',
        })

        let issuerCorrelationId = identifier.issuer
        if (!issuerCorrelationId && isDidIdentifier(identifier.identifier)) {
          if (isIIdentifier(identifier.identifier)) {
            issuerCorrelationId = identifier.identifier.did
          } else if (typeof identifier.identifier === 'string') {
            issuerCorrelationId = identifier.identifier
          }
        }
        if (!issuerCorrelationId) {
          issuerCorrelationId = issuerId
        }

        const dc: AddCredentialArgs = {
          credential: {
            credentialRole: CredentialRole.ISSUER,
            kmsKeyRef: identifier.kmsKeyRef,
            identifierMethod: identifier.method,
            issuerCorrelationId,
            issuerCorrelationType: issuerCorrelationId.startsWith('did:') ? CredentialCorrelationType.DID : CredentialCorrelationType.URL,
            rawDocument,
          },
        }
        await context.agent.crsAddCredential(dc)
        return signed
      }
    }
  }

  private readonly OID4VCI_OPENAPI_FILE = path.join(__dirname, '..', 'oid4vci-openapi.yml')

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
    const apiDocsPath = `/api-docs`
    const specPath = `/api-docs/spec.yaml`
    const fullSpecPath = `${this._basePath}${specPath}`

    if (!fs.existsSync(this.OID4VCI_OPENAPI_FILE)) {
      console.log(`[OID4VCI] OpenAPI spec not found at ${this.OID4VCI_OPENAPI_FILE}. Swagger UI disabled.`)
      return
    }

    console.log(`[OID4VCI] API docs available at ${this._baseUrl.origin}${this._basePath}${apiDocsPath}`)
    this.express.set('trust proxy', this.opts?.endpointOpts?.trustProxy ?? true)

    // Serve spec from local file
    this._router.get(specPath, (req: Request, res: Response): void => {
      res.type('text/yaml').sendFile(this.OID4VCI_OPENAPI_FILE)
    })

    // Swagger UI
    this._router.use(
      apiDocsPath,
      swaggerUi.serve,
      swaggerUi.setup(undefined, { swaggerOptions: { url: fullSpecPath } }),
    )
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
