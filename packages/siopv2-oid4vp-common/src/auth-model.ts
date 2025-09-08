// noinspection JSUnusedGlobalSymbols
import { AuthorizationResponsePayload } from '@sphereon/did-auth-siop'
import { AdditionalClaims } from '@sphereon/ssi-types'

export interface ClaimPayloadCommonOpts {
  [x: string]: any
}

export interface AuthorizationChallengeValidationResponse {
  presentation_during_issuance_session: string
}

export type AuthorizationRequestStateStatus = "authorization_request_created" | "authorization_request_retrieved" | "error"//(typeof authorizationRequestStatuses)[number];

export type AuthorizationResponseStateStatus = "authorization_response_received" | "authorization_response_verified" | "error"//(typeof authorizationResponseStatuses)[number];

export interface GenerateAuthRequestURIResponse {
  correlationId: string
  state: string
  definitionId: string
  authRequestURI: string
  authStatusURI: string
}

export interface AuthStatusResponse {
  status: AuthorizationRequestStateStatus | AuthorizationResponseStateStatus
  correlationId: string
  error?: string
  definitionId: string
  lastUpdated: number
  payload?: AuthorizationResponsePayload // Only put in here once the status reaches Verified on the RP side
  verifiedData?: AdditionalClaims
}
