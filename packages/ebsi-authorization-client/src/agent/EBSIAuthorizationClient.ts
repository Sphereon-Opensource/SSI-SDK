import { CredentialPayload, IAgentPlugin } from '@veramo/core'
import { EBSIAuthAccessTokenGetArgs, EBSIOIDMetadata, EBSIScope, IRequiredContext, schema, ScopeByDefinition } from '../index'
import {
  CreateOAuth2SessionArgs,
  CreateOAuth2SessionResponse,
  CreateSIOPSessionArgs,
  CreateSIOPSessionResponse,
  ExceptionResponse,
  GetAccessTokenArgs,
  GetAccessTokenResponse,
  GetOIDProviderJwksResponse,
  GetOIDProviderMetadataResponse,
  GetPresentationDefinitionArgs,
  GetPresentationDefinitionResponse,
  IEBSIAuthorizationClient,
  InitiateSIOPDidAuthRequestArgs,
  InitiateSIOPDidAuthRequestResponse,
} from '../types/IEBSIAuthorizationClient'
import { uuid } from 'uuidv4'
import fetch from 'cross-fetch'
import * as u8a from 'uint8arrays'

export class EBSIAuthorizationClient implements IAgentPlugin {
  readonly schema = schema.IEBSIAuthorizationClient
  readonly methods: IEBSIAuthorizationClient = {
    ebsiAuthASDiscoveryMetadataGet: this.ebsiAuthASDiscoveryMetadataGet.bind(this),
    ebsiAuthASJwksGet: this.ebsiAuthASJwksGet.bind(this),
    ebsiAuthPresentationDefinitionGet: this.ebsiAuthPresentationDefinitionGet.bind(this),
    ebsiAuthAccessTokenGet: this.ebsiAuthAccessTokenGet.bind(this),
    ebsiAuthInitiateSIOPDidAuthRequest: this.ebsiAuthInitiateSIOPDidAuthRequest.bind(this),
    ebsiAuthCreateSIOPSession: this.ebsiAuthCreateSIOPSession.bind(this),
    ebsiAuthCreateOAuth2Session: this.ebsiAuthCreateOAuth2Session.bind(this),
  }

  private discoveryMetadata?: EBSIOIDMetadata

  constructor(private readonly baseUrl: string = 'https://api-pilot.ebsi.eu/authorisation/v4') {}

  async siop(args: { scope: EBSIScope; did: string }, context: IRequiredContext): Promise<Response> {
    const { scope, did } = args

    const authRequest = await this.ebsiAuthInitiateSIOPDidAuthRequest({ scope })

    // TODO add proper error handling
    if (typeof authRequest !== 'string') {
      throw new Error(`Failed to receive the SIOP DID auth request${authRequest}`)
    }

    const opSession = await context.agent.siopRegisterOPSession({
      sessionId: 'ebsi-authorization-client-session',
      requestJwtOrUri: authRequest,
    })

    const identifier = await context.agent.didManagerGet({ did })
    return await opSession.sendAuthorizationResponse({
      responseSignerOpts: { identifier: identifier },
    })

    /**
     * export interface CreateResponseOptions {
     *
     *   responseMode?: ResponseMode;
     *
     *   syntaxType?: "jwk_thumbprint_subject" | "did_subject";
     *
     * }
     *
     * export type ResponseMode = "fragment" | "form_post" | "post" | "query";
     *
     * export interface RequestPayload {
     *       redirectUri?: string;
     *       responseMode?: ResponseMode;
     *       responseContext?: string;
     *       claims?: RequestClaims;
     *       [x: string]: unknown;
     *     }
     */
  }

  private getDescriptorMap(definitionId: ScopeByDefinition) {
    switch (definitionId) {
      case ScopeByDefinition.didr_invite_presentation:
        return [
          {
            id: `didr_invite_credential`,
            format: 'jwt_vp',
            path: '$',
            path_nested: {
              id: `didr_invite_credential`,
              format: 'jwt_vc',
              path: '$.vp.verifiableCredential[0]',
            },
          },
        ]
      case ScopeByDefinition.tir_invite_presentation:
        return [
          {
            id: `tir_invite_credential`,
            format: 'jwt_vp',
            path: '$',
            path_nested: {
              id: `tir_invite_credential`,
              format: 'jwt_vc',
              path: '$.vp.verifiableCredential[0]',
            },
          },
        ]
      case ScopeByDefinition.tnt_authorise_presentation:
        return [
          {
            id: `tnt_authorise_credential`,
            format: 'jwt_vp',
            path: '$',
            path_nested: {
              id: `tnt_authorise_credential`,
              format: 'jwt_vc',
              path: '$.vp.verifiableCredential[0]',
            },
          },
        ]
      default:
        throw new Error(`${definitionId} is not supported`)
    }
  }

