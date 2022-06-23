import { IAgentContext, IPluginMethodMap } from '@veramo/core'

export interface IMsVcApiIssuer extends IPluginMethodMap {
  authenticateMsVcApi(args: IMsAuthenticationArgs, context: IRequiredContext): Promise<IMsAuthenticationResponse>
  issuanceRequestMsVc(args: IMsIssuanceRequestArgs, context: IRequiredContext) : Promise<IIssueRequestResponse>
}

export interface IMsIssuanceRequestArgs {
}

export interface IMsAuthenticationArgs {
  azClientId: string
  azClientSecret: string
  azTenantId: string
  credentialManifest: string
}

export interface IIssueRequestResponse {
  id: string
  requestId: string
  url: string
  expiry: Date,
  pin: string
}


export enum events {
  AUTHENTICATED = 'authenticated',
}

export type IRequiredContext = IAgentContext<Record<string, never>>
export type IMsAuthenticationResponse = String
