import { OpenID4VCIClient } from '@sphereon/oid4vci-client'
import { AuthorizationChallengeValidationResponse } from '@sphereon/ssi-sdk.siopv2-oid4vp-common'
import { AuthorizationChallengeCodeResponse } from '@sphereon/oid4vci-common'
import { CreateConfigResult } from '@sphereon/ssi-sdk.siopv2-oid4vp-op-auth'
import { v4 as uuidv4 } from 'uuid'
import { RequiredContext } from '../types/IOID4VCIHolder'
import {
  CreateConfigArgs,
  GetSiopRequestArgs,
  SendAuthorizationChallengeRequestArgs,
  SendAuthorizationResponseArgs,
  SiopV2AuthorizationRequestData
} from '../types/FirstPartyMachine'

export const sendAuthorizationChallengeRequest = async (args: SendAuthorizationChallengeRequestArgs): Promise<AuthorizationChallengeCodeResponse> => {
  const { openID4VCIClientState, authSession, presentationDuringIssuanceSession } = args

  const oid4vciClient = await OpenID4VCIClient.fromState({ state: openID4VCIClientState })
  return oid4vciClient.acquireAuthorizationChallengeCode({
    clientId: oid4vciClient.clientId ?? uuidv4(),
    ...(authSession && { authSession }),
    ...(openID4VCIClientState.credentialOffer?.preAuthorizedCode && { issuerState: openID4VCIClientState.credentialOffer?.preAuthorizedCode }),
    ...(openID4VCIClientState.credentialOffer?.issuerState && { issuerState: openID4VCIClientState.credentialOffer?.issuerState }),
    ...(presentationDuringIssuanceSession && { presentationDuringIssuanceSession })
  })
}

export const createConfig = async (args: CreateConfigArgs, context: RequiredContext): Promise<CreateConfigResult> => {
  const { presentationUri } = args;

  if (!presentationUri) {
    return Promise.reject(Error('Missing presentation uri in context'));
  }

  return context.agent.siopCreateConfig({ url: presentationUri })
};

export const getSiopRequest = async (args: GetSiopRequestArgs, context: RequiredContext): Promise<SiopV2AuthorizationRequestData> => {
  const {didAuthConfig, presentationUri} = args;

  if (presentationUri === undefined) {
    return Promise.reject(Error('Missing presentation uri in context'));
  }

  if (didAuthConfig === undefined) {
    return Promise.reject(Error('Missing did auth config in context'));
  }

  return context.agent.siopGetSiopRequest({ didAuthConfig, url: presentationUri })
}

export const sendAuthorizationResponse = async (args: SendAuthorizationResponseArgs, context: RequiredContext): Promise<string> => {
  const { didAuthConfig, authorizationRequestData, selectedCredentials } = args

  const responseData = await context.agent.siopSendResponse({
    authorizationRequestData,
    selectedCredentials,
    didAuthConfig,
    isFirstParty: true
  })

  return (<AuthorizationChallengeValidationResponse>responseData.body).presentation_during_issuance_session
}
