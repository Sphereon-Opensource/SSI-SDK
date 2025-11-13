import {
  AuthorizationResponsePayload,
  JwksMetadataParams,
  OP,
  RequestObjectPayload,
  ResponseIss,
  SupportedVersion,
  URI,
  Verification,
  VerifiedAuthorizationRequest,
} from '@sphereon/did-auth-siop'
import { ResolveOpts } from '@sphereon/did-auth-siop-adapter'
import { JwtIssuer } from '@sphereon/oid4vc-common'
import { getAgentDIDMethods, getAgentResolver } from '@sphereon/ssi-sdk-ext.did-utils'
import { JweAlg, JweEnc } from '@sphereon/ssi-sdk-ext.jwt-service'
import { encodeBase64url } from '@sphereon/ssi-sdk.core'
import { Loggers, parseDid } from '@sphereon/ssi-types'
import { IIdentifier, TKeyType } from '@veramo/core'
import { v4 } from 'uuid'
import { IOPOptions, IOpSessionArgs, IOpsSendSiopAuthorizationResponseArgs, IRequiredContext } from '../types'
import { createOP } from './functions'

const logger = Loggers.DEFAULT.get('sphereon:oid4vp:OpSession')

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

  public async getSupportedDIDMethods(didPrefix?: boolean): Promise<string[]> {
    const agentMethods = this.getAgentDIDMethodsSupported({ didPrefix })
    let rpMethods = await this.getRPDIDMethodsSupported({ didPrefix, agentMethods })
    logger.debug(`RP supports subject syntax types: ${JSON.stringify(this.getSubjectSyntaxTypesSupported())}`)
    if (rpMethods.dids.length === 0) {
      logger.debug(`RP does not support DIDs. Supported: ${JSON.stringify(this.getSubjectSyntaxTypesSupported())}`)
      return []
    }

    let intersection: string[]
    if (rpMethods.dids.includes('did')) {
      intersection =
        agentMethods && agentMethods.length > 0
          ? agentMethods
          : (await getAgentDIDMethods(this.context)).map((method) => convertDidMethod(method, didPrefix)) // fallback to the agent in case the agent methods are undefined
    } else if (!agentMethods || agentMethods.length === 0) {
      intersection = rpMethods.dids?.map((method) => convertDidMethod(method, didPrefix))
    } else {
      intersection = agentMethods.filter((value) => rpMethods.dids.includes(value))
    }
    if (intersection.length === 0) {
      throw Error('No matching DID methods between agent and relying party')
    }
    return intersection.map((value) => convertDidMethod(value, didPrefix))
  }

  private getAgentDIDMethodsSupported(opts: { didPrefix?: boolean }) {
    const agentMethods = this.options.supportedDIDMethods?.map((method) => convertDidMethod(method, opts.didPrefix))
    logger.debug(`agent methods: ${JSON.stringify(agentMethods)}`)
    return agentMethods
  }

  private async getSubjectSyntaxTypesSupported(): Promise<string[]> {
    const authReq = await this.getAuthorizationRequest()
    const subjectSyntaxTypesSupported = authReq.registrationMetadataPayload?.subject_syntax_types_supported
    return subjectSyntaxTypesSupported ?? []
  }

  private async getRPDIDMethodsSupported(opts: { didPrefix?: boolean; agentMethods?: string[] }) {
    let keyType: TKeyType | undefined
    const agentMethods =
      (opts.agentMethods ?? this.getAgentDIDMethodsSupported(opts))?.map((method) => convertDidMethod(method, opts.didPrefix)) ?? []
    logger.debug(`agent methods supported: ${JSON.stringify(agentMethods)}`)
    const authReq = await this.getAuthorizationRequest()
    const subjectSyntaxTypesSupported = authReq.registrationMetadataPayload?.subject_syntax_types_supported
      ?.map((method) => convertDidMethod(method, opts.didPrefix))
      .filter((val) => !val.startsWith('did'))
    logger.debug(`subject syntax types supported in rp method supported: ${JSON.stringify(subjectSyntaxTypesSupported)}`)
    const aud = await authReq.authorizationRequest.getMergedProperty<string>('aud')
    let rpMethods: string[] = []
    if (aud && aud.startsWith('did:')) {
      const didMethod = convertDidMethod(parseDid(aud).method, opts.didPrefix)
      logger.debug(`aud did method: ${didMethod}`)

      // The RP knows our DID, so we can use it to determine the supported DID methods
      // If the aud did:method is not in the supported types, there still is something wrong, unless the RP signals to support all did methods
      if (
        subjectSyntaxTypesSupported &&
        subjectSyntaxTypesSupported.length > 0 &&
        !subjectSyntaxTypesSupported.includes('did') &&
        !subjectSyntaxTypesSupported.includes(didMethod)
      ) {
        throw Error(`The aud DID method ${didMethod} is not in the supported types ${subjectSyntaxTypesSupported}`)
      }
      rpMethods = [didMethod]
    } else if (subjectSyntaxTypesSupported) {
      rpMethods = (Array.isArray(subjectSyntaxTypesSupported) ? subjectSyntaxTypesSupported : [subjectSyntaxTypesSupported]).map((method) =>
        convertDidMethod(method, opts.didPrefix),
      )
    }
    const isEBSI =
      rpMethods.length === 0 &&
      (authReq.issuer?.includes('.ebsi.eu') || authReq.authorizationRequest.getMergedProperty<string>('client_id')?.includes('.ebsi.eu'))
    let codecName: string | undefined = undefined
    if (isEBSI && (!aud || !aud.startsWith('http'))) {
      logger.debug(`EBSI detected, adding did:key to supported DID methods for RP`)
      const didKeyMethod = convertDidMethod('did:key', opts.didPrefix)
      if (!agentMethods?.includes(didKeyMethod)) {
        throw Error(`EBSI detected, but agent did not support did:key. Please reconfigure agent`)
      }
      rpMethods = [didKeyMethod]
      keyType = 'Secp256r1'
      codecName = 'jwk_jcs-pub'
    }
    return { dids: rpMethods, codecName, keyType }
  }

  public async getSupportedIdentifiers(opts?: { createInCaseNoDIDFound?: boolean }): Promise<IIdentifier[]> {
    // todo: we also need to check signature algo
    const methods = await this.getSupportedDIDMethods(true)
    logger.debug(`supported DID methods (did: prefix = true): ${JSON.stringify(methods)}`)
    if (methods.length === 0) {
      throw Error(`No DID methods are supported`)
    }
    const identifiers: IIdentifier[] = await this.context.agent
      .didManagerFind()
      .then((ids: IIdentifier[]) => ids.filter((id) => methods.includes(id.provider)))
    if (identifiers.length === 0) {
      logger.debug(`No identifiers available in agent supporting methods ${JSON.stringify(methods)}`)
      if (opts?.createInCaseNoDIDFound !== false) {
        const { codecName, keyType } = await this.getRPDIDMethodsSupported({
          didPrefix: true,
          agentMethods: methods,
        })
        const identifier = await this.context.agent.didManagerCreate({
          provider: methods[0],
          options: { codecName, keyType, type: keyType }, // both keyType and type, because not every did provider has the same param
        })
        logger.debug(`Created a new identifier for the SIOP interaction: ${identifier.did}`)
        identifiers.push(identifier)
      }
    }
    logger.debug(`supported identifiers: ${JSON.stringify(identifiers.map((id) => id.did))}`)
    return identifiers
  }

  public async getSupportedDIDs(): Promise<string[]> {
    return (await this.getSupportedIdentifiers()).map((id) => id.did)
  }

  public async getRedirectUri(): Promise<string> {
    return Promise.resolve(this.verifiedAuthorizationRequest!.responseURI!)
  }

  private async createJarmResponseCallback({
    responseOpts,
  }: {
    responseOpts: {
      jwtIssuer?: JwtIssuer
      version?: SupportedVersion
      correlationId?: string
      audience?: string
      issuer?: ResponseIss | string
      verification?: Verification
    }
  }) {
    const agent = this.context.agent
    return async function jarmResponse(opts: {
      authorizationResponsePayload: AuthorizationResponsePayload
      requestObjectPayload: RequestObjectPayload
      clientMetadata: JwksMetadataParams
    }): Promise<{ response: string }> {
      const { clientMetadata, requestObjectPayload, authorizationResponsePayload: authResponse } = opts
      const jwk = await OP.extractEncJwksFromClientMetadata(clientMetadata)
      // @ts-ignore // FIXME: Fix jwk inference
      const recipientKey = await agent.identifierExternalResolveByJwk({ identifier: jwk })

      return await agent
        .jwtEncryptJweCompactJwt({
          recipientKey,
          protectedHeader: {},
          alg: (requestObjectPayload.client_metadata.authorization_encrypted_response_alg as JweAlg | undefined) ?? 'ECDH-ES',
          enc: (requestObjectPayload.client_metadata.authorization_encrypted_response_enc as JweEnc | undefined) ?? 'A256GCM',
          apv: encodeBase64url(opts.requestObjectPayload.nonce),
          apu: encodeBase64url(v4()),
          payload: authResponse,
          issuer: responseOpts.issuer,
          audience: responseOpts.audience,
        })
        .then((result) => {
          return { response: result.jwt }
        })
    }
  }

  public async sendAuthorizationResponse(args: IOpsSendSiopAuthorizationResponseArgs): Promise<Response> {
    const { responseSignerOpts, dcqlResponse, isFirstParty } = args

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

    const request = await this.getAuthorizationRequest()

    const op = await createOP({
      opOptions: {
        ...this.options,
        resolveOpts: { ...this.options.resolveOpts },
        eventEmitter: this.options.eventEmitter,
        presentationSignCallback: this.options.presentationSignCallback,
        wellknownDIDVerifyCallback: this.options.wellknownDIDVerifyCallback,
        supportedVersions: request.versions,
      },
      idOpts: responseSignerOpts,
      context: this.context,
    })

    //TODO change this to use the new functionalities by identifier-resolver and get the jwkIssuer for the responseOpts
    let issuer = responseSignerOpts.issuer
    const responseOpts = {
      issuer,
      ...(isFirstParty && { isFirstParty }),
      dcqlResponse: dcqlResponse,
    }

    const authResponse = await op.createAuthorizationResponse(request, responseOpts)
    const response = await op.submitAuthorizationResponse(authResponse, await this.createJarmResponseCallback({ responseOpts }))

    if (response.status >= 400) {
      throw Error(`Error ${response.status}: ${response.statusText || (await response.text())}`)
    } else {
      return response
    }
  }
}

function convertDidMethod(didMethod: string, didPrefix?: boolean): string {
  if (didPrefix === false) {
    return didMethod.startsWith('did:') ? didMethod.toLowerCase().replace('did:', '') : didMethod.toLowerCase()
  }
  return didMethod.startsWith('did:') ? didMethod.toLowerCase() : `did:${didMethod.toLowerCase().replace('did:', '')}`
}
