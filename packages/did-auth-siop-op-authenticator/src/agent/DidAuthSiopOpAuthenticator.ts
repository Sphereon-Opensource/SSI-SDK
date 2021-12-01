import { schema } from '../index'
import { IAgentPlugin } from '@veramo/core'
import {
  PassBy,
  ResponseMode,
  ParsedAuthenticationRequestURI,
  PresentationDefinitionWithLocation,
  VerifiedAuthenticationRequestWithJWT,
  VerifyAuthenticationRequestOpts,
  VerifiablePresentationTypeFormat,
  VerificationMode,
} from '@sphereon/did-auth-siop/dist/main/types/SIOP.types'
import { OP, PresentationExchange } from '@sphereon/did-auth-siop/dist/main'
import { SubmissionRequirementMatch, VerifiableCredential } from '@sphereon/pe-js'
import {
  events,
  IAuthenticateWithDidSiopArgs,
  IAuthRequestDetails,
  IDidAuthSiopOpAuthenticator,
  IDidAuthSiopOpAuthenticatorArgs,
  getDidSiopAuthenticationRequestDetailsArgs,
  IGetDidSiopAuthenticationRequestFromRpArgs,
  IMatchedPresentationDefinition,
  IRequiredContext,
  ISendDidSiopAuthenticationResponseArgs,
  IVerifyDidSiopAuthenticationRequestUriArgs,
} from '../types/IDidAuthSiopOpAuthenticator'

const fetch = require('cross-fetch')

/**
 * {@inheritDoc IDidAuthSiopOpAuthenticator}
 */
export class DidAuthSiopOpAuthenticator implements IAgentPlugin {
  readonly schema = schema.IVcApiVerfierAgentPlugin
  readonly methods: IDidAuthSiopOpAuthenticator = {
    authenticateWithDidSiop: this.authenticateWithDidSiop.bind(this),
    getDidSiopAuthenticationRequestFromRP: this.getDidSiopAuthenticationRequestFromRP.bind(this),
    getDidSiopAuthenticationRequestDetails: this.getDidSiopAuthenticationRequestDetails.bind(this),
    verifyDidSiopAuthenticationRequestURI: this.verifyDidSiopAuthenticationRequestURI.bind(this),
    sendDidSiopAuthenticationResponse: this.sendDidSiopAuthenticationResponse.bind(this),
  }
  private readonly op: OP
  private readonly did: string
  private readonly kid: string
  private readonly privateKey: string
  private readonly expiresIn: number | undefined
  private readonly didMethod: string | undefined

  constructor(options: IDidAuthSiopOpAuthenticatorArgs) {
    this.did = options.did
    this.kid = options.kid
    this.privateKey = options.privateKey
    this.expiresIn = options.expiresIn || 6000
    this.didMethod = (options.didMethod as string) || 'ethr'
    this.op = OP.builder()
      .withExpiresIn(this.expiresIn)
      .addDidMethod(this.didMethod)
      .internalSignature(this.privateKey, this.did, this.kid)
      .registrationBy(PassBy.VALUE)
      .response(ResponseMode.POST)
      .build()
  }

  /** {@inheritDoc IDidAuthSiopOpAuthenticator.authenticateWithDidSiop} */
  private async authenticateWithDidSiop(args: IAuthenticateWithDidSiopArgs, context: IRequiredContext): Promise<Response> {
    return this.getDidSiopAuthenticationRequestFromRP({ stateId: args.stateId, redirectUrl: args.redirectUrl }, context)
      .then((authenticationRequest: ParsedAuthenticationRequestURI) =>
        this.verifyDidSiopAuthenticationRequestURI({ requestURI: authenticationRequest, didMethod: args.didMethod }, context)
      )
      .then((verifiedAuthenticationRequest: VerifiedAuthenticationRequestWithJWT) => {
        if (args.customApproval !== undefined) {
          return args
            .customApproval(verifiedAuthenticationRequest)
            .then(() => this.sendDidSiopAuthenticationResponse({ verifiedAuthenticationRequest: verifiedAuthenticationRequest }, context))
        } else {
          return this.sendDidSiopAuthenticationResponse({ verifiedAuthenticationRequest: verifiedAuthenticationRequest }, context)
        }
      })
      .catch((error: unknown) => Promise.reject(error))
  }

  /** {@inheritDoc IDidAuthSiopOpAuthenticator.getDidSiopAuthenticationRequestFromRP} */
  private async getDidSiopAuthenticationRequestFromRP(
    args: IGetDidSiopAuthenticationRequestFromRpArgs,
    context: IRequiredContext
  ): Promise<ParsedAuthenticationRequestURI> {
    return fetch(`${args.redirectUrl}?stateId=${args.stateId}`)
      .then(async (response: Response) =>
        response.status >= 400 ? Promise.reject(new Error(await response.text())) : this.op.parseAuthenticationRequestURI(await response.text())
      )
      .catch((error: unknown) => Promise.reject(error))
  }