  private async ebsiAuthASDiscoveryMetadataGet(): Promise<GetOIDProviderMetadataResponse> {
    return await (
      await fetch(`https://api-pilot.ebsi.eu/authorisation/v4/.well-known/openid-configuration`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      })
    ).json()
  }

  private async ebsiAuthASJwksGet(): Promise<GetOIDProviderJwksResponse | ExceptionResponse> {
    if (!this.discoveryMetadata) {
      this.discoveryMetadata = await this.ebsiAuthASDiscoveryMetadataGet()
    }
    return await (
      await fetch(`${this.discoveryMetadata.jwks_uri}`, {
        method: 'GET',
        headers: {
          Accept: 'application/jwk-set+json',
        },
      })
    ).json()
  }

  private async ebsiAuthPresentationDefinitionGet(args: GetPresentationDefinitionArgs): Promise<GetPresentationDefinitionResponse> {
    const { scope } = args
    if (!this.discoveryMetadata) {
      this.discoveryMetadata = await this.ebsiAuthASDiscoveryMetadataGet()
    }
    const ebsiScope = Object.keys(EBSIScope)[Object.values(EBSIScope).indexOf(scope)]
    return await (
      await fetch(`${this.discoveryMetadata.presentation_definition_endpoint}?scope=openid%20${ebsiScope}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      })
    ).json()
  }

  private async ebsiAuthAccessTokenGet(args: EBSIAuthAccessTokenGetArgs, context: IRequiredContext): Promise<GetAccessTokenResponse> {
    const { credential, definitionId, did, kid, alg } = args

    const metadataResponse = await this.ebsiAuthASDiscoveryMetadataGet()
    if ('status' in metadataResponse) {
      throw Error(JSON.stringify(metadataResponse))
    }

    const vc = await this.createVcJwt(
      {
        payloadVc: credential,
        kid,
        alg,
      },
      context,
    )

    const vpJwt = await this.createVPJwt(
      {
        kid,
        did,
        vc,
        audience: did,
        domain: this.baseUrl,
      },
      context,
    )
    let descriptorMap = this.getDescriptorMap(definitionId)

    const id = Object.keys(ScopeByDefinition)[Object.values(ScopeByDefinition).indexOf(definitionId)]
    const presentationSubmission = {
      id: uuid(),
      definition_id: id,
      descriptor_map: descriptorMap,
    }

    const tokenResponse = await this.getAccessToken({
      grant_type: 'vp_token',
      vp_token: vpJwt,
      presentation_submission: presentationSubmission,
      scope: EBSIScope.didr_invite,
    })
    if ('status' in tokenResponse) {
      throw new Error(JSON.stringify(tokenResponse))
    }
    return tokenResponse
  }

  private async getAccessToken(args: GetAccessTokenArgs): Promise<GetAccessTokenResponse> {
    const { grant_type = 'vp_token', scope, vp_token, presentation_submission } = args
    if (!this.discoveryMetadata) {
      this.discoveryMetadata = await this.ebsiAuthASDiscoveryMetadataGet()
    }
    return await (
      await fetch(`${this.discoveryMetadata.token_endpoint}`, {
        method: 'POST',
        headers: {
          ContentType: 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: new URLSearchParams({
          grant_type,
          scope: `openid ${scope}`,
          vp_token,
          presentation_submission: JSON.stringify(presentation_submission),
        }),
      })
    ).json()
  }

  //OP
  private async ebsiAuthInitiateSIOPDidAuthRequest(args: InitiateSIOPDidAuthRequestArgs): Promise<InitiateSIOPDidAuthRequestResponse> {
    if (!this.discoveryMetadata) {
      this.discoveryMetadata = await this.ebsiAuthASDiscoveryMetadataGet()
    }
    return await (
      await fetch(`${this.discoveryMetadata.issuer}/authentication-requests`, {
        method: 'POST',
        headers: {
          ContentType: 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(args),
      })
    ).json()
  }

  private async ebsiAuthCreateSIOPSession(args: CreateSIOPSessionArgs): Promise<CreateSIOPSessionResponse> {
    const { id_token, vp_token } = args
    if (!this.discoveryMetadata) {
      this.discoveryMetadata = await this.ebsiAuthASDiscoveryMetadataGet()
    }
    const formData = new FormData()
    Object.entries(args).forEach((entry) => formData.append(entry[0], entry[1]))
    return await (
      await fetch(`${this.discoveryMetadata.issuer}/siop-sessions`, {
        method: 'POST',
        headers: {
          ContentType: 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: new URLSearchParams({
          id_token,
          ...(vp_token && { vp_token }),
        }),
      })
    ).json()
  }

  private async ebsiAuthCreateOAuth2Session(args: CreateOAuth2SessionArgs): Promise<CreateOAuth2SessionResponse> {
    if (!this.discoveryMetadata) {
      this.discoveryMetadata = await this.ebsiAuthASDiscoveryMetadataGet()
    }
    return await (
      await fetch(`${this.discoveryMetadata.issuer}/oauth2-session`, {
        method: 'POST',
        headers: {
          ContentType: 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(args),
      })
    ).json()
  }

  private async createVPJwt(
    args: {
      kid: string
      alg?: string
      did: string
      vc: string
      audience: string
      domain: string
      nbf?: number
      exp?: number
      nonce?: number
    },
    context: IRequiredContext,
  ): Promise<string> {
    const { kid, alg = 'ES256', did, vc, audience, nbf, exp, nonce } = args

    if (!kid) {
      throw new Error(`kid is required`)
    }

    if (!args.vc) {
      throw new Error('Verifiable Credential not defined')
    }

    let verifiableCredential: string[]

    if (Array.isArray(vc)) {
      verifiableCredential = vc
    } else {
      verifiableCredential = [vc]
    }

    const resolvedDid = await context.agent.didManagerGet({ did })
    if (!resolvedDid) {
      throw new Error(`${did} could not be resolved`)
    }

    const protectedHeader = {
      typ: 'JWT',
      kid: kid,
      alg,
    }

    const vpPayload = {
      id: `urn:did:${uuid()}`,
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiablePresentation'],
      holder: did,
      verifiableCredential,
    }

    const payload = {
      holder: did,
      jti: typeof vpPayload['id'] === 'string' ? vpPayload['id'] : '',
      sub: did,
      iss: did,
      ...(nbf && { nbf }),
      ...(exp && { exp }),
      iat: Math.floor(Date.now() / 1000),
      aud: audience,
      vp: vpPayload,
      nonce: nonce ?? uuid(),
      exp: Math.floor(Date.now() / 1000) + 900,
      nbf: Math.floor(Date.now() / 1000) - 100,
    }

    const encodedHeader = u8a.toString(u8a.fromString(JSON.stringify(protectedHeader), 'utf-8'), 'base64url')
    const encodedBody = u8a.toString(u8a.fromString(JSON.stringify(payload), 'utf-8'), 'base64url')

    const signature = await context.agent.keyManagerSignJWT({
      kid,
      data: `${encodedHeader}.${encodedBody}`,
    })
    const encodedSignature = u8a.toString(u8a.fromString(signature, 'utf-8'), 'base64url')
    return `${encodedHeader}.${encodedBody}.${encodedSignature}`
  }

  private async createVcJwt(
    args: { payloadVc: CredentialPayload; kid: string; alg?: string; payloadJwt?: {} },
    context: IRequiredContext,
  ): Promise<string> {
    const { payloadVc, payloadJwt, kid, alg = 'ES256' } = args

    const iat = Math.floor(Date.now() / 1000) - 10
    const exp = iat + 365 * 24 * 3600
    const issuanceDate = `${new Date(iat * 1000).toISOString().slice(0, -5)}Z`
    const expirationDate = `${new Date(exp * 1000).toISOString().slice(0, -5)}Z`
    const jti = payloadVc.id || `urn:uuid:${uuid()}`
    const sub = payloadVc.credentialSubject?.id

    const protectedHeader = {
      typ: 'JWT',
      kid,
      alg,
    }

    const payload = {
      issuer: payloadVc.issuer,
      iat,
      jti,
      nbf: iat,
      exp,
      sub,
      vc: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: jti,
        type: ['VerifiableCredential'],
        issuanceDate,
        issued: issuanceDate,
        validFrom: issuanceDate,
        expirationDate,
        ...payloadVc,
      },
      ...payloadJwt,
    }

    const encodedHeader = u8a.toString(u8a.fromString(JSON.stringify(protectedHeader), 'utf-8'), 'base64url')
    const encodedBody = u8a.toString(u8a.fromString(JSON.stringify(payload), 'utf-8'), 'base64url')

    const signature = await context.agent.keyManagerSignJWT({
      kid,
      data: `${encodedHeader}.${encodedBody}`,
    })
    const encodedSignature = u8a.toString(u8a.fromString(signature, 'utf-8'), 'base64url')
    return `${encodedHeader}.${encodedBody}.${encodedSignature}`
  }
}
