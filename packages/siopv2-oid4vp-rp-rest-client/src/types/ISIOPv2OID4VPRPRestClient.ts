import { BearerTokenArg } from '@sphereon/ssi-types'
import { IAgentContext, IPluginMethodMap } from '@veramo/core'

import { AuthStatusResponse, GenerateAuthRequestURIResponse } from '@sphereon/ssi-sdk.siopv2-oid4vp-common'

export interface ISIOPv2OID4VPRPRestClient extends IPluginMethodMap {
  siopClientRemoveAuthRequestState(args: ISiopClientRemoveAuthRequestSessionArgs, context: IRequiredContext): Promise<boolean>

  siopClientCreateAuthRequest(args: ISiopClientGenerateAuthRequestArgs, context: IRequiredContext): Promise<GenerateAuthRequestURIResponse>

  siopClientGetAuthStatus(args: ISiopClientGetAuthStatusArgs, context: IRequiredContext): Promise<AuthStatusResponse>
}

export interface ISiopClientGenerateAuthRequestArgs {
  definitionId?: string
  baseUrl?: string
}

export interface ISiopClientRemoveAuthRequestSessionArgs {
  correlationId: string
  baseUrl?: string
  definitionId?: string
}

export interface ISiopClientGetAuthStatusArgs {
  correlationId: string
  baseUrl?: string
  definitionId?: string
}

export interface Siopv2RestClientAuthenticationOpts {
  enabled?: boolean
  bearerToken?: BearerTokenArg
}

export interface Siopv2RestClientOpts {
  baseUrl?: string
  definitionId?: string
  authentication?: Siopv2RestClientAuthenticationOpts
}

export type IRequiredContext = IAgentContext<any>
