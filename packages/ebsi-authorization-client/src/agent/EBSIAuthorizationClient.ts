import { CredentialPayload, IAgentPlugin } from '@veramo/core'
import { EBSIScope, GetOIDProviderMetadataSuccessResponse, IRequiredContext, schema, ScopeByDefinition } from '../index'
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

export class EBSIAuthorizationClient implements IAgentPlugin {
  readonly schema = schema.IEBSIAuthorizationClient
  readonly methods: IEBSIAuthorizationClient = {
    getOIDProviderMetadata: this.getOIDProviderMetadata.bind(this),
    getOIDProviderJwks: this.getOIDProviderJwks.bind(this),
    getPresentationDefinition: this.getPresentationDefinition.bind(this),
    getAccessToken: this.getAccessToken.bind(this),
    initiateSIOPDidAuthRequest: this.initiateSIOPDidAuthRequest.bind(this),
    createSIOPSession: this.createSIOPSession.bind(this),
    createOAuth2Session: this.createOAuth2Session.bind(this),
  }
  private configuration: GetOIDProviderMetadataSuccessResponse

  //TODO Pass the configuration manually or call init
  constructor(readonly baseUrl: string = 'https://api-pilot.ebsi.eu/authorisation/v4/') {
    // TODO call configuration endpoint
  }

  async authorize(args: { credential: CredentialPayload; definitionId: ScopeByDefinition; kid: string; alg?: string }, context: IRequiredContext) {
    const { credential, definitionId, kid, alg } = args

    const metadataResponse = await this.getOIDProviderMetadata()
    if ('status' in metadataResponse) {
      throw Error(JSON.stringify(metadataResponse))
    }

    const vc = await createVcJwt(
      {
        payloadVc: credential,
        kid,
        alg,
      },
      context,
    )

    const vpJwt = await createVPJwt(
      {
        kid,
        did: this.configuration.issuer.toString(),
        vc,
        audience: this.configuration.issuer.toString(),
        domain: this.baseUrl,
      },
      context,
    )
    let descriptorMap = this.getDescriptorMap(definitionId)

    const presentationSubmission = {
      id: uuid(),
      definition_id: definitionId,
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

  private getDescriptorMap(definitionId: ScopeByDefinition) {
    switch (definitionId) {
      case ScopeByDefinition.didr_invite_presentation:
      case ScopeByDefinition.tir_invite_presentation:
      case ScopeByDefinition.tnt_authorise_presentation:
        const id = Object.keys(ScopeByDefinition)[Object.values(ScopeByDefinition).indexOf(definitionId)]
        return [
          {
            id: `${id}`,
            format: 'jwt_vp',
            path: '$',
            path_nested: {
              id: `${id}`,
              format: 'jwt_vc',
              path: '$.vp.verifiableCredential[0]',
            },
          },
        ]
      default:
        throw new Error(`${definitionId} is not supported`)
    }
  }

  private async getOIDProviderMetadata(): Promise<GetOIDProviderMetadataResponse> {
    return await (
      await fetch(`${this.baseUrl}/.well-known/openid-configuration`, {
        method: 'GET',
        headers: new Headers({
          Accept: 'application/json',
        }),
      })
    ).json()
  }

  private async getOIDProviderJwks(): Promise<GetOIDProviderJwksResponse | ExceptionResponse> {
    return await (
      await fetch(`${this.configuration.jwks_uri}`, {
        method: 'GET',
        headers: new Headers({
          Accept: 'application/jwk-set+json',
        }),
      })
    ).json()
  }

  private async getPresentationDefinition(args: GetPresentationDefinitionArgs): Promise<GetPresentationDefinitionResponse> {
    const { scope } = args
    const ebsiScope = Object.keys(EBSIScope)[Object.values(EBSIScope).indexOf(scope)]
    return await (
      await fetch(`${this.configuration.presentation_definition_endpoint}?scope=openid%20${ebsiScope}`, {
        method: 'GET',
        headers: new Headers({
          Accept: 'application/json',
        }),
      })
    ).json()
  }

  private async getAccessToken(args: GetAccessTokenArgs): Promise<GetAccessTokenResponse> {
    const { grant_type = 'vp_token', scope, vp_token, presentation_submission } = args
    return await (
      await fetch(`${this.configuration.token_endpoint}`, {
        method: 'POST',
        headers: new Headers({
          ContentType: 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        }),
        body: new URLSearchParams({
          grant_type,
          scope,
          vp_token,
          presentation_submission: JSON.stringify(presentation_submission),
        }),
      })
    ).json()
  }

  private async initiateSIOPDidAuthRequest(args: InitiateSIOPDidAuthRequestArgs): Promise<InitiateSIOPDidAuthRequestResponse> {
    return await (
      await fetch(`${this.configuration.issuer}/authentication-requests`, {
        method: 'POST',
        headers: new Headers({
          ContentType: 'application/json',
          Accept: 'application/json',
        }),
        body: JSON.stringify(args),
      })
    ).json()
  }

  private async createSIOPSession(args: CreateSIOPSessionArgs): Promise<CreateSIOPSessionResponse> {
    const formData = new FormData()
    Object.entries(args).forEach((entry) => formData.append(entry[0], entry[1]))
    return await (
      await fetch(`${this.configuration.issuer}/siop-sessions`, {
        method: 'POST',
        headers: new Headers({
          ContentType: 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        }),
        body: formData,
      })
    ).json()
  }

  private async createOAuth2Session(args: CreateOAuth2SessionArgs): Promise<CreateOAuth2SessionResponse> {
    return await (
      await fetch(`${this.configuration.issuer}/oauth2-session`, {
        method: 'POST',
        headers: new Headers({
          ContentType: 'application/json',
          Accept: 'application/json',
        }),
        body: JSON.stringify(args),
      })
    ).json()
  }
}

export async function createVPJwt(
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

  return await context.agent.keyManagerSignJWT({
    kid,
    data: JSON.stringify({ protectedHeader, payload }),
  })
}

const createVcJwt = async (
  args: { payloadVc: CredentialPayload; kid: string; alg?: string; payloadJwt?: {} },
  context: IRequiredContext,
): Promise<string> => {
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

  return await context.agent.keyManagerSignJWT({
    kid,
    data: JSON.stringify({ protectedHeader, payload }),
  })
}
