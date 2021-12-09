import { DIDDocumentSection, IIdentifier } from '@veramo/core'
import { _ExtendedIKey, mapIdentifierKeysToDoc } from '@veramo/utils'
import { OP, PresentationExchange } from '@sphereon/did-auth-siop/dist/main'
import { SubmissionRequirementMatch, VerifiableCredential } from '@sphereon/pe-js'
import { parseDid } from '../utils';
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
import {
  IOperatingPartySessionArgs,
  IOpsAuthenticateWithDidSiopArgs,
  IOpsGetDidSiopAuthenticationRequestDetailsArgs,
  IOpsGetDidSiopAuthenticationRequestFromRpArgs,
  IOpsSendDidSiopAuthenticationResponseArgs,
  IOpsVerifyDidSiopAuthenticationRequestUriArgs,
  IAuthRequestDetails,
  IMatchedPresentationDefinition,
  IRequiredContext,
} from '../types/IDidAuthSiopOpAuthenticator'

const fetch = require('cross-fetch')

export class OperatingPartySession {
  public readonly id: string
  public readonly identifier: IIdentifier
  public readonly didMethod: string
  public readonly section: DIDDocumentSection
  public readonly expiresIn: number | undefined
  public readonly context: IRequiredContext
  public op: OP | undefined

  constructor(options: IOperatingPartySessionArgs) {
    this.id = options.sessionId
    this.identifier = options.identifier
    this.didMethod = parseDid(this.identifier.did).method
    this.expiresIn = options.expiresIn
    this.section = options.section || 'authentication'
    this.context = options.context
  }

  public async init() {
    this.op = await this.createOp(
        this.identifier,
        this.section,
        this.didMethod,
        this.expiresIn || 6000,
        this.context
    )
  }

  public async authenticateWithDidSiop(
      args: IOpsAuthenticateWithDidSiopArgs
  ): Promise<Response> {
    return this.getDidSiopAuthenticationRequestFromRP({ stateId: args.stateId, redirectUrl: args.redirectUrl })
      .then((authenticationRequest: ParsedAuthenticationRequestURI) =>
          this.verifyDidSiopAuthenticationRequestURI({ requestURI: authenticationRequest, didMethod: this.didMethod })
      )
      .then((verifiedAuthenticationRequest: VerifiedAuthenticationRequestWithJWT) => {
        if (args.customApproval !== undefined) {
          if (typeof args.customApproval === 'string') {
            if (args.customApprovals !== undefined && args.customApprovals[args.customApproval] !== undefined) {
              return args.customApprovals[args.customApproval](verifiedAuthenticationRequest).then(() =>
                  this.sendDidSiopAuthenticationResponse({ verifiedAuthenticationRequest: verifiedAuthenticationRequest })
              )
            }
            return Promise.reject(new Error(`Custom approval not found for key: ${args.customApproval}`))
          } else {
            return args.customApproval(verifiedAuthenticationRequest)
              .then(() => this.sendDidSiopAuthenticationResponse({ verifiedAuthenticationRequest: verifiedAuthenticationRequest }))
          }
        } else {
          return this.sendDidSiopAuthenticationResponse({ verifiedAuthenticationRequest: verifiedAuthenticationRequest })
        }
      })
      .catch((error: unknown) => Promise.reject(error))
  }

  public async getDidSiopAuthenticationRequestFromRP(
      args: IOpsGetDidSiopAuthenticationRequestFromRpArgs,
  ): Promise<ParsedAuthenticationRequestURI> {
    return fetch(`${args.redirectUrl}?stateId=${args.stateId}`)
    .then(async (response: Response) =>
        response.status >= 400 ? Promise.reject(new Error(await response.text())) : this.op!.parseAuthenticationRequestURI(await response.text())
    )
    .catch((error: unknown) => Promise.reject(error))
  }

  public async getDidSiopAuthenticationRequestDetails(
      args: IOpsGetDidSiopAuthenticationRequestDetailsArgs,
  ): Promise<IAuthRequestDetails> {
    // TODO fix vc retrievement https://sphereon.atlassian.net/browse/MYC-142
    const presentationDefs = args.verifiedAuthenticationRequest.presentationDefinitions
    const verifiablePresentations = presentationDefs && presentationDefs.length > 0 ? await this.matchPresentationDefinitions(presentationDefs, args.verifiableCredentials) : []
    const didResolutionResult = args.verifiedAuthenticationRequest.didResolutionResult

    return {
      id: didResolutionResult.didDocument!.id,
      alsoKnownAs: didResolutionResult.didDocument!.alsoKnownAs,
      vpResponseOpts: verifiablePresentations,
    }
  }

  public async verifyDidSiopAuthenticationRequestURI(
      args: IOpsVerifyDidSiopAuthenticationRequestUriArgs,
  ): Promise<VerifiedAuthenticationRequestWithJWT> {
    // TODO fix supported dids structure https://sphereon.atlassian.net/browse/MYC-141
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

    return this.op!.verifyAuthenticationRequest(args.requestURI.jwt, options)
      .catch((error: string | undefined) => Promise.reject(new Error(error)))
  }

  public async sendDidSiopAuthenticationResponse(
      args: IOpsSendDidSiopAuthenticationResponseArgs
  ): Promise<Response> {
    return this.op!
      .createAuthenticationResponse(args.verifiedAuthenticationRequest, { vp: args.verifiablePresentationResponse })
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

  private getPresentationExchange(
      verifiableCredentials: VerifiableCredential[]
  ): PresentationExchange {
    return new PresentationExchange({
      did: this.op!.authResponseOpts.did,
      allVerifiableCredentials: verifiableCredentials,
    })
  }

  private async getPrivateKeyHex(
      identifier: IIdentifier,
      section: DIDDocumentSection = 'authentication',
      context: IRequiredContext,
      keyId?: string
  ): Promise<string> {
    const keys = await mapIdentifierKeysToDoc(identifier, section, context)
    if (!keys || keys.length === 0) {
      throw new Error(`No keys found for section: ${section}`)
    }

    const identifierKey = keyId ? keys.find((key: _ExtendedIKey) => key.kid === keyId || key.meta.verificationMethod.id === keyId) : keys[0]
    if (!identifierKey) {
      throw new Error(`No matching section key found for keyId: ${keyId}`)
    }

    if (!identifierKey.privateKeyHex) {
      throw new Error(`No private key hex found for kid: ${identifierKey.kid}`)
    }

    return Promise.resolve(identifierKey.privateKeyHex)
  }

  private async createOp(
      identifier: IIdentifier,
      section: DIDDocumentSection,
      didMethod: string,
      expiresIn: number,
      context: IRequiredContext
  ): Promise<OP> {
    if (!identifier.controllerKeyId) {
      return Promise.reject(new Error(`No controller key found for identifier: ${identifier.did}`))
    }

    return OP.builder()
      .withExpiresIn(expiresIn)
      .addDidMethod(didMethod)
      .internalSignature(await this.getPrivateKeyHex(identifier, section, context), identifier.did, identifier.controllerKeyId)
      .registrationBy(PassBy.VALUE)
      .response(ResponseMode.POST)
      .build()
  }
}
