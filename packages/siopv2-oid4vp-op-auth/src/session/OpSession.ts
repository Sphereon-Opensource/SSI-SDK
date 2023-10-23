import { CheckLinkedDomain, ResolveOpts, URI, Verification, VerificationMode, VerifiedAuthorizationRequest } from '@sphereon/did-auth-siop'
import { PresentationExchangeResponseOpts } from '@sphereon/did-auth-siop/dist/authorization-response'
import { getAgentDIDMethods, getAgentResolver, getDID } from '@sphereon/ssi-sdk-ext.did-utils'
import { CredentialMapper } from '@sphereon/ssi-types'
import { IIdentifier } from '@veramo/core'
import { IOPOptions, IOpSessionArgs, IOpsSendSiopAuthorizationResponseArgs, IRequiredContext } from '../types/IDidAuthSiopOpAuthenticator'
import { createOP } from './functions'
import { OID4VP } from './OID4VP'

export class OpSession {
  public readonly ts = new Date().getDate()
  public readonly id: string
  public readonly options: IOPOptions
  public readonly context: IRequiredContext
  private readonly requestJwtOrUri: string | URI
  private verifiedAuthorizationRequest?: VerifiedAuthorizationRequest | undefined
  private _nonce?: string
  private _state?: string

  private constructor(options: Required<IOpSessionArgs>) {
    this.id = options.sessionId
    this.options = options.op
    this.context = options.context
    this.requestJwtOrUri = options.requestJwtOrUri
  }

  public static async init(options: Required<IOpSessionArgs>): Promise<OpSession> {
    return new OpSession(options)
  }

  public async getAuthorizationRequest(): Promise<VerifiedAuthorizationRequest> {
    if (!this.verifiedAuthorizationRequest) {
      const op = await createOP({ opOptions: this.options, context: this.context })
      this.verifiedAuthorizationRequest = await op.verifyAuthorizationRequest(this.requestJwtOrUri)
      this._nonce = await this.verifiedAuthorizationRequest.authorizationRequest.getMergedProperty('nonce')
      this._state = await this.verifiedAuthorizationRequest.authorizationRequest.getMergedProperty('state')
      // only used to ensure that we have DID methods supported
      await this.getSupportedDIDMethods()
    }
    return this.verifiedAuthorizationRequest
  }

  public async getAuthorizationRequestURI(): Promise<URI> {
    return await URI.fromAuthorizationRequest((await this.getAuthorizationRequest()).authorizationRequest)
  }

  get nonce() {
    if (!this._nonce) {
      throw Error('No nonce available. Please get authorization request first')
    }
    return this._nonce
  }

  get state() {
    if (!this._state) {
      throw Error('No state available. Please get authorization request first')
    }
    return this._state
  }

  public clear(): OpSession {
    this._nonce = undefined
    this._state = undefined
    this.verifiedAuthorizationRequest = undefined
    return this
  }

  public async getSupportedDIDMethods(didPrefix?: boolean) {
    const agentMethods = this.options.supportedDIDMethods?.map((method) => method.toLowerCase().replace('did:', ''))
    const payload = (await this.getAuthorizationRequest()).registrationMetadataPayload
    const rpMethods = (
      payload?.subject_syntax_types_supported
        ? Array.isArray(payload.subject_syntax_types_supported)
          ? payload.subject_syntax_types_supported
          : [payload.subject_syntax_types_supported]
        : []
    ).map((method) => method.toLowerCase().replace('did:', ''))

    let intersection: string[]
    if (rpMethods.length === 0 || rpMethods.includes('did')) {
      intersection = agentMethods || (await getAgentDIDMethods(this.context)) // fallback in case the agent methods are undefined
    } else if (!agentMethods || agentMethods.length === 0) {
      intersection = rpMethods
    } else {
      intersection = agentMethods.filter((value) => rpMethods.includes(value))
    }
    if (intersection.length === 0) {
      throw Error('No matching DID methods between agent and relying party')
    }
    return intersection.map((value) => (didPrefix === false ? value : `did:${value}`))
  }

