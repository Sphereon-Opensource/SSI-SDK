import { DIDDocumentSection, IIdentifier, IKey, PresentationPayload, TKeyType } from '@veramo/core'
import { _ExtendedIKey } from '@veramo/utils'
import {
  OP,
  ParsedAuthorizationRequestURI,
  PassBy,
  PresentationDefinitionWithLocation,
  PresentationExchange,
  PresentationSignCallback,
  ResolveOpts,
  ResponseMode,
  SigningAlgo,
  SupportedVersion,
  VerifiablePresentationTypeFormat,
  Verification,
  VerificationMode,
  VerifiedAuthorizationRequest,
  VerifyAuthorizationRequestOpts,
  VPTokenLocation,
} from '@sphereon/did-auth-siop'
import { PresentationSignCallBackParams, SubmissionRequirementMatch } from '@sphereon/pex'
import { parseDid, W3CVerifiableCredential, W3CVerifiablePresentation } from '@sphereon/ssi-types'
import { KeyAlgo, SuppliedSigner } from '@sphereon/ssi-sdk-core'
import {
  IAuthRequestDetails,
  IMatchedPresentationDefinition,
  IOpsAuthenticateWithSiopArgs,
  IOpSessionArgs,
  IOpsGetSiopAuthorizationRequestDetailsArgs,
  IOpsGetSiopAuthorizationRequestFromRpArgs,
  IOpsSendSiopAuthorizationResponseArgs,
  IOpsVerifySiopAuthorizationRequestUriArgs,
  IRequiredContext,
  PerDidResolver,
} from '../types/IDidAuthSiopOpAuthenticator'
import { DIDResolutionOptions, DIDResolutionResult, Resolvable } from 'did-resolver'
import { IVerifyCallbackArgs, IVerifyCredentialResult, VerifyCallback } from '@sphereon/wellknown-dids-client'
import { mapIdentifierKeysToDocWithJwkSupport } from '@sphereon/ssi-sdk-did-utils'

const fetch = require('cross-fetch')

export class OpSession {
  public readonly id: string
  public readonly identifier: IIdentifier
  public readonly verificationMethodSection: DIDDocumentSection | undefined
  public readonly expiresIn: number | undefined
  public readonly context: IRequiredContext
  public op: OP | undefined
  private readonly supportedDidMethods: string[]
  private readonly providedDidResolvers: PerDidResolver[]
  private readonly resolver: Resolvable | undefined

  constructor(options: IOpSessionArgs) {
    this.id = options.sessionId
    this.identifier = options.identifier
    this.resolver = options.resolver
    this.providedDidResolvers = options.perDidResolvers || []
    this.supportedDidMethods = options.supportedDidMethods || []
    this.expiresIn = options.expiresIn
    this.verificationMethodSection = options.verificationMethodSection
    this.context = options.context
  }


  // fixme: This probably results in creating an OP with a DID, before we know what DID to use from the wallet, as that should be matched against the AuthRequest from the RP
  public async init(presentationSignCallback?: PresentationSignCallback, wellknownDidVerifyCallback?: VerifyCallback) {
    const didMethod = parseDid(this.identifier.did).method
    const supportedDidMethods = this.supportedDidMethods ? [...this.supportedDidMethods, didMethod] : [didMethod]
    this.op = await this.createOp(
      {
        identifier: this.identifier,
        verificationMethodSection: this.verificationMethodSection,
        // didMethod: parseDid(this.identifier.did).method,
        providedDidResolvers: this.providedDidResolvers,
        supportedDidMethods,
        expiresIn: this.expiresIn || 6000,
        presentationSignCallback,
        wellknownDidVerifyCallback,
      },
      this.context,
    )
  }

  public async authenticateWithSiop(args: IOpsAuthenticateWithSiopArgs): Promise<Response> {
    return this.getSiopAuthorizationRequestFromRP({ stateId: args.stateId, redirectUrl: args.redirectUrl })
      .then((authorizationRequest: ParsedAuthorizationRequestURI) => this.verifySiopAuthorizationRequestURI({ requestURI: authorizationRequest }))
      .then((verifiedAuthorizationRequest: VerifiedAuthorizationRequest) => {
        if (args.customApproval !== undefined) {
          if (typeof args.customApproval === 'string') {
            if (args.customApprovals !== undefined && args.customApprovals[args.customApproval] !== undefined) {
              return args.customApprovals[args.customApproval](verifiedAuthorizationRequest, this.id).then(() =>
                this.sendSiopAuthorizationResponse({ verifiedAuthorizationRequest: verifiedAuthorizationRequest }),
              )
            }
            return Promise.reject(new Error(`Custom approval not found for key: ${args.customApproval}`))
          } else {
            return args
              .customApproval(verifiedAuthorizationRequest, this.id)
              .then(() => this.sendSiopAuthorizationResponse({ verifiedAuthorizationRequest: verifiedAuthorizationRequest }))
          }
        } else {
          return this.sendSiopAuthorizationResponse({ verifiedAuthorizationRequest: verifiedAuthorizationRequest })
        }
      })
      .catch((error: unknown) => Promise.reject(error))
  }

