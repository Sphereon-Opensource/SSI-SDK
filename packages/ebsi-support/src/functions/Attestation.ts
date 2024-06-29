import { OpenID4VCIClient } from '@sphereon/oid4vci-client'
import {
  Alg,
  AuthorizationDetails,
  AuthorizationRequestOpts,
  AuthzFlowType,
  CredentialConfigurationSupported,
  getJson,
  getTypesFromCredentialSupported,
  ProofOfPossessionCallbacks,
} from '@sphereon/oid4vci-common'
import { getIdentifier } from '@sphereon/ssi-sdk-ext.did-utils'
import { calculateJwkThumbprintForKey } from '@sphereon/ssi-sdk-ext.key-utils'
import {
  getAuthenticationKey,
  IssuanceOpts,
  OID4VCICallbackStateListener,
  OID4VCIMachineInterpreter,
  OID4VCIMachineState,
  OID4VCIMachineStates,
  PrepareStartArgs,
  signatureAlgorithmFromKey,
  signCallback,
  SupportedDidMethodEnum,
} from '@sphereon/ssi-sdk.oid4vci-holder'
import {
  OID4VPCallbackStateListener,
  Siopv2MachineInterpreter,
  Siopv2MachineState,
  Siopv2MachineStates,
} from '@sphereon/ssi-sdk.siopv2-oid4vp-op-auth'
import { Siopv2OID4VPLinkHandler } from '@sphereon/ssi-sdk.siopv2-oid4vp-op-auth/dist/link-handler'
import { IIdentifier } from '@veramo/core'
import { _ExtendedIKey } from '@veramo/utils'
import { waitFor } from 'xstate/lib/waitFor'
import { AttestationResult, CreateAttestationAuthRequestURLArgs, GetAttestationArgs, IRequiredContext } from '../types/IEbsiSupport'
import {
  addContactCallback,
  authorizationCodeUrlCallback,
  handleErrorCallback,
  reviewCredentialsCallback,
  selectCredentialsCallback,
  siopDoneCallback,
} from './AttestationHeadlessCallbacks'

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
  {
    clientId: clientIdArg,
    credentialIssuer,
    credentialType,
    idOpts,
    redirectUri,
    requestObjectOpts,
    formats = ['jwt_vc', 'jwt_vc_json'],
  }: CreateAttestationAuthRequestURLArgs,
  context: IRequiredContext,
): Promise<AttestationAuthRequestUrlResult> => {
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
  const clientId = clientIdArg ?? identifier.did

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
    signCallback: signCallback(vciClient, idOpts, context),
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

export const ebsiGetAttestationInterpreter = async (
  { clientId, authReqResult }: Omit<GetAttestationArgs, 'opts'>,
  context: IRequiredContext,
): Promise<OID4VCIMachineInterpreter> => {
  const identifier = authReqResult.identifier
  const vciStateCallbacks = new Map<OID4VCIMachineStates, (oid4vciMachine: OID4VCIMachineInterpreter, state: OID4VCIMachineState) => Promise<void>>()
  const vpStateCallbacks = new Map<Siopv2MachineStates, (oid4vpMachine: Siopv2MachineInterpreter, state: Siopv2MachineState) => Promise<void>>()

  const oid4vciMachine = await context.agent.oid4vciHolderGetMachineInterpreter({
    ...authReqResult,
    issuanceOpt: {
      identifier,
      didMethod: SupportedDidMethodEnum.DID_EBSI,
      kid: authReqResult.authKey.meta?.jwkThumbprint ?? authReqResult.authKey.kid,
    },
    clientOpts: {
      clientAssertionType: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      kid: authReqResult.authKey.meta?.jwkThumbprint ?? authReqResult.authKey.kid,
      clientId,
    },
    didMethodPreferences: [SupportedDidMethodEnum.DID_EBSI, SupportedDidMethodEnum.DID_KEY],
    stateNavigationListener: OID4VCICallbackStateListener(vciStateCallbacks),
  })
  const vpLinkHandler = new Siopv2OID4VPLinkHandler({
    protocols: ['openid:'],
    // @ts-ignore
    context,
    noStateMachinePersistence: true,
    stateNavigationListener: OID4VPCallbackStateListener(vpStateCallbacks),
  })

  vpStateCallbacks
    .set(Siopv2MachineStates.done, siopDoneCallback({ oid4vciMachine }, context))
    .set(Siopv2MachineStates.handleError, handleErrorCallback(context))

  vciStateCallbacks
    .set(OID4VCIMachineStates.handleError, handleErrorCallback(context))
    .set(OID4VCIMachineStates.addContact, addContactCallback(context))
    .set(OID4VCIMachineStates.selectCredentials, selectCredentialsCallback(context))
    .set(
      OID4VCIMachineStates.initiateAuthorizationRequest,
      authorizationCodeUrlCallback(
        {
          authReqResult,
          vpLinkHandler,
        },
        context,
      ),
    )
    .set(OID4VCIMachineStates.reviewCredentials, reviewCredentialsCallback(context))

  return oid4vciMachine.interpreter
}

export const ebsiGetAttestation = async (
  { clientId, authReqResult, opts = { timeout: 30_000 } }: GetAttestationArgs,
  context: IRequiredContext,
): Promise<AttestationResult> => {
  const interpreter = await ebsiGetAttestationInterpreter({ clientId, authReqResult }, context)
  const state = await waitFor(interpreter.start(), (state) => state.matches('done') || state.matches('handleError'), {
    timeout: opts.timeout ?? 30_000,
  })
  if (state.matches('handleError')) {
    console.error(JSON.stringify(state.context.error))
    throw Error(JSON.stringify(state.context.error))
  }

  return {
    contactAlias: state.context.contactAlias,
    contact: state.context.contact!,
    credentialBranding: state.context.credentialBranding,
    identifier: state.context.issuanceOpt?.identifier ?? authReqResult.identifier,
    error: state.context.error,
    credentials: state.context.credentialsToAccept,
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
