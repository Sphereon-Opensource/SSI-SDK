import { CheckLinkedDomain, PresentationDefinitionLocation, PresentationDefinitionWithLocation, SupportedVersion } from '@sphereon/did-auth-siop'
import { CreateRequestObjectMode } from '@sphereon/oid4vci-common'
import { getIdentifier } from '@sphereon/ssi-sdk-ext.did-utils'
import { CredentialMapper } from '@sphereon/ssi-types'
import { IAgentPlugin } from '@veramo/core'
import fetch from 'cross-fetch'
import { determineWellknownEndpoint, ebsiGetAuthorisationServer } from '../did/functions'
import { ebsiCreateAttestationAuthRequestURL, ebsiGetAttestation } from '../functions'
import {
  ApiOpts,
  EBSIAuthAccessTokenGetArgs,
  EbsiOpenIDMetadata,
  GetPresentationDefinitionSuccessResponse,
  IRequiredContext,
  schema,
  WellknownOpts,
} from '../index'
import {
  ExceptionResponse,
  GetAccessTokenArgs,
  GetAccessTokenResponse,
  GetOIDProviderJwksResponse,
  GetOIDProviderMetadataResponse,
  GetPresentationDefinitionArgs,
  GetPresentationDefinitionResponse,
  IEbsiSupport,
} from '../types/IEbsiSupport'

//const encodeBase64url = (input: string): string => u8a.toString(u8a.fromString(input), 'base64url')

export class EbsiSupport implements IAgentPlugin {
  readonly schema = schema.IEBSIAuthorizationClient
  readonly methods: IEbsiSupport = {
    ebsiWellknownMetadata: this.ebsiWellknownMetadata.bind(this),
    ebsiAuthorizationServerJwks: this.ebsiAuthorizationServerJwks.bind(this),
    ebsiPresentationDefinitionGet: this.ebsiPresentationDefinitionGet.bind(this),
    ebsiAccessTokenGet: this.ebsiAccessTokenGet.bind(this),
    ebsiCreateAttestationAuthRequestURL: ebsiCreateAttestationAuthRequestURL.bind(this),
    ebsiGetAttestation: ebsiGetAttestation.bind(this),
  }

