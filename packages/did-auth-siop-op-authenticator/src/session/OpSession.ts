import { DIDDocumentSection, IIdentifier, IKey, TKeyType } from '@veramo/core'
import { _ExtendedIKey, mapIdentifierKeysToDoc } from '@veramo/utils'
import { OP, PresentationExchange, SIOP } from '@sphereon/did-auth-siop'
import { SubmissionRequirementMatch, IVerifiableCredential } from '@sphereon/pex'
import { parseDid } from '@sphereon/ssi-types'
import { SuppliedSigner } from '@sphereon/ssi-sdk-core'
import {
  IOpSessionArgs,
  IOpsAuthenticateWithSiopArgs,
  IOpsGetSiopAuthenticationRequestDetailsArgs,
  IOpsGetSiopAuthenticationRequestFromRpArgs,
  IOpsSendSiopAuthenticationResponseArgs,
  IOpsVerifySiopAuthenticationRequestUriArgs,
  IAuthRequestDetails,
  IMatchedPresentationDefinition,
  IRequiredContext,
  PerDidResolver,
} from '../types/IDidAuthSiopOpAuthenticator'
import { Resolvable } from 'did-resolver'

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
    this.verificationMethodSection = options.verificationMethodSection /*|| 'authentication'*/
    this.context = options.context
  }

  public async init() {
    this.op = await this.createOp(
      this.identifier,
      this.verificationMethodSection,
      parseDid(this.identifier.did).method,
      this.resolver,
      this.providedDidResolvers,
      this.supportedDidMethods || [],
      this.expiresIn || 6000,
      this.context
    )
  }

  public async authenticateWithSiop(args: IOpsAuthenticateWithSiopArgs): Promise<Response> {
    return this.getSiopAuthenticationRequestFromRP({ stateId: args.stateId, redirectUrl: args.redirectUrl })
      .then((authenticationRequest: SIOP.ParsedAuthenticationRequestURI) =>
        this.verifySiopAuthenticationRequestURI({ requestURI: authenticationRequest })
      )
      .then((verifiedAuthenticationRequest: SIOP.VerifiedAuthenticationRequestWithJWT) => {
        if (args.customApproval !== undefined) {
          if (typeof args.customApproval === 'string') {
            if (args.customApprovals !== undefined && args.customApprovals[args.customApproval] !== undefined) {
              return args.customApprovals[args.customApproval](verifiedAuthenticationRequest, this.id).then(() =>
                this.sendSiopAuthenticationResponse({ verifiedAuthenticationRequest: verifiedAuthenticationRequest })
              )
            }
            return Promise.reject(new Error(`Custom approval not found for key: ${args.customApproval}`))
          } else {
            return args
              .customApproval(verifiedAuthenticationRequest, this.id)
              .then(() => this.sendSiopAuthenticationResponse({ verifiedAuthenticationRequest: verifiedAuthenticationRequest }))
          }
        } else {
          return this.sendSiopAuthenticationResponse({ verifiedAuthenticationRequest: verifiedAuthenticationRequest })
        }
      })
      .catch((error: unknown) => Promise.reject(error))
  }

  public async getSiopAuthenticationRequestFromRP(args: IOpsGetSiopAuthenticationRequestFromRpArgs): Promise<SIOP.ParsedAuthenticationRequestURI> {
    const url = args.stateId ? `${args.redirectUrl}?stateId=${args.stateId}` : args.redirectUrl
    return fetch(url)
      .then(async (response: Response) =>
        response.status >= 400 ? Promise.reject(new Error(await response.text())) : this.op!.parseAuthenticationRequestURI(await response.text())
      )
      .catch((error: unknown) => Promise.reject(error))
  }

  public async getSiopAuthenticationRequestDetails(args: IOpsGetSiopAuthenticationRequestDetailsArgs): Promise<IAuthRequestDetails> {
    // TODO fix vc retrievement https://sphereon.atlassian.net/browse/MYC-142
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

  public async verifySiopAuthenticationRequestURI(
    args: IOpsVerifySiopAuthenticationRequestUriArgs
  ): Promise<SIOP.VerifiedAuthenticationRequestWithJWT> {
    // TODO fix supported dids structure https://sphereon.atlassian.net/browse/MYC-141
    const didMethodsSupported = args.requestURI.registration?.did_methods_supported as string[]
    let didMethods: string[] = []
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
    const options: SIOP.VerifyAuthenticationRequestOpts = {
      verification: {
        mode: SIOP.VerificationMode.INTERNAL,
        resolveOpts,
      },
      nonce: args.requestURI.requestPayload.nonce,
    }

    return this.op!.verifyAuthenticationRequest(args.requestURI.jwt, options).catch((error: string | undefined) => Promise.reject(new Error(error)))
  }

  public async sendSiopAuthenticationResponse(args: IOpsSendSiopAuthenticationResponseArgs): Promise<Response> {
    const verification = {
      mode: SIOP.VerificationMode.INTERNAL,
      resolveOpts: {
        didMethods: [...this.supportedDidMethods, parseDid(this.identifier.did).method],
      },
    }
    return this.op!.createAuthenticationResponse(args.verifiedAuthenticationRequest, { vp: args.verifiablePresentationResponse, verification })
      .then((authResponse) => this.op!.submitAuthenticationResponse(authResponse))
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
    presentationDefs: SIOP.PresentationDefinitionWithLocation[],
    verifiableCredentials: IVerifiableCredential[]
  ): Promise<IMatchedPresentationDefinition[]> {
    const presentationExchange = this.getPresentationExchange(verifiableCredentials)
    return await Promise.all(
      presentationDefs.map(async (presentationDef: SIOP.PresentationDefinitionWithLocation) => {
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
          format: SIOP.VerifiablePresentationTypeFormat.LDP_VP,
          presentation: verifiablePresentation,
        }
      })
    )
  }

  private getPresentationExchange(verifiableCredentials: IVerifiableCredential[]): PresentationExchange {
    return new PresentationExchange({
      did: this.op!.authResponseOpts.did,
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

  private getKeyAlgorithm(type: TKeyType): SIOP.KeyAlgo {
    switch (type) {
      case 'Ed25519':
        return SIOP.KeyAlgo.EDDSA
      case 'Secp256k1':
        return SIOP.KeyAlgo.ES256K
      default:
        throw Error('Key type not yet supported')
    }
  }

  private async createOp(
    identifier: IIdentifier,
    verificationMethodSection: DIDDocumentSection | undefined,
    didMethod: string,
    resolver: Resolvable | undefined,
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
      .suppliedSignature(SuppliedSigner(keyRef, context, this.getKeyAlgorithm(keyRef.type)), identifier.did, identifier.controllerKeyId)
      .registrationBy(SIOP.PassBy.VALUE)
      .response(SIOP.ResponseMode.POST)
    if (supportedDidMethods && supportedDidMethods.length > 0) {
      supportedDidMethods.forEach((method) => builder.addDidMethod(method))
    }
    if (resolver) {
      console.log(`Resolver supplied: ${JSON.stringify(resolver)}`)
      builder.defaultResolver(resolver)
    }
    if (providedDidResolvers && providedDidResolvers.length > 0) {
      providedDidResolvers.forEach((providedResolver) => builder.addResolver(providedResolver.didMethod, providedResolver.resolver))
    }

    return builder.build()
  }
}
