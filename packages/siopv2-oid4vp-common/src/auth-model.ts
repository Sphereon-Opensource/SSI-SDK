// noinspection JSUnusedGlobalSymbols
import { AuthorizationResponsePayload } from '@sphereon/did-auth-siop'
import { AdditionalClaims } from '@sphereon/ssi-types'

export interface ClaimPayloadCommonOpts {
  [x: string]: any
}

export type AuthorizationRequestStateStatus = 'created' | 'sent' | 'received' | 'verified' | 'error'

export type AuthorizationResponseStateStatus = 'created' | 'sent' | 'received' | 'verified' | 'error'

export interface GenerateAuthRequestURIResponse {
  correlationId: string
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