  public async getSiopAuthorizationRequestFromRP(args: IOpsGetSiopAuthorizationRequestFromRpArgs): Promise<ParsedAuthorizationRequestURI> {
    const url = args.stateId ? `${args.redirectUrl}?stateId=${args.stateId}` : args.redirectUrl
    return fetch(url)
      .then(async (response: Response) =>
        response.status >= 400 ? Promise.reject(new Error(await response.text())) : this.op!.parseAuthorizationRequestURI(await response.text()),
      )
      .catch((error: unknown) => Promise.reject(error))
  }

  public async getSiopAuthorizationRequestDetails(args: IOpsGetSiopAuthorizationRequestDetailsArgs): Promise<IAuthRequestDetails> {
    const presentationDefs = args.verifiedAuthorizationRequest.presentationDefinitions
    const matchedPresentationWithPresentationDefinition =
      presentationDefs && presentationDefs.length > 0
        ? await this.matchPresentationDefinitions(presentationDefs, args.verifiableCredentials, args.presentationSignCallback, args.signingOptions)
        : []
    const didResolutionResult = args.verifiedAuthorizationRequest.didResolutionResult

    return {
      rpDIDDocument: didResolutionResult.didDocument ?? undefined,
      id: didResolutionResult.didDocument!.id,
      alsoKnownAs: didResolutionResult.didDocument!.alsoKnownAs,
      verifiablePresentationMatches: matchedPresentationWithPresentationDefinition,
    }
  }

  public async verifySiopAuthorizationRequestURI(args: IOpsVerifySiopAuthorizationRequestUriArgs): Promise<VerifiedAuthorizationRequest> {
    // TODO fix supported dids structure https://sphereon.atlassian.net/browse/MYC-141

    //fixme: registration can also be something else these days: client_metadata
    const didMethodsSupported = args.requestURI.registration?.did_methods_supported as string[]
    let didMethods: string[]
    if (didMethodsSupported && didMethodsSupported.length) {
      didMethods = didMethodsSupported.map((value: string) => value.split(':')[1])
    } else {
      // RP mentioned no didMethods, meaning we have to let it up to the RP to see whether it will work
      didMethods = this.getAgentSupportedDIDMethods()
    }

    const resolveOpts: ResolveOpts = this.resolver ? { resolver: this.resolver } : { subjectSyntaxTypesSupported: didMethods }
    const options: VerifyAuthorizationRequestOpts = {
      verification: {
        mode: VerificationMode.INTERNAL,
        resolveOpts,
      },
      nonce: args.requestURI.authorizationRequestPayload.nonce,
      supportedVersions: [SupportedVersion.SIOPv2_ID1, SupportedVersion.SIOPv2_D11, SupportedVersion.JWT_VC_PRESENTATION_PROFILE_v1],
    }

    return this.op!.verifyAuthorizationRequest(args.requestURI.requestObjectJwt!, options).catch((error: string | undefined) =>
      Promise.reject(new Error(error)),
    )
  }

  private getAgentSupportedDIDMethods() {
    if (this.supportedDidMethods) {
      return [parseDid(this.identifier.did).method, ...this.supportedDidMethods]
    } else {
      return [parseDid(this.identifier.did).method]
    }
  }

  public async sendSiopAuthorizationResponse(args: IOpsSendSiopAuthorizationResponseArgs): Promise<Response> {
    const resolveOpts: ResolveOpts = this.resolver ? { resolver: this.resolver } : { subjectSyntaxTypesSupported: this.getAgentSupportedDIDMethods() }
    const verification: Verification = {
      mode: VerificationMode.INTERNAL,
      resolveOpts,
    }

    return this.op!.createAuthorizationResponse(args.verifiedAuthorizationRequest, {
      verification,
      presentationExchange: {
        verifiablePresentations: args.verifiablePresentations ?? [],
        // vps: args.verifiablePresentationResponse,
      },
    })
      .then((authResponse) => this.op!.submitAuthorizationResponse(authResponse))
      .then(async (response: Response) => {
        if (response.status >= 400) {
          return Promise.reject(new Error(`Error ${response.status}: ${response.statusText || (await response.text())}`))
        } else {
          return response
        }
      })
      .catch((error: unknown) => Promise.reject(error))
  }

