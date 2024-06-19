import { OpenID4VCIClient } from '@sphereon/oid4vci-client'
import {
  AuthorizationDetails,
  CredentialConfigurationSupported,
  EndpointMetadataResult,
  getJson,
  getTypesFromCredentialSupported,
  OID4VCICredentialFormat,
  ProofOfPossessionCallbacks,
  RequestObjectOpts,
} from '@sphereon/oid4vci-common'
import { getIdentifier, IIdentifierOpts } from '@sphereon/ssi-sdk-ext.did-utils'
import { getAuthenticationKey, signCallback } from '@sphereon/ssi-sdk.oid4vci-holder'
import { IIdentifier } from '@veramo/core'
import { _ExtendedIKey } from '@veramo/utils'
import { calculateJwkThumbprintForKey } from '@sphereon/ssi-sdk-ext.key-utils'
import { IRequiredContext } from '../types/IEBSIAuthorizationClient'

export interface AttestationAuthRequestUrlResult {
  authUrl: string
  supportedConfigurations: Array<CredentialConfigurationSupported>
  metadata: EndpointMetadataResult
  identifier: IIdentifier
  authKey: _ExtendedIKey
  oid4vpState: string
}

export const ebsiCreateAttestationRequestAuthURL = async (
  opts: {
    credentialIssuer: string
    credentialType: string
    idOpts: IIdentifierOpts
    requestObjectOpts: RequestObjectOpts
    clientId?: string
    redirectUri?: string
    formats?: Array<Extract<OID4VCICredentialFormat, 'jwt_vc' | 'jwt_vc_json'>>
  },
  context: IRequiredContext,
): Promise<AttestationAuthRequestUrlResult> => {
  const { credentialIssuer, credentialType, idOpts, redirectUri, requestObjectOpts, formats = ['jwt_vc', 'jwt_vc_json'] } = opts
  const identifier = await getIdentifier(idOpts, context)
  if (identifier.provider !== 'did:ebsi' && identifier.provider !== 'did:key') {
    throw Error(
      `EBSI only supports did:key for natural persons and did:ebsi for legal persons. Provider: ${identifier.provider}, did: ${identifier.did}`,
    )
  }
  // This only works of the DID is actually registered, otherwise use our internal KMS; that is why the offline argument is passed in when type is Verifiable Auth to Onboard, as no DID is present at that point yet
  const authKey = await getAuthenticationKey({ identifier, offlineWhenNoDIDRegistered: credentialType === 'VerifiableAuthorisationToOnboard', context })
  const kid = authKey.meta.jwkThumbprint ?? calculateJwkThumbprintForKey({ key: authKey})
  const clientId = opts.clientId ?? identifier.did

  const vciClient = await OpenID4VCIClient.fromCredentialIssuer({
    credentialIssuer: credentialIssuer,
    kid,
    clientId,
    createAuthorizationRequestURL: false, // We will do that down below
    retrieveServerMetadata: true,
  })

  const allMatches = vciClient.getCredentialsSupported(false)
  let arrayMatches: Array<CredentialConfigurationSupported>
  if (Array.isArray(allMatches)) {
    arrayMatches = allMatches
  } else {
    arrayMatches = Object.entries(allMatches).map(([id, supported]) => {
      supported.id = id
      return supported
    })
  }
  const supportedConfigurations = arrayMatches
    .filter((supported) => getTypesFromCredentialSupported(supported, { filterVerifiableCredential: false }).includes(credentialType))
    .filter((supported) => (supported.format === 'jwt_vc' || supported.format === 'jwt_vc_json') && formats.includes(supported.format))
  if (supportedConfigurations.length === 0) {
    throw Error(`Could not find '${credentialType}' with format(s) '${formats.join(',')}' in list of supported types for issuer: ${credentialIssuer}`)
  }
  const authorizationDetails = supportedConfigurations.map((supported) => {
    return {
      type: 'openid_credential',
      format: supported.format,
      types: getTypesFromCredentialSupported(supported),
    } as AuthorizationDetails
  })

  const signCallbacks: ProofOfPossessionCallbacks<never> = requestObjectOpts.signCallbacks ?? {
    signCallback: signCallback(vciClient, identifier, context),
  }
  const authUrl = await vciClient.createAuthorizationRequestUrl({
    authorizationRequest: {
      redirectUri,
      clientId,
      authorizationDetails,
      requestObjectOpts: {
        ...requestObjectOpts,
        signCallbacks,
        kid: requestObjectOpts.kid ?? kid,
      },
    },
  })

  return {
    authUrl,
    identifier,
    authKey,
    supportedConfigurations,
    metadata: vciClient.endpointMetadata,
    oid4vpState: await vciClient.exportState(),
  }
}

/**
 * Normally you would use the browser to let the user make this call in the front channel,
 * however EBSI mainly uses mocks at present, and we want to be able to test as well
 */
export const ebsiAuthRequestExecution = async (authRequestResult: AttestationAuthRequestUrlResult, opts?: {}) => {
  const { oid4vpState, authUrl } = authRequestResult
  const vciClient = await OpenID4VCIClient.fromState({ state: oid4vpState })

  console.log(`URL: ${authUrl}, according to client: ${vciClient.authorizationURL}`)

  const authResponse = await getJson<any>(authUrl)
  const location: string | null = authResponse.origResponse.headers.get('location')

  console.log(`LOCATION: ${location}`)
}
