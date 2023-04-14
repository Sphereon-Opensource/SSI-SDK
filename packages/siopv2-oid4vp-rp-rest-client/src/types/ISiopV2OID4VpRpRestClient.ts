import { IAgentContext, IPluginMethodMap, IResolver } from '@veramo/core'

import { AuthStatusResponse, GenerateAuthRequestURIResponse } from '@sphereon/ssi-sdk-siopv2-oid4vp-common'

export interface ISiopV2OID4VpRpRestClient extends IPluginMethodMap {
  siopClientRemoveAuthRequestSession(args: ISiopClientRemoveAuthRequestSessionArgs, context: IRequiredContext): Promise<void>
  siopClientGenerateAuthRequest(args: ISiopClientGenerateAuthRequestArgs, context: IRequiredContext): Promise<GenerateAuthRequestURIResponse>
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

export type ISiopClientGetAuthStatusArgs = GenerateAuthRequestURIResponse & { baseUrl?: string }

export type IRequiredContext = IAgentContext<IResolver>