  private async matchPresentationDefinitions(
    presentationDefs: PresentationDefinitionWithLocation[],
    verifiableCredentials: W3CVerifiableCredential[],
    presentationSignCallback: PresentationSignCallback,
    options?: {
      presentationSignCallback?: PresentationSignCallback
      nonce?: string
      domain?: string
    },
  ): Promise<IMatchedPresentationDefinition[]> {
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
    return async (presentationDef: PresentationDefinitionWithLocation): Promise<IMatchedPresentationDefinition> => {
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

  private getPresentationExchange(verifiableCredentials: W3CVerifiableCredential[]): PresentationExchange {
    return new PresentationExchange({
      did: this.op!.createResponseOptions.signatureType.did,
      allVerifiableCredentials: verifiableCredentials,
    })
  }

  private async getKey(
    identifier: IIdentifier,
    verificationMethodSection: DIDDocumentSection = 'authentication',
    context: IRequiredContext,
    keyId?: string,
  ): Promise<IKey> {
    const keys = await mapIdentifierKeysToDocWithJwkSupport(identifier, verificationMethodSection, context)
    if (!keys || keys.length === 0) {
      throw new Error(`No keys found for verificationMethodSection: ${verificationMethodSection} and did ${identifier.did}`)
    }

    const identifierKey = keyId ? keys.find((key: _ExtendedIKey) => key.kid === keyId || key.meta.verificationMethod.id === keyId) : keys[0]
    if (!identifierKey) {
      throw new Error(`No matching verificationMethodSection key found for keyId: ${keyId}`)
    }

    return identifierKey
  }

  private getSigningAlgo(type: TKeyType): SigningAlgo {
    switch (type) {
      case 'Ed25519':
        return SigningAlgo.EDDSA
      case 'Secp256k1':
        return SigningAlgo.ES256K
      case 'Secp256r1':
        return SigningAlgo.ES256
      // @ts-ignore
      case 'RSA':
        return SigningAlgo.RS256
      default:
        throw Error('Key type not yet supported')
    }
  }

  private async createOp(
    {
      identifier,
      verificationMethodSection,
      // didMethod,
      providedDidResolvers,
      supportedDidMethods,
      expiresIn,
      presentationSignCallback,
      wellknownDidVerifyCallback,
    }: {
      identifier: IIdentifier
      verificationMethodSection?: DIDDocumentSection | undefined
      // didMethod: string
      providedDidResolvers?: PerDidResolver[]
      supportedDidMethods: string[]
      expiresIn: number
      presentationSignCallback?: PresentationSignCallback
      wellknownDidVerifyCallback?: VerifyCallback
    },
    context: IRequiredContext,
  ): Promise<OP> {
    if (!identifier.controllerKeyId) {
      return Promise.reject(new Error(`No controller key found for identifier: ${identifier.did}`))
    }

    const keyRef = await this.getKey(identifier, verificationMethodSection, context)
    const verifyCallback = wellknownDidVerifyCallback
      ? wellknownDidVerifyCallback
      : async (): Promise<IVerifyCredentialResult> => {
        return { verified: true }
      }

    const presentationCallback = presentationSignCallback
      ? presentationSignCallback
      : async (args: PresentationSignCallBackParams): Promise<W3CVerifiablePresentation> => {
        const presentation: PresentationPayload = args.presentation as PresentationPayload
        const format = args.presentationDefinition.format
        return (await context.agent.createVerifiablePresentation({
          presentation,
          keyRef: keyRef.kid,
          fetchRemoteContexts: true,
          proofFormat: format && (format.ldp || format.ldp_vp) ? 'lds' : 'jwt',
        })) as W3CVerifiablePresentation
      }

    const builder = OP.builder()
      .withExpiresIn(expiresIn)
      // .addDidMethod(didMethod)
      .suppliedSignature(
        SuppliedSigner(keyRef, context, this.getSigningAlgo(keyRef.type) as unknown as KeyAlgo),
        identifier.did,
        identifier.controllerKeyId,
        this.getSigningAlgo(keyRef.type),
      ).withRegistration({
        passBy: PassBy.VALUE
      }).withResponseMode(ResponseMode.POST)
      .addVerifyCallback((args: IVerifyCallbackArgs) => verifyCallback(args))
      .withPresentationSignCallback(presentationCallback)
      .withSupportedVersions([SupportedVersion.SIOPv2_ID1, SupportedVersion.JWT_VC_PRESENTATION_PROFILE_v1, SupportedVersion.SIOPv2_D11])
    if (supportedDidMethods && supportedDidMethods.length > 0) {
      supportedDidMethods.forEach((method) => builder.addDidMethod(method))
    }
    if (providedDidResolvers && providedDidResolvers.length > 0) {
      providedDidResolvers.forEach((providedResolver) => builder.addResolver(providedResolver.didMethod, providedResolver.resolver))
    } else {
      class Resolver implements Resolvable {
        async resolve(didUrl: string, options?: DIDResolutionOptions): Promise<DIDResolutionResult> {
          return await context.agent.resolveDid({ didUrl, options })
        }
      }

      builder.customResolver = new Resolver()
    }

    return builder.build()
  }
}