  private async ebsiWellknownMetadata(args: WellknownOpts): Promise<GetOIDProviderMetadataResponse> {
    const url = determineWellknownEndpoint(args)
    return await (
      await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      })
    ).json()
  }

  private async ebsiAuthorizationServerJwks(args: ApiOpts): Promise<GetOIDProviderJwksResponse | ExceptionResponse> {
    const discoveryMetadata: EbsiOpenIDMetadata = await this.ebsiWellknownMetadata({
      ...args,
      type: 'openid-configuration',
    })
    return await (
      await fetch(`${discoveryMetadata.jwks_uri}`, {
        method: 'GET',
        headers: {
          Accept: 'application/jwk-set+json',
        },
      })
    ).json()
  }

  private async ebsiPresentationDefinitionGet(args: GetPresentationDefinitionArgs): Promise<GetPresentationDefinitionResponse> {
    const { scope, apiOpts, openIDMetadata } = args
    const discoveryMetadata: EbsiOpenIDMetadata = openIDMetadata ?? await this.ebsiWellknownMetadata({
      ...apiOpts,
      type: 'openid-configuration',
      system: apiOpts?.mock ? 'authorisation' : apiOpts?.system,
      version: apiOpts?.version ?? 'v4',
    })
    return (await (
      await fetch(`${discoveryMetadata.presentation_definition_endpoint}?scope=openid%20${scope}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      })
    ).json()) satisfies GetPresentationDefinitionSuccessResponse
  }

  private async ebsiAccessTokenGet(args: EBSIAuthAccessTokenGetArgs, context: IRequiredContext): Promise<GetAccessTokenResponse> {
    const { scope, idOpts, jwksUri, clientId, allVerifiableCredentials, redirectUri } = args
    const identifier = await getIdentifier(idOpts, context)
    const apiOpts: WellknownOpts = {
      ...args.apiOpts,
      version: args.apiOpts.version ?? 'v4',
      type: 'openid-configuration',
    }
    const metadataResponse = await this.ebsiWellknownMetadata({...apiOpts, mock: undefined, system: 'authorisation'})
    const definitionResponse = await this.ebsiPresentationDefinitionGet({ ...args, openIDMetadata: metadataResponse, apiOpts: {...apiOpts, system: apiOpts.mock ? undefined : apiOpts.system } })

    let attestationCredential = args.attestationCredential
    if (!attestationCredential) {
      if (allVerifiableCredentials) {
        const pexResult = await context.agent.pexDefinitionFilterCredentials({
          presentationDefinition: definitionResponse,
          credentialFilterOpts: { verifiableCredentials: allVerifiableCredentials },
        })
        if (pexResult.filteredCredentials.length > 0) {
          const filtered = pexResult.filteredCredentials
            .map((cred) => CredentialMapper.toUniformCredential(cred))
            .filter((cred) => {
              if (!cred.expirationDate) {
                return cred
              } else if (new Date(cred.expirationDate!).getDate() >= Date.now()) {
                return cred
              }
              return undefined
            })
            .filter((cred) => !!cred)
          if (filtered.length > 0) {
            attestationCredential = filtered[0]
          }
        }
      }
      if (!attestationCredential) {
        // todo: Search in agent for applicable VCs
        const credentialIssuer = args.credentialIssuer ?? metadataResponse.issuer ?? ebsiGetAuthorisationServer(apiOpts)
        const authReqResult = await context.agent.ebsiCreateAttestationAuthRequestURL({
          credentialIssuer,
          idOpts,
          formats: ['jwt_vc'],
          clientId,
          redirectUri,
          requestObjectOpts: {
            iss: clientId,
            requestObjectMode: CreateRequestObjectMode.REQUEST_OBJECT,
            jwksUri,
          },
          credentialType: 'VerifiableAuthorisationToOnboard',
        })
        const attestationResult = await context.agent.ebsiGetAttestation({
          authReqResult,
          clientId,
          opts: { timeout: 30_000 },
        })
        // @ts-ignore
        attestationCredential = attestationResult.credentials[0]!.rawVerifiableCredential! as W3CVerifiableCredential
      }
    }

    console.log(attestationCredential, scope, idOpts)
    const pexResult = await context.agent.pexDefinitionFilterCredentials({
      presentationDefinition: definitionResponse,
      credentialFilterOpts: { verifiableCredentials: [attestationCredential!] },
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
    const oid4vp = await opSesssion.getOID4VP([identifier.did])
    const vp = await oid4vp.createVerifiablePresentation(
      { definition, credentials: pexResult.filteredCredentials },
      {
        proofOpts: { domain: metadataResponse.issuer, nonce: Date().toString() },
        holderDID: identifier.did,
        identifierOpts: idOpts,
        skipDidResolution: scope === 'didr_invite',
      },
    )

    const accessToken = await this.getAccessTokenResponse({
      grant_type: 'vp_token',
      vp_token: CredentialMapper.toCompactJWT(vp.verifiablePresentation),
      scope,
      presentation_submission: vp.presentationSubmission,
      apiOpts,
      openIDMetadata: metadataResponse
    }) //FIXME

    console.log(JSON.stringify(accessToken))
    return accessToken
    //
    //
    // const metadataResponse = await this.ebsiGetWellknownMetadata()
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
    const { grant_type = 'vp_token', scope, vp_token, presentation_submission, apiOpts, openIDMetadata } = args
    const discoveryMetadata: EbsiOpenIDMetadata = openIDMetadata ?? await this.ebsiWellknownMetadata({
      ...apiOpts,

      type: 'openid-configuration',
    })
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

  /*private async getUrl({version = 'v3', environment = 'pilot'}: { environment?: EbsiEnvironment | 'auth-mock' | 'issuer-mock'; version?: string }): Promise<string> {

        if (environment === EbsiEnvironment.MOCK) {
          return `https://api-conformance.ebsi.eu/conformance/${version}/auth-mock`
        } else if (environment === EbsiEnvironment.ISSUER) {
          return `https://api-conformance.ebsi.eu/conformance/${version}/issuer-mock`
        }
        return `https://api-${environment}.ebsi.eu/authorisation/${version}`
      }
    */
}
