import { IAgentPlugin } from '@veramo/core'
import { EBSIAuthAccessTokenGetArgs, EBSIOIDMetadata, EBSIScope, IRequiredContext, schema } from '../index'
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
import fetch from 'cross-fetch'
import { PresentationDefinitionLocation } from '@sphereon/did-auth-siop'
import { IPresentationDefinition } from '@sphereon/pex'
import { CompactJWT, IProofType } from '@sphereon/ssi-types'

//const encodeBase64url = (input: string): string => u8a.toString(u8a.fromString(input), 'base64url')

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

  async siop(args: { scope: EBSIScope; did: string }, context: IRequiredContext) {
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
    const { vc, domain = this.baseUrl, did, kid, scope } = args

    const metadataResponse = await this.ebsiAuthASDiscoveryMetadataGet()
    if ('status' in metadataResponse) {
      throw Error(JSON.stringify(metadataResponse))
    }

    const authRequest = await this.ebsiAuthInitiateSIOPDidAuthRequest({ scope: EBSIScope.did_authn })

    // TODO add proper error handling
    if (typeof authRequest !== 'string') {
      throw new Error(`Failed to receive the SIOP DID auth request${authRequest}`)
    }

    const opSession = await context.agent.siopRegisterOPSession({
      sessionId: 'ebsi-authorization-client-session',
      requestJwtOrUri: authRequest,
    })

    const pd = await this.ebsiAuthPresentationDefinitionGet({ scope: EBSIScope.didr_invite })

    // TODO add proper error handling
    if ('status' in pd) {
      throw new Error(`Failed to receive the presentation definition`)
    }

    const vpJwt = await (
      await opSession.getOID4VP()
    ).createVerifiablePresentation(
      {
        credentials: [vc],
        definition: { location: PresentationDefinitionLocation.CLAIMS_VP_TOKEN, definition: pd as IPresentationDefinition },
      },
      {
        restrictToDIDMethods: ['did:ebsi', 'did:key'],
        restrictToFormats: { jwt: { alg: ['ES256', 'ES256K'] } },
        holderDID: did,
        identifierOpts: { identifier: did, kid: `${did}#${kid}` },
        proofOpts: {
          type: IProofType.JwtProof2020,
          domain,
        },
        subjectIsHolder: true,
      },
    )

    const tokenResponse = await this.getAccessToken({
      grant_type: 'vp_token',
      vp_token: vpJwt.verifiablePresentation as CompactJWT,
      presentation_submission: vpJwt.presentationSubmission,
      scope,
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
        body: JSON.stringify({ scope: `openid ${args.scope}` }),
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
}
