import { IAgentContext, ICredentialVerifier } from '@veramo/core'
import { GenericAuthArgs, ISingleEndpointOpts } from '@sphereon/ssi-express-support'
import { ISIOPv2RP } from '@sphereon/ssi-sdk.siopv2-oid4vp-rp-auth'
import { IPDManager } from '@sphereon/ssi-sdk.pd-manager'
import { AuthorizationRequestStateStatus, AuthorizationResponseStateStatus } from '@sphereon/ssi-sdk.siopv2-oid4vp-common'
import { Request, Response } from 'express'
import { z } from 'zod'
import { CreateAuthorizationRequestBodySchema, CreateAuthorizationResponseSchema } from '../schemas'
import { QRCodeOpts } from './QRCode.types'
import { VerifiedData } from '@sphereon/did-auth-siop'

export type SiopFeatures = 'rp-status' | 'siop'

export interface ISIOPv2RPRestAPIOpts {
  enableFeatures?: SiopFeatures[]
  endpointOpts?: {
    basePath?: string
    trustProxy?: boolean | Array<string>
    globalAuth?: GenericAuthArgs & { secureSiopEndpoints?: boolean }
    webappCreateAuthRequest?: ICreateAuthRequestWebappEndpointOpts // Override the create Auth Request path. Needs to contain correlationId and definitionId path params!
    webappDeleteAuthRequest?: ISingleEndpointOpts // Override the delete Auth Request path. Needs to contain correlationId and definitionId path params!
    webappGetDefinitions?: ISingleEndpointOpts // Override the delete Auth Request path. Needs to contain correlationId and definitionId path params!
    webappAuthStatus?: ISingleEndpointOpts // Override the Auth status path. CorrelationId and definitionId need to come from the body!
    siopVerifyAuthResponse?: ISingleEndpointOpts // Override the siop Verify Response path. Needs to contain correlationId and definitionId path params!
    siopGetAuthRequest?: ISingleEndpointOpts // Override the siop get Auth Request path. Needs to contain correlationId and definitionId path params!
  }
}
export interface ICreateAuthRequestWebappEndpointOpts extends ISingleEndpointOpts {
  siopBaseURI?: string
  qrCodeOpts?: QRCodeOpts
  webappAuthStatusPath?: string
  webappBaseURI?: string
  responseRedirectURI?: string
}

export type IRequiredPlugins = ICredentialVerifier & ISIOPv2RP & IPDManager
export type IRequiredContext = IAgentContext<IRequiredPlugins>

export type CreateAuthorizationRequest = Request<Record<string, never>, any, CreateAuthorizationRequestBody, Record<string, never>>

export type CreateAuthorizationRequestBody = z.infer<typeof CreateAuthorizationRequestBodySchema>;

export type CreateAuthorizationResponse = Response<CreateAuthorizationRequestResponse>

export type CreateAuthorizationRequestResponse = z.infer<typeof CreateAuthorizationResponseSchema>;

export type DeleteAuthorizationRequest = Request<DeleteAuthorizationRequestPathParameters, any, Record<string, any>, Record<string, any>>

export type DeleteAuthorizationRequestPathParameters = {
  correlationId: string;
}

export type GetAuthorizationRequestStatus = Request<GetAuthorizationRequestStatusPathParameters, any, Record<string, any>, Record<string, any>>

export type GetAuthorizationRequestStatusPathParameters = {
  correlationId: string;
}

export type RequestError = {
  status: number
  message: string
  error_details?: string
}

export interface AuthStatusResponse {
  status: AuthorizationRequestStateStatus | AuthorizationResponseStateStatus
  correlation_id: string
  query_id: string
  last_updated: number
  verified_data?: VerifiedData
  error?: RequestError
}

// export type VerifiedData = {
//   authorization_response?: AuthorizationResponse
//   credential_claims?: AdditionalClaims
// }
//
// export type AuthorizationResponse = {
//   presentation_submission?: Record<string, any>
//   vp_token?: VpToken
// }
//
// export type SingleObjectVpTokenPE = Record<string, any>
//
// export type SingleStringVpTokenPE = string
//
// export type MultipleVpTokens = Array<SingleObjectVpTokenPE> | Array<SingleStringVpTokenPE>
//
// export type MultipleVpTokenDCQL = {
//   [key: string]: MultipleVpTokens
// }
//
// export type VpToken =
//   | SingleObjectVpTokenPE
//   | SingleStringVpTokenPE
//   | MultipleVpTokens
//   | MultipleVpTokenDCQL
