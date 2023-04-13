import { IAgentContext, IPluginMethodMap, IResolver } from '@veramo/core'

import { PresentationSubmission, W3CVerifiablePresentation } from '@sphereon/ssi-types'

export interface ISiopV2OID4VpRpRestClient extends IPluginMethodMap {
  removeAuthRequestSession(args: IRemoveAuthRequestSessionArgs, context: IRequiredContext): Promise<any>
  generateAuthRequest(args: IGenerateAuthRequestArgs, context: IRequiredContext): Promise<any>
  getAuthStatus(args: IGetAuthStatusArgs, context: IRequiredContext): Promise<any>
}

export interface IGenerateAuthRequestArgs {
  definitionId?: string
  baseUrl?: string
}

export interface IRemoveAuthRequestSessionArgs {
  correlationId: string
  baseUrl?: string
  definitionId?: string
}

export type IGetAuthStatusArgs = IGenerateAuthRequestURIResponse

export interface IGenerateAuthRequestURIResponse {
  correlationId: string
  definitionId: string
  authRequestURI: string
  authStatusURI: string
  baseUrl?: string
}

export interface IAuthStatusResponse {
  status: AuthorizationRequestStateStatus | AuthorizationResponseStateStatus
  correlationId: string
  error?: string
  definitionId: string
  lastUpdated: number
  payload?: AuthorizationResponsePayload // Only put in here once the status reaches Verified on the RP side
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

export interface AuthorizationResponsePayload {
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
