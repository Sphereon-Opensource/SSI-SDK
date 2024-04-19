import { IAgentPlugin } from '@veramo/core'
import { schema } from '../index'
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
  readonly configuration: any

  //TODO Pass the configuration manually or call init
  constructor(readonly baseUrl: string = 'https://api-pilot.ebsi.eu/authorisation/v4/') {}

  private async getOIDProviderMetadata(): Promise<GetOIDProviderMetadataResponse> {
    return await (await fetch(`${this.baseUrl}/.well-known/openid-configuration`, {
      method: 'GET',
      headers: new Headers({
        Accept: 'application/json',
      })
    })).json()
  }

  private async getOIDProviderJwks(): Promise<GetOIDProviderJwksResponse | ExceptionResponse> {
    return await (await fetch(`${this.configuration.jwks_uri}`, {
      method: 'GET',
      headers: new Headers({
        Accept: 'application/jwk-set+json',
      })
    })).json()
  }

  private async getPresentationDefinition(args: GetPresentationDefinitionArgs): Promise<GetPresentationDefinitionResponse> {
    const { scope } = args
    return await (await fetch(`${this.configuration.presentation_definition_endpoint}?scope=${scope}`, {
      method: 'GET',
      headers: new Headers({
        Accept: 'application/json',
      })
    })).json()
  }

  private async getAccessToken(args: GetAccessTokenArgs): Promise<GetAccessTokenResponse> {
    const formData = new FormData()
    Object.entries(args).forEach(entry => formData.append(entry[0], entry[1]))
    return await (
      await fetch(`${this.configuration.token_endpoint}`, {
        method: 'POST',
        headers: new Headers({
          ContentType: 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        }),
        body: formData,
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
    Object.entries(args).forEach(entry => formData.append(entry[0], entry[1]))
    return await (
      await fetch(`${this.configuration.issuer}/siop-sessions`, {
        method: 'POST',
        headers: new Headers({
          ContentType: 'application/x-www-form-urlencoded',
          Accept: 'application/json'
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
