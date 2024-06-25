import { OpenID4VCIClient } from '@sphereon/oid4vci-client'
import {
  Alg,
  AuthorizationDetails,
  AuthorizationRequestOpts,
  AuthzFlowType,
  CredentialConfigurationSupported,
  getJson,
  getTypesFromCredentialSupported,
  OID4VCICredentialFormat,
  ProofOfPossessionCallbacks,
  RequestObjectOpts,
} from '@sphereon/oid4vci-common'
import { getIdentifier, IIdentifierOpts } from '@sphereon/ssi-sdk-ext.did-utils'
import { calculateJwkThumbprintForKey } from '@sphereon/ssi-sdk-ext.key-utils'
import {
  getAuthenticationKey,
  IssuanceOpts,
  PrepareStartArgs,
  signatureAlgorithmFromKey,
  signCallback,
  SupportedDidMethodEnum,
} from '@sphereon/ssi-sdk.oid4vci-holder'
import { IIdentifier } from '@veramo/core'
import { _ExtendedIKey } from '@veramo/utils'
import { IRequiredContext } from '../types/IEBSIAuthorizationClient'

export interface AttestationAuthRequestUrlResult extends Omit<Required<PrepareStartArgs>, 'issuanceOpt'> {
  issuanceOpt?: IssuanceOpts
  authorizationCodeURL: string
  identifier: IIdentifier
  authKey: _ExtendedIKey
}

/**
 * Method to generate an authz url for getting attestation credentials from a (R)TAO on EBSI using a cloud/service wallet
 *
 * This method can be used standalone. But it can also be used as input for the `oid4vciHolderStart` agent method,
 * to start a OID4VCI holder flow.
 *
 * @param opts
 * @param context
 */
export const ebsiCreateAttestationAuthRequestURL = async (
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
  // This only works if the DID is actually registered, otherwise use our internal KMS;
  // that is why the offline argument is passed in when type is Verifiable Auth to Onboard, as no DID is present at that point yet
  const authKey = await getAuthenticationKey({
    identifier,
    offlineWhenNoDIDRegistered: credentialType === 'VerifiableAuthorisationToOnboard',
    noVerificationMethodFallback: true,
    context,
  })
  const kid = authKey.meta.jwkThumbprint ?? calculateJwkThumbprintForKey({ key: authKey })
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
    signCallback: await signCallback(vciClient, idOpts, context),
  }
  const authorizationRequestOpts = {
    redirectUri,
    clientId,
    authorizationDetails,
    requestObjectOpts: {
      ...requestObjectOpts,
      signCallbacks,
      kid: requestObjectOpts.kid ?? kid,
    },
  } satisfies AuthorizationRequestOpts
  // todo: Do we really need to do this, or can we just set the create option to true at this point? We are passing in the authzReq opts
  const authorizationCodeURL = await vciClient.createAuthorizationRequestUrl({
    authorizationRequest: authorizationRequestOpts,
  })

  return {
    requestData: {
      createAuthorizationRequestURL: false,
      flowType: AuthzFlowType.AUTHORIZATION_CODE_FLOW,
      uri: credentialIssuer,
      existingClientState: JSON.parse(await vciClient.exportState()),
    },
    accessTokenOpts: {
      clientOpts: {
        alg: Alg[await signatureAlgorithmFromKey({ key: authKey })],
        clientId,
        kid,
        signCallbacks,
        clientAssertionType: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      },
    },
    authorizationRequestOpts,
    authorizationCodeURL,
    identifier,
    authKey,
    didMethodPreferences: [SupportedDidMethodEnum.DID_EBSI, SupportedDidMethodEnum.DID_KEY],
  }
}

/**
 * Normally you would use the browser to let the user make this call in the front channel,
 * however EBSI mainly uses mocks at present, and we want to be able to test as well
 */
export const ebsiAuthRequestExecution = async (authRequestResult: AttestationAuthRequestUrlResult, opts?: {}) => {
  const { requestData, authorizationCodeURL } = authRequestResult
  const vciClient = await OpenID4VCIClient.fromState({ state: requestData?.existingClientState! })

  console.log(`URL: ${authorizationCodeURL}, according to client: ${vciClient.authorizationURL}`)

  const authResponse = await getJson<any>(authorizationCodeURL)
  const location: string | null = authResponse.origResponse.headers.get('location')

  console.log(`LOCATION: ${location}`)
}
