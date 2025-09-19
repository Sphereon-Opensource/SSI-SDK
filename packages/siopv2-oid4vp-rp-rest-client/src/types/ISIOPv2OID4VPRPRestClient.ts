import { AuthStatusResponse, type CreateAuthorizationRequest, type CreateAuthorizationResponse } from '@sphereon/ssi-sdk.siopv2-oid4vp-common'
import { BearerTokenArg } from '@sphereon/ssi-types'
import { IAgentContext, IPluginMethodMap } from '@veramo/core'

export interface ISIOPv2OID4VPRPRestClient extends IPluginMethodMap {
  siopClientRemoveAuthRequestState(args: ISiopClientRemoveAuthRequestSessionArgs, context: IRequiredContext): Promise<boolean>

  siopClientCreateAuthRequest(args: ISiopClientGenerateAuthRequestArgs, context: IRequiredContext): Promise<CreateAuthorizationResponse>

  siopClientGetAuthStatus(args: ISiopClientGetAuthStatusArgs, context: IRequiredContext): Promise<AuthStatusResponse>
}

export type ISiopClientGenerateAuthRequestArgs = Omit<CreateAuthorizationRequest, 'requestUriMethod'> & {
  baseUrl?: string
}

export interface ISiopClientRemoveAuthRequestSessionArgs {
  correlationId: string
  baseUrl?: string
  queryId?: string
}

export interface ISiopClientGetAuthStatusArgs {
  correlationId: string
  baseUrl?: string
}

export interface Siopv2RestClientAuthenticationOpts {
  enabled?: boolean
  bearerToken?: BearerTokenArg
}

export interface Siopv2RestClientOpts {
  baseUrl?: string
  authentication?: Siopv2RestClientAuthenticationOpts
}

export type IRequiredContext = IAgentContext<any>