  public async getSupportedIdentifiers(): Promise<IIdentifier[]> {
    // todo: we also need to check signature algo
    const methods = await this.getSupportedDIDMethods(true)
    return await this.context.agent.didManagerFind().then((ids) => ids.filter((id) => methods.includes(id.provider)))
  }

  public async getSupportedDIDs(): Promise<string[]> {
    return (await this.getSupportedIdentifiers()).map((id) => id.did)
  }

  public async getRedirectUri(): Promise<string> {
    return Promise.resolve(this.verifiedAuthorizationRequest!.responseURI!)
  }

  public async hasPresentationDefinitions(): Promise<boolean> {
    const defs = (await this.getAuthorizationRequest()).presentationDefinitions
    return defs !== undefined && defs.length > 0
  }

  public async getOID4VP(allDIDs?: string[]): Promise<OID4VP> {
    return await OID4VP.init(this, allDIDs ?? (await this.getSupportedDIDs()))
  }

  /*private async getMergedRequestPayload(): Promise<RequestObjectPayload> {
          return await (await this.getAuthorizationRequest()).authorizationRequest.mergedPayloads()
        }*/
  public async sendAuthorizationResponse(args: IOpsSendSiopAuthorizationResponseArgs): Promise<Response> {
    const resolveOpts: ResolveOpts = this.options.resolveOpts ?? {
      resolver: getAgentResolver(this.context, {
        uniresolverResolution: true,
        localResolution: true,
        resolverResolution: true,
      }),
    }
    if (!resolveOpts.subjectSyntaxTypesSupported || resolveOpts.subjectSyntaxTypesSupported.length === 0) {
      resolveOpts.subjectSyntaxTypesSupported = await this.getSupportedDIDMethods(true)
    }
    const verification: Verification = {
      mode: VerificationMode.INTERNAL,
      checkLinkedDomain: CheckLinkedDomain.IF_PRESENT,
      resolveOpts,
    }

    const request = await this.getAuthorizationRequest()
    const hasDefinitions = await this.hasPresentationDefinitions()
    if (hasDefinitions) {
      if (
        !request.presentationDefinitions ||
        !args.verifiablePresentations ||
        args.verifiablePresentations.length !== request.presentationDefinitions.length
      ) {
        throw Error(
          `Amount of presentations ${args.verifiablePresentations?.length}, doesn't match expected ${request.presentationDefinitions?.length}`
        )
      } else if (!args.presentationSubmission) {
        throw Error(`Presentation submission is required when verifiable presentations are required`)
      }
    }

    const verifiablePresentations = args.verifiablePresentations
      ? args.verifiablePresentations.map((vp) => CredentialMapper.storedPresentationToOriginalFormat(vp))
      : []
    const op = await createOP({
      opOptions: {
        ...this.options,
        resolveOpts: { ...this.options.resolveOpts },
        eventEmitter: this.options.eventEmitter,
        presentationSignCallback: this.options.presentationSignCallback,
        wellknownDIDVerifyCallback: this.options.wellknownDIDVerifyCallback,
        supportedVersions: request.versions,
      },
      idOpts: args.responseSignerOpts,
      context: this.context,
    })

    let issuer = args.responseSignerOpts?.identifier ? getDID(args.responseSignerOpts) : undefined
    const responseOpts = {
      verification,
      issuer,
      ...(args.verifiablePresentations && {
        presentationExchange: {
          verifiablePresentations,
          presentationSubmission: args.presentationSubmission,
        } as PresentationExchangeResponseOpts,
      }),
    }

    const authResponse = await op.createAuthorizationResponse(request, responseOpts)
    const response = await op.submitAuthorizationResponse(authResponse)

    if (response.status >= 400) {
      throw Error(`Error ${response.status}: ${response.statusText || (await response.text())}`)
    } else {
      return response
    }
  }
}
