import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import { IMsAuthenticationClientCredentialArgs } from '@sphereon/ssi-sdk.ms-authenticator'

export interface IMsRequestApi extends IPluginMethodMap {
  issuanceRequestMsVc(clientIssueRequest: IClientIssueRequest, context: IRequiredContext): Promise<IIssueRequestResponse>
}

export interface IClientIssueRequest {
  authenticationInfo: IMsAuthenticationClientCredentialArgs
  clientIssuanceConfig: IClientIssuanceConfig
  claims: CredentialSubject
}

export interface IClientIssuanceConfig {
  authority: string
  includeQRCode: boolean
  registration: Registration
  callback: Callback
  issuance: IClientIssuance
}

export interface IClientIssuance {
  type: string
  manifest: string
  pin: Pin
}

export interface IIssueRequest {
  authenticationInfo: IMsAuthenticationClientCredentialArgs
  issuanceConfig: IssuanceConfig
}

export interface IIssueRequestResponse {
  id: string
  requestId: string
  url: string
  expiry: Date
  pin: string
}

export interface Registration {
  clientName: string
}

export interface Headers {
  apiKey: string
}

export interface Callback {
  url: string
  state: string
  headers: Headers
}

export interface Pin {
  value: string
  length: number
}

export type CredentialSubject = {
  [x: string]: any
}

export interface Issuance {
  type: string
  manifest: string
  pin: Pin
  claims: CredentialSubject
}

export interface IssuanceConfig {
  authority: string
  includeQRCode: boolean
  registration: Registration
  callback: Callback
  issuance: Issuance
}

export type IRequiredContext = IAgentContext<Record<string, never>>
