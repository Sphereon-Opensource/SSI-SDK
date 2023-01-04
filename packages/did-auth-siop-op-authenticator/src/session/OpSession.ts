import { DIDDocumentSection, IIdentifier, IKey, TKeyType } from '@veramo/core'
import { _ExtendedIKey, mapIdentifierKeysToDoc } from '@veramo/utils'
import {
  OP,
  PresentationExchange,
  VerifiedAuthorizationRequest,
  ParsedAuthorizationRequestURI,
  VerifiablePresentationTypeFormat,
  VerifiablePresentationWithLocation,
  VerifyAuthorizationRequestOpts,
  VerificationMode,
  PassBy,
  Verification,
  ResponseMode,
  PresentationDefinitionWithLocation,
  PresentationSignCallback
} from '@sphereon/did-auth-siop'
import { SubmissionRequirementMatch } from '@sphereon/pex'
import { IVerifiableCredential, IVerifiablePresentation, parseDid } from '@sphereon/ssi-types'
import { SuppliedSigner } from '@sphereon/ssi-sdk-core'
import {
  IOpSessionArgs,
  IOpsAuthenticateWithSiopArgs,
  IOpsGetSiopAuthorizationRequestDetailsArgs,
  IOpsGetSiopAuthorizationRequestFromRpArgs,
  IOpsSendSiopAuthorizationResponseArgs,
  IOpsVerifySiopAuthorizationRequestUriArgs,
  IAuthRequestDetails,
  IMatchedPresentationDefinition,
  IRequiredContext,
  PerDidResolver,
} from '../types/IDidAuthSiopOpAuthenticator'
import { Resolvable } from 'did-resolver'
import {KeyAlgo} from "@sphereon/ssi-sdk-core/dist/signers/SuppliedSigner";

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

  public async init() {
    this.op = await this.createOp(
      this.identifier,
      this.verificationMethodSection,
      parseDid(this.identifier.did).method,
      this.providedDidResolvers,
      this.supportedDidMethods || [],
      this.expiresIn || 6000,
      this.context
    )
  }

  public async authenticateWithSiop(args: IOpsAuthenticateWithSiopArgs): Promise<Response> {
    return this.getSiopAuthorizationRequestFromRP({ stateId: args.stateId, redirectUrl: args.redirectUrl })
      .then((authorizationRequest: ParsedAuthorizationRequestURI) =>
        this.verifySiopAuthorizationRequestURI({ requestURI: authorizationRequest })
      )
      .then((verifiedAuthorizationRequest: VerifiedAuthorizationRequest) => {
        if (args.customApproval !== undefined) {
          if (typeof args.customApproval === 'string') {
            if (args.customApprovals !== undefined && args.customApprovals[args.customApproval] !== undefined) {
              return args.customApprovals[args.customApproval](verifiedAuthorizationRequest, this.id).then(() =>
                this.sendSiopAuthorizationResponse({ verifiedAuthorizationRequest: verifiedAuthorizationRequest })
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
        response.status >= 400 ? Promise.reject(new Error(await response.text())) : this.op!.parseAuthorizationRequestURI(await response.text())
      )
      .catch((error: unknown) => Promise.reject(error))
  }

  public async getSiopAuthorizationRequestDetails(args: IOpsGetSiopAuthorizationRequestDetailsArgs, presentationSignCallback: PresentationSignCallback): Promise<IAuthRequestDetails> {
    // TODO fix vc retrievement https://sphereon.atlassian.net/browse/MYC-142
    const presentationDefs = args.verifiedAuthorizationRequest.presentationDefinitions
    const verifiablePresentations =
      presentationDefs && presentationDefs.length > 0 ? await this.matchPresentationDefinitions(presentationDefs, args.verifiableCredentials, presentationSignCallback, args.signingOptions) : []
    const didResolutionResult = args.verifiedAuthorizationRequest.didResolutionResult

    return {
      id: didResolutionResult.didDocument!.id,
      alsoKnownAs: didResolutionResult.didDocument!.alsoKnownAs,
      vpResponseOpts: verifiablePresentations as unknown as VerifiablePresentationWithLocation[],
    }
  }

  public async verifySiopAuthorizationRequestURI(
    args: IOpsVerifySiopAuthorizationRequestUriArgs
  ): Promise<VerifiedAuthorizationRequest> {
    // TODO fix supported dids structure https://sphereon.atlassian.net/browse/MYC-141
    const didMethodsSupported = args.requestURI.registration?.did_methods_supported as string[]
    let didMethods: string[]
    if (didMethodsSupported && didMethodsSupported.length) {
      didMethods = didMethodsSupported.map((value: string) => value.split(':')[1])
    } else {
      // RP mentioned no didMethods, meaning we have to let it up to the RP to see whether it will work
      if (this.supportedDidMethods) {
        didMethods = [parseDid(this.identifier.did).method, ...this.supportedDidMethods]
      } else {
        didMethods = [parseDid(this.identifier.did).method]
      }
    }

    const resolveOpts = this.resolver ? { resolver: this.resolver } : { didMethods }
    const options: VerifyAuthorizationRequestOpts = {
      verification: {
        mode: VerificationMode.INTERNAL,
        resolveOpts,
      },
      nonce: args.requestURI.authorizationRequestPayload.nonce,
    }

    return this.op!.verifyAuthorizationRequest(args.requestURI.requestObjectJwt!, options).catch((error: string | undefined) => Promise.reject(new Error(error)))
  }

  public async sendSiopAuthorizationResponse(args: IOpsSendSiopAuthorizationResponseArgs): Promise<Response> {
    const verification: Verification = {
      mode: VerificationMode.INTERNAL,
      resolveOpts: {
        resolver: this.resolver
      }
    }

    return this.op!.createAuthorizationResponse(
        args.verifiedAuthorizationRequest,
        {
          verification,
          presentationExchange: {
            vps: args.verifiablePresentationResponse
          }
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
    verifiableCredentials: IVerifiableCredential[],
    presentationSignCallback: PresentationSignCallback,
    options?: {
      presentationSignCallback?: PresentationSignCallback
      nonce?: string;
      domain?: string;
    }
  ): Promise<IMatchedPresentationDefinition[]> {
    return await Promise.all(
      presentationDefs.map(this.mapper(verifiableCredentials, presentationSignCallback, options))
    )
  }

  private mapper(
    verifiableCredentials: IVerifiableCredential[],
    presentationSignCallback: PresentationSignCallback,
    options?: {
      nonce?: string;
      domain?: string;
    }
  ) {
    return async (presentationDef: PresentationDefinitionWithLocation): Promise<IMatchedPresentationDefinition>  => {
      const presentationExchange = this.getPresentationExchange(verifiableCredentials)
      const checked = await presentationExchange.selectVerifiableCredentialsForSubmission(presentationDef.definition)
      if (checked.errors && checked.errors.length > 0) {
        return Promise.reject(new Error(JSON.stringify(checked.errors)))
      }

      const matches: SubmissionRequirementMatch[] | undefined = checked.matches
      if (matches && matches.length == 0) {
        return Promise.reject(new Error(JSON.stringify(checked.errors)))
      }

      const verifiablePresentation = await presentationExchange.submissionFrom(
          presentationDef.definition,
          checked.verifiableCredential as IVerifiableCredential[],
          options,
          presentationSignCallback
      )
      return {
          location: presentationDef.location,
          format: VerifiablePresentationTypeFormat.LDP_VP,
          presentation: verifiablePresentation as IVerifiablePresentation,
        }
    };
  }

  private getPresentationExchange(verifiableCredentials: IVerifiableCredential[]): PresentationExchange {
    return new PresentationExchange({
      did: this.op!.createResponseOptions.did,
      allVerifiableCredentials: verifiableCredentials,
    })
  }

  private async getKey(
    identifier: IIdentifier,
    verificationMethodSection: DIDDocumentSection = 'authentication',
    context: IRequiredContext,
    keyId?: string
  ): Promise<IKey> {
    const keys = await mapIdentifierKeysToDoc(identifier, verificationMethodSection, context)
    if (!keys || keys.length === 0) {
      throw new Error(`No keys found for verificationMethodSection: ${verificationMethodSection} and did ${identifier.did}`)
    }

    const identifierKey = keyId ? keys.find((key: _ExtendedIKey) => key.kid === keyId || key.meta.verificationMethod.id === keyId) : keys[0]
    if (!identifierKey) {
      throw new Error(`No matching verificationMethodSection key found for keyId: ${keyId}`)
    }

    return identifierKey
  }

  private getKeyAlgorithm(type: TKeyType): KeyAlgo {
    switch (type) {
      case 'Ed25519':
        return KeyAlgo.EDDSA
      case 'Secp256k1':
        return KeyAlgo.ES256K
      default:
        throw Error('Key type not yet supported')
    }
  }

  private async createOp(
    identifier: IIdentifier,
    verificationMethodSection: DIDDocumentSection | undefined,
    didMethod: string,
    providedDidResolvers: PerDidResolver[],
    supportedDidMethods: string[],
    expiresIn: number,
    context: IRequiredContext
  ): Promise<OP> {
    if (!identifier.controllerKeyId) {
      return Promise.reject(new Error(`No controller key found for identifier: ${identifier.did}`))
    }

    const keyRef = await this.getKey(identifier, verificationMethodSection, context)

    const builder = OP.builder()
      .withExpiresIn(expiresIn)

      .addDidMethod(didMethod)
      .suppliedSignature(SuppliedSigner(keyRef, context, this.getKeyAlgorithm(keyRef.type)), identifier.did, identifier.controllerKeyId, this.getKeyAlgorithm(keyRef.type))
      .registration({
        registrationBy: {
          passBy: PassBy.VALUE
        }
      })
      .response(ResponseMode.POST)
    if (supportedDidMethods && supportedDidMethods.length > 0) {
      supportedDidMethods.forEach((method) => builder.addDidMethod(method))
    }
    if (providedDidResolvers && providedDidResolvers.length > 0) {
      providedDidResolvers.forEach((providedResolver) => builder.addResolver(providedResolver.didMethod, providedResolver.resolver))
    }

    return builder.build()
  }
}
