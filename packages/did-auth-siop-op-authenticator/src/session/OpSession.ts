import { IIdentifier } from '@veramo/core'
import { RequestObjectPayload, ResolveOpts, URI, Verification, VerificationMode, VerifiedAuthorizationRequest } from '@sphereon/did-auth-siop'
import { IOPOptions, IOpSessionArgs, IOpsSendSiopAuthorizationResponseArgs, IRequiredContext } from '../types/IDidAuthSiopOpAuthenticator'
import { AgentDIDResolver, getAgentDIDMethods } from '@sphereon/ssi-sdk-did-utils'
import { createOP } from './functions'
import { OID4VP } from './OID4VP'
import { CredentialMapper } from '@sphereon/ssi-types'

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
        ? Array.isArray(payload?.subject_syntax_types_supported)
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
    return (await this.getMergedRequestPayload()).redirect_uri
  }

  public async isOID4VP(): Promise<boolean> {
    const defs = (await this.getAuthorizationRequest()).presentationDefinitions
    return defs !== undefined && defs.length > 0
  }

  public async getOID4VP(allDIDs?: string[]): Promise<OID4VP> {
    return await OID4VP.init(this, allDIDs ?? (await this.getSupportedDIDs()))
  }

  private async getMergedRequestPayload(): Promise<RequestObjectPayload> {
    return await (await this.getAuthorizationRequest()).authorizationRequest.mergedPayloads()
  }

  /* public async getSiopAuthorizationRequestFromRP(args: IOpsGetSiopAuthorizationRequestFromRpArgs): Promise<ParsedAuthorizationRequestURI> {
     const url = args.stateId ? `${args.redirectUrl}?stateId=${args.stateId}` : args.redirectUrl
     return fetch(url)
       .then(async (response: Response) =>
         response.status >= 400 ? Promise.reject(new Error(await response.text())) : this._op!.parseAuthorizationRequestURI(await response.text())
       )
       .catch((error: unknown) => Promise.reject(error))
   }*/

  /* public async getSiopAuthorizationRequestDetails(args: IOpsGetSiopAuthorizationRequestDetailsArgs): Promise<IAuthRequestDetails> {
     const presentationDefs = await this.getPresentationDefinitions()
     const verifiablePresentationMatches =
       presentationDefs && presentationDefs.length > 0
         ? await this.matchPresentationDefinitions(presentationDefs, args.verifiableCredentials, args.presentationSignCallback, args.signingOptions)
         : []
     const didResolutionResult = (await this.getAuthorizationRequest()).didResolutionResult

     return {
       rpDIDDocument: didResolutionResult.didDocument ?? undefined,
       id: didResolutionResult.didDocument!.id,
       alsoKnownAs: didResolutionResult.didDocument!.alsoKnownAs,
       verifiablePresentationMatches: verifiablePresentationMatches,
     }
   }
 */

  public async sendAuthorizationResponse(args: IOpsSendSiopAuthorizationResponseArgs): Promise<Response> {
    const resolveOpts: ResolveOpts = this.options.resolveOpts ?? { resolver: new AgentDIDResolver(this.context, true) }
    if (!resolveOpts.subjectSyntaxTypesSupported || resolveOpts.subjectSyntaxTypesSupported.length === 0) {
      resolveOpts.subjectSyntaxTypesSupported = await this.getSupportedDIDMethods(true)
    }
    const verification: Verification = {
      mode: VerificationMode.INTERNAL,
      resolveOpts,
    }

    const request = this.verifiedAuthorizationRequest!
    if (
      (await this.isOID4VP()) &&
      request.presentationDefinitions &&
      (!args.verifiablePresentations || args.verifiablePresentations.length !== request.presentationDefinitions.length)
    ) {
      throw Error(`Amount of presentations ${args.verifiablePresentations?.length}, doesn't match expected ${request.presentationDefinitions.length}`)
    }

    const verifiablePresentations = args.verifiablePresentations
      ? args.verifiablePresentations.map((vp) => CredentialMapper.storedPresentationToOriginalFormat(vp))
      : []
    const op = await createOP({ opOptions: this.options, idOpts: args.responseSignerOpts, context: this.context })

    const responseOpts = {
      verification,
      // ...(args.responseSignerOpts ? { signer: args.responseSignerOpts} : {}),
      ...(args.verifiablePresentations
        ? {
            presentationExchange: {
              verifiablePresentations,
            },
          }
        : {}),
    }
    /*    if (!responseOpts.signer) {
      throw Error('Signer needs to be present when creating the response')
    }*/
    const authResponse = await op.createAuthorizationResponse(await this.getAuthorizationRequest(), responseOpts)
    const response = await op.submitAuthorizationResponse(authResponse)

    if (response.status >= 400) {
      throw Error(`Error ${response.status}: ${response.statusText || (await response.text())}`)
    } else {
      return response
    }
  }

  /*

    private async matchPresentationDefinitions(
      presentationDefs: PresentationDefinitionWithLocation[],
      verifiableCredentials: W3CVerifiableCredential[],
      presentationSignCallback: PresentationSignCallback,
      options?: {
        presentationSignCallback?: PresentationSignCallback
        nonce?: string
        domain?: string
      },
    ): Promise<IPresentationWithDefinition[]> {
      return await Promise.all(presentationDefs.map(this.mapper(verifiableCredentials, presentationSignCallback, options)))
    }

    private mapper(
      verifiableCredentials: W3CVerifiableCredential[],
      presentationSignCallback: PresentationSignCallback,
      options?: {
        nonce?: string
        domain?: string
      },
    ) {
      return async (presentationDef: PresentationDefinitionWithLocation): Promise<IPresentationWithDefinition> => {
        const presentationExchange = this.getPresentationExchange(verifiableCredentials)
        const checked = await presentationExchange.selectVerifiableCredentialsForSubmission(presentationDef.definition)
        if (checked.errors && checked.errors.length > 0) {
          return Promise.reject(new Error(JSON.stringify(checked.errors)))
        }

        const matches: SubmissionRequirementMatch[] | undefined = checked.matches
        if (!matches || matches.length === 0 || !checked.verifiableCredential || checked.verifiableCredential.length === 0) {
          return Promise.reject(new Error(JSON.stringify(checked.errors)))
        }

        const verifiablePresentation: W3CVerifiablePresentation = await presentationExchange.createVerifiablePresentation(
          presentationDef.definition,
          checked.verifiableCredential,
          // todo: Do we want to expose more options?
          { proofOptions: { nonce: options?.nonce, domain: options?.domain } },
          presentationSignCallback,
        )

        let format = typeof verifiablePresentation !== 'string' ? VerifiablePresentationTypeFormat.LDP_VP : VerifiablePresentationTypeFormat.JWT_VP
        return {
          definition: presentationDef,
          location: VPTokenLocation.AUTHORIZATION_RESPONSE, // fixme: Inspect auth request for location, which did-auth-siop can do
          format,
          presentation: verifiablePresentation,
        }
      }
    }
  */

  /*
    public async authenticateWithSiop(args: IOpsAuthenticateWithSiopArgs): Promise<Response> {
      // fixme: This flow misses several items, like VCs, creating the VPs etc
      if (args.stateId || args.redirectUrl || this._op || true) {
        throw Error('please use individual methods instead of authetnicateWithSiop for now!')
      }

      return this.getSiopAuthorizationRequestFromRP({ stateId: args.stateId, redirectUrl: args.redirectUrl })
        .then((authorizationRequest: ParsedAuthorizationRequestURI) => this.verifyAuthorizationRequest({ requestURI: authorizationRequest }))
        .then((verifiedAuthorizationRequest) => {
          // const authDetails = await this.getSiopAuthorizationRequestDetails({ verifiedAuthorizationRequest: verifiedAuthorizationRequest, verifiableCredentials: args.})
          if (args.customApproval !== undefined) {
            if (typeof args.customApproval === 'string') {
              if (args.customApprovals !== undefined && args.customApprovals[args.customApproval] !== undefined) {
                return args.customApprovals[args.customApproval](verifiedAuthorizationRequest, this.id).then(() =>
                  this.sendSiopAuthorizationResponse({ verifiedAuthorizationRequest: verifiedAuthorizationRequest }),
                )
              }
              return Promise.reject(new Error(`Custom approval not found for key: ${args.customApproval}`))
            } else {
              return args.customApproval(verifiedAuthorizationRequest, this.id).then(() =>
                this.sendSiopAuthorizationResponse({
                  verifiedAuthorizationRequest: verifiedAuthorizationRequest,
                  verifiablePresentations: undefined /!*fixme*!/,
                }),
              )
            }
          } else {
            return this.sendSiopAuthorizationResponse({ verifiedAuthorizationRequest: verifiedAuthorizationRequest })
          }
        })
        .catch((error: unknown) => Promise.reject(error))
    }*/
}
