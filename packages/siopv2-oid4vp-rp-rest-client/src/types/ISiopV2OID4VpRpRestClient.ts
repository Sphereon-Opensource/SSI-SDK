import { IAgentContext, IPluginMethodMap, IResolver } from '@veramo/core'

import { PresentationSubmission, W3CVerifiablePresentation } from '@sphereon/ssi-types'

export interface ISiopV2OID4VpRpRestClient extends IPluginMethodMap {
  siopClientRemoveAuthRequestSession(args: ISiopClientRemoveAuthRequestSessionArgs, context: IRequiredContext): Promise<any>
  siopClientGenerateAuthRequest(args: ISiopClientGenerateAuthRequestArgs, context: IRequiredContext): Promise<any>
  siopClientGetAuthStatus(args: ISiopClientGetAuthStatusArgs, context: IRequiredContext): Promise<any>
}

export interface ISiopClientGenerateAuthRequestArgs {
  definitionId?: string
  baseUrl?: string
}

export interface ISiopClientAuthStatus {
  status: string
  correlationId: string
  definitionId: string
  lastUpdated: Date
}

export interface ISiopClientRemoveAuthRequestSessionArgs {
  correlationId: string
  baseUrl?: string
  definitionId?: string
}

export type ISiopClientGetAuthStatusArgs = ISiopClientGenerateAuthRequestURIResponse

export interface ISiopClientGenerateAuthRequestURIResponse {
  correlationId: string
  definitionId: string
  authRequestURI: string
  authStatusURI: string
  baseUrl?: string
}

export interface ISiopClientAuthStatusResponse {
  status: AuthorizationRequestStateStatus | AuthorizationResponseStateStatus
  correlationId: string
  error?: string
  definitionId: string
  lastUpdated: number
  payload?: SiopClientAuthorizationResponsePayload // Only put in here once the status reaches Verified on the RP side
}

export declare enum AuthorizationResponseStateStatus {
  CREATED = 'created',
  SENT = 'sent',
  RECEIVED = 'received',
  VERIFIED = 'verified',
  ERROR = 'error',
}

export declare enum AuthorizationRequestStateStatus {
  CREATED = 'created',
  SENT = 'sent',
  RECEIVED = 'received',
  VERIFIED = 'verified',
  ERROR = 'error',
}

export interface SiopClientAuthorizationResponsePayload {
  access_token?: string
  token_type?: string
  refresh_token?: string
  expires_in?: number
  state: string
  id_token?: string
  vp_token?: W3CVerifiablePresentation | W3CVerifiablePresentation[]
  presentation_submission?: PresentationSubmission
  [x: string]: any
}

export type IRequiredContext = IAgentContext<IResolver>
