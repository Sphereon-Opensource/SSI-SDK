import { IAgentContext, IPluginMethodMap } from '@veramo/core'

export interface IMsVcApiIssuer extends IPluginMethodMap {
  authenticateMsVcApi(args: IMsAuthenticationArgs, context: IRequiredContext): Promise<IMsAuthenticationResponse>
}

export interface IMsAuthenticationArgs {
  azClientId: string
  azClientSecret: string
  azTenantId: string
  credentialManifest: string
}

export enum events {
  AUTHENTICATED = 'authenticated',
}

export type IRequiredContext = IAgentContext<Record<string, never>>
export type IMsAuthenticationResponse = String
