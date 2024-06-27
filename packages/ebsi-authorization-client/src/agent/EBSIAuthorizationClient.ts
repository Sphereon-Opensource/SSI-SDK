import { CheckLinkedDomain, PresentationDefinitionLocation, PresentationDefinitionWithLocation, SupportedVersion } from '@sphereon/did-auth-siop'
import { CredentialMapper } from '@sphereon/ssi-types'
import { IAgentPlugin } from '@veramo/core'
import fetch from 'cross-fetch'
import {
  ApiOpts,
  EBSIAuthAccessTokenGetArgs,
  EbsiEnvironment,
  EBSIOIDMetadata,
  GetPresentationDefinitionSuccessResponse,
  IRequiredContext,
  schema,
} from '../index'
import {
  ExceptionResponse,
  GetAccessTokenArgs,
  GetAccessTokenResponse,
  GetOIDProviderJwksResponse,
  GetOIDProviderMetadataResponse,
  GetPresentationDefinitionArgs,
  GetPresentationDefinitionResponse,
  IEBSIAuthorizationClient,
} from '../types/IEBSIAuthorizationClient'

//const encodeBase64url = (input: string): string => u8a.toString(u8a.fromString(input), 'base64url')

export class EBSIAuthorizationClient implements IAgentPlugin {
  readonly schema = schema.IEBSIAuthorizationClient
  readonly methods: IEBSIAuthorizationClient = {
    ebsiAuthASDiscoveryMetadataGet: this.ebsiAuthASDiscoveryMetadataGet.bind(this),
    ebsiAuthASJwksGet: this.ebsiAuthASJwksGet.bind(this),
    ebsiAuthPresentationDefinitionGet: this.ebsiAuthPresentationDefinitionGet.bind(this),
    ebsiAuthAccessTokenGet: this.ebsiAuthAccessTokenGet.bind(this),
  }

  private async ebsiAuthASDiscoveryMetadataGet(args?: ApiOpts): Promise<GetOIDProviderMetadataResponse> {
    const url = await this.getDiscoveryEndpoint(args)
    return await (
      await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      })
    ).json()
  }

  private async ebsiAuthASJwksGet(args?: ApiOpts): Promise<GetOIDProviderJwksResponse | ExceptionResponse> {
    const discoveryMetadata: EBSIOIDMetadata = await this.ebsiAuthASDiscoveryMetadataGet(args)
    return await (
      await fetch(`${discoveryMetadata.jwks_uri}`, {
        method: 'GET',
        headers: {
          Accept: 'application/jwk-set+json',
        },
      })
    ).json()
  }

  private async ebsiAuthPresentationDefinitionGet(args: GetPresentationDefinitionArgs): Promise<GetPresentationDefinitionResponse> {
    const { scope, apiOpts } = args
    const discoveryMetadata: EBSIOIDMetadata = await this.ebsiAuthASDiscoveryMetadataGet(apiOpts)
    return (await (
      await fetch(`${discoveryMetadata.presentation_definition_endpoint}?scope=openid%20${scope}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      })
    ).json()) satisfies GetPresentationDefinitionSuccessResponse
  }

  private async ebsiAuthAccessTokenGet(args: EBSIAuthAccessTokenGetArgs, context: IRequiredContext): Promise<GetAccessTokenResponse> {
    const { vc, scope, kid, did, definitionId, apiOpts } = args
    console.log(vc, scope, kid, did, definitionId)
    const metadataResponse = await this.ebsiAuthASDiscoveryMetadataGet(args.apiOpts)
    const definitionResponse = await this.ebsiAuthPresentationDefinitionGet(args)
    const pexResult = await context.agent.pexDefinitionFilterCredentials({
      presentationDefinition: definitionResponse,
      credentialFilterOpts: { verifiableCredentials: [vc] },
    })
    const definition = {
      definition: definitionResponse,
      location: PresentationDefinitionLocation.TOPLEVEL_PRESENTATION_DEF,
      version: SupportedVersion.SIOPv2_D11,
    } satisfies PresentationDefinitionWithLocation
    const opSesssion = await context.agent.siopRegisterOPSession({
      requestJwtOrUri: '', // Siop assumes we use an auth request, which we don't have in this case
      op: { checkLinkedDomains: CheckLinkedDomain.NEVER },
      providedPresentationDefinitions: [definition],
    })
    const oid4vp = await opSesssion.getOID4VP([did])
    const vp = await oid4vp.createVerifiablePresentation(
      { definition, credentials: pexResult.filteredCredentials },
      {
        proofOpts: { domain: metadataResponse.issuer, nonce: Date().toString() },
        holderDID: did,
        identifierOpts: { identifier: did, kid },
        skipDidResolution: scope === 'didr_invite',
      },
    )

    const accessToken = await this.getAccessTokenResponse({
      grant_type: 'vp_token',
      vp_token: CredentialMapper.toCompactJWT(vp.verifiablePresentation),
      scope,
      presentation_submission: vp.presentationSubmission,
      apiOpts,
    }) //FIXME

    console.log(JSON.stringify(accessToken))
    return accessToken
    //
    //
    // const metadataResponse = await this.ebsiAuthASDiscoveryMetadataGet()
    // if ('status' in metadataResponse) {
    //   throw Error(JSON.stringify(metadataResponse))
    // }
    //
    // const tokenResponse = await this.getAccessToken({
    //   grant_type: 'vp_token',
    //   vp_token: vpJwt.verifiablePresentation as CompactJWT,
    //   presentation_submission: vpJwt.presentationSubmission,
    //   scope,
    // })
    // if ('status' in tokenResponse) {
    //   throw new Error(JSON.stringify(tokenResponse))
    // }
  }

  private async getAccessTokenResponse(args: GetAccessTokenArgs): Promise<GetAccessTokenResponse> {
    const { grant_type = 'vp_token', scope, vp_token, presentation_submission, apiOpts } = args
    const discoveryMetadata: EBSIOIDMetadata = await this.ebsiAuthASDiscoveryMetadataGet(apiOpts)
    return await (
      await fetch(`${discoveryMetadata.token_endpoint}`, {
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

  private async getUrl(args?: { environment?: EbsiEnvironment; version?: string }): Promise<string> {
    const { environment, version } = args ?? { environment: EbsiEnvironment.CONFORMANCE, version: 'v3' }
    if (environment === EbsiEnvironment.MOCK) {
      return `https://api-conformance.ebsi.eu/conformance/${version}/auth-mock`
    } else if (environment === EbsiEnvironment.ISSUER) {
      return `https://api-conformance.ebsi.eu/conformance/${version}/issuer-mock`
    }
    return `https://api-${environment}.ebsi.eu/authorisation/${version}`
  }

  private async getDiscoveryEndpoint(args?: ApiOpts): Promise<string> {
    const { environment, version } = { environment: EbsiEnvironment.CONFORMANCE, version: 'v4', ...args }
    if (environment === EbsiEnvironment.ISSUER) {
      return `${await this.getUrl({ environment, version })}/.well-known/openid-credential-issuer`
    }
    return `${await this.getUrl({ environment, version })}/.well-known/openid-configuration`
  }
}
