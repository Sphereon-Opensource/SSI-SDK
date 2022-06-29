import { IAgentContext, IPluginMethodMap, IDataStoreSaveVerifiableCredentialArgs, FindClaimsArgs, FindCredentialsArgs, AuthorizedDIDContext, UniqueVerifiableCredential} from '@veramo/core'
import { IMsAuthenticationClientCredentialArgs } from '@sphereon/ms-authenticator'

export interface IMsVcApiIssuer extends IPluginMethodMap {
  issuanceRequestMsVc(issuanceInfo: IIssueRequest, context: IRequiredContext) : Promise<IIssueRequestResponse>
  dataStoreSaveVerifiableCredential(args: IDataStoreSaveVerifiableCredentialArgs): Promise<string>
  dataStoreORMGetVerifiableCredentialsByClaims( args: FindClaimsArgs, context: AuthorizedDIDContext ): Promise<Array<UniqueVerifiableCredential>>
  dataStoreORMGetVerifiableCredentialsCount( args: FindCredentialsArgs, context: AuthorizedDIDContext ): Promise<number>
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
  clientName: string;
}

export interface Headers {
  apiKey: string;
}

export interface Callback {
  url: string;
  state: string;
  headers: Headers;
}

export interface Pin {
  value: string;
  length: number;
}

export type CredentialSubject = {
  [x: string]: any
}

export interface Issuance {
  type: string;
  manifest: string;
  pin: Pin;
  claims: CredentialSubject;
}

export interface IssuanceConfig {
  authority: string;
  includeQRCode: boolean;
  registration: Registration;
  callback: Callback;
  issuance: Issuance;
}

export type IRequiredContext = IAgentContext<Record<string, never>>
