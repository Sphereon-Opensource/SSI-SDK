import { DIDDocumentSection, IIdentifier } from '@veramo/core'
import { _ExtendedIKey, mapIdentifierKeysToDoc } from '@veramo/utils'
import { OP, PresentationExchange } from '@sphereon/did-auth-siop/dist/main'
import { SubmissionRequirementMatch, VerifiableCredential } from '@sphereon/pe-js'
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
  IMatchedPresentationDefinition, IParsedDID, IRequiredContext,
} from '../types/IDidAuthSiopOpAuthenticator'
// import {UniqueVerifiableCredential} from '@veramo/data-store/src/data-store-orm';

const fetch = require('cross-fetch')

export class OperatingPartySession {
  private readonly identifier: IIdentifier
  private readonly didMethod: string // TODO just move to functions?
  private readonly section: DIDDocumentSection
  private readonly expiresIn: number | undefined
  private readonly context: IRequiredContext
  private op: OP | undefined

  constructor(options: IOperatingPartySessionArgs) {
    this.identifier = options.identifier
    this.didMethod = this.parseDid(this.identifier.did).method
    this.expiresIn = options.expiresIn
    this.section = options.section || 'authentication'
    this.context = options.context
  }

  public async init() {
    this.op = await this.createOp(this.identifier, this.section, this.expiresIn || 6000, this.context)
  }

  public async authenticateWithDidSiop(
      args: IOpsAuthenticateWithDidSiopArgs
  ): Promise<Response> {
    return this.getDidSiopAuthenticationRequestFromRP({ stateId: args.stateId, redirectUrl: args.redirectUrl })
      .then((authenticationRequest: ParsedAuthenticationRequestURI) =>
          this.verifyDidSiopAuthenticationRequestURI({ requestURI: authenticationRequest, didMethod: this.didMethod }) //TODO method from class? args.didMethod
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
    const presentationDefs = args.verifiedAuthenticationRequest.presentationDefinitions
    const verifiablePresentations =
        // TODO args.verifiableCredentials should be the idatastoreorm getcredentials
        presentationDefs && presentationDefs.length > 0 ? await this.matchPresentationDefinitions(presentationDefs, args.verifiableCredentials) : []
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

    return this.op!.verifyAuthenticationRequest(args.requestURI.jwt, options).catch((error: string | undefined) => Promise.reject(new Error(error)))
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

  // private async getPresentationExchange(
  //     // verifiableCredentials: VerifiableCredential[]
  // ): Promise<PresentationExchange> { //, this.context
  //   return this.context.agent.dataStoreORMGetVerifiableCredentials({}).then(uniqueVerifiableCredentials => {
  //     const verifiableCredentials = uniqueVerifiableCredentials.map(uniqueVerifiableCredential => uniqueVerifiableCredential.verifiableCredential)
  //
  //     return new PresentationExchange({
  //       did: this.op!.authResponseOpts.did,
  //       allVerifiableCredentials: verifiableCredentials,
  //     })
  //   })
  //
  //   // return new PresentationExchange({
  //   //   did: this.op!.authResponseOpts.did,
  //   //   allVerifiableCredentials: verifiableCredentials,
  //   // })
  // }

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
      identifier: IIdentifier, // TODO on class
      section: DIDDocumentSection,
      expiresIn: number,
      context: IRequiredContext
  ): Promise<OP> {
    if (!identifier.controllerKeyId) {
      return Promise.reject(new Error(`No controller key found for identifier: ${identifier.did}`))
    }

    return OP.builder()
      .withExpiresIn(expiresIn)
      .addDidMethod(this.didMethod)
      .internalSignature(await this.getPrivateKeyHex(identifier, section, context), identifier.did, identifier.controllerKeyId)
      .registrationBy(PassBy.VALUE)
      .response(ResponseMode.POST)
      .build()
  }

  private parseDid(
      did: string
  ): IParsedDID {
    const parsedDid = this.parse(did);
    if (parsedDid === null) {
      throw new Error('invalid did')
    }

    return parsedDid
  }

  private parse(didUrl: string): IParsedDID | null {
    const PCT_ENCODED = '(?:%[0-9a-fA-F]{2})'
    const ID_CHAR = `(?:[a-zA-Z0-9._-]|${PCT_ENCODED})`
    const METHOD = '([a-z0-9]+)'
    const METHOD_ID = `((?:${ID_CHAR}*:)*(${ID_CHAR}+))`
    const PARAM_CHAR = '[a-zA-Z0-9_.:%-]'
    const PARAM = `;${PARAM_CHAR}+=${PARAM_CHAR}*`
    const PARAMS = `((${PARAM})*)`
    const PATH = `(/[^#?]*)?`
    const QUERY = `([?][^#]*)?`
    const FRAGMENT = `(#.*)?`
    const DID_MATCHER = new RegExp(`^did:${METHOD}:${METHOD_ID}${PARAMS}${PATH}${QUERY}${FRAGMENT}$`)

    if (didUrl === '' || !didUrl) return null
    const sections = didUrl.match(DID_MATCHER)
    if (sections) {
      const parts: IParsedDID = {
        did: `did:${sections[1]}:${sections[2]}`,
        method: sections[1],
        id: sections[2],
        didUrl,
      }
      if (sections[4]) {
        const params = sections[4].slice(1).split(';')
        parts.params = {}
        for (const p of params) {
          const kv = p.split('=')
          parts.params[kv[0]] = kv[1]
        }
      }
      if (sections[6]) parts.path = sections[6]
      if (sections[7]) parts.query = sections[7].slice(1)
      if (sections[8]) parts.fragment = sections[8].slice(1)
      return parts
    }

    return null
  }

}