  /** {@inheritDoc IDidAuthSiopOpAuthenticator.getDidSiopAuthenticationRequestDetails} */
  private async getDidSiopAuthenticationRequestDetails(
    args: getDidSiopAuthenticationRequestDetailsArgs,
    context: IRequiredContext
  ): Promise<IAuthRequestDetails> {
    const presentationDefs = args.verifiedAuthenticationRequest.presentationDefinitions
    const verifiablePresentations =
      presentationDefs && presentationDefs.length > 0 ? await this.matchPresentationDefinitions(presentationDefs, args.verifiableCredentials) : []
    const didResolutionResult = args.verifiedAuthenticationRequest.didResolutionResult

    return {
      id: didResolutionResult.didDocument!.id,
      alsoKnownAs: didResolutionResult.didDocument!.alsoKnownAs,
      vpResponseOpts: verifiablePresentations,
    }
  }

  private async matchPresentationDefinitions(
    presentationDefs: PresentationDefinitionWithLocation[],
    verifiableCredentials: VerifiableCredential[]
  ): Promise<IMatchedPresentationDefinition[]> {
    const presentationExchange = this.getPresentationExchange(verifiableCredentials)
    return await Promise.all(
      presentationDefs.map(async (presentationDef: PresentationDefinitionWithLocation) => {
        const checked = await presentationExchange.selectVerifiableCredentialsForSubmission(presentationDef.definition)
        if (checked.errors && checked.errors.length > 0) {
          return Promise.reject(new Error(JSON.stringify(checked.errors)))
        }

        const matches: SubmissionRequirementMatch[] | undefined = checked.matches
        if (matches && matches.length == 0) {
          return Promise.reject(new Error(JSON.stringify(checked.errors)))
        }

        const verifiablePresentation = await presentationExchange.submissionFrom(presentationDef.definition, verifiableCredentials)
        return {
          location: presentationDef.location,
          format: VerifiablePresentationTypeFormat.LDP_VP,
          presentation: verifiablePresentation,
        }
      })
    )
  }

  private getPresentationExchange(verifiableCredentials: VerifiableCredential[]): PresentationExchange {
    return new PresentationExchange({
      did: this.op.authResponseOpts.did,
      allVerifiableCredentials: verifiableCredentials,
    })
  }

  /** {@inheritDoc IDidAuthSiopOpAuthenticator.verifyDidSiopAuthenticationRequestURI} */
  private async verifyDidSiopAuthenticationRequestURI(
    args: IVerifyDidSiopAuthenticationRequestUriArgs,
    context: IRequiredContext
  ): Promise<VerifiedAuthenticationRequestWithJWT> {
    const didMethodsSupported = args.requestURI.registration?.did_methods_supported as string[]
    let didMethods: string[] = []
    if (didMethodsSupported && didMethodsSupported.length) {
      didMethods = didMethodsSupported.map((value: string) => value.split(':')[1])
    } else if (args.didMethod) {
      // RP mentioned no didMethods, meaning we have to let it up to the RP to see whether it will work
      didMethods = [args.didMethod]
    }

    const options: VerifyAuthenticationRequestOpts = {
      verification: {
        mode: VerificationMode.INTERNAL,
        resolveOpts: {
          didMethods,
        },
      },
      nonce: args.requestURI.requestPayload.nonce,
    }

    return this.op.verifyAuthenticationRequest(args.requestURI.jwt, options).catch((error: string | undefined) => Promise.reject(new Error(error)))
  }

  /** {@inheritDoc IDidAuthSiopOpAuthenticator.sendDidSiopAuthenticationResponse} */
  private async sendDidSiopAuthenticationResponse(args: ISendDidSiopAuthenticationResponseArgs, context: IRequiredContext): Promise<Response> {
    return this.op
      .createAuthenticationResponse(args.verifiedAuthenticationRequest, { vp: args.verifiablePresentationResponse })
      .then((authResponse) => this.op.submitAuthenticationResponse(authResponse))
      .then(async (response: Response) => {
        if (response.status >= 400) {
          return Promise.reject(`Error ${response.status}: ${response.statusText || (await response.text())}`)
        } else {
          await context.agent.emit(events.DID_SIOP_AUTHENTICATED, response)
          return response
        }
      })
      .catch((error: unknown) => Promise.reject(error))
  }
}
