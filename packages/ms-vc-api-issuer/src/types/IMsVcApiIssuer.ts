import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import { AccountInfo } from '@azure/msal-common'

export interface IMsVcApiIssuer extends IPluginMethodMap {
  authenticateMsVcApi(): Promise<IMsAuthenticationResponse>
}

export interface IMsAuthenticationWrapperArgs {
  authenticationType: MsAuthenticationTypeEnum
  authenticationArgs:
    | IMsAuthenticationClientCredentialArgs
    | IMsAuthenticationUsernamePasswordArgs
    | IMsAuthenticationAuthorizationCodeArgs
    | IMsAuthenticationOnBehalfOfArgs
}

export interface IMsAuthenticationArgs {
  azClientId: string
  azTenantId: string
}
export interface IMsAuthenticationClientCredentialArgs extends IMsAuthenticationArgs {
  azClientSecret: string
  credentialManifest: string
}
export interface IMsAuthenticationUsernamePasswordArgs extends IMsAuthenticationArgs {
  password: string,
  scopes: string[],
  username: string
}

export interface IMsAuthenticationAuthorizationCodeArgs extends IMsAuthenticationArgs {
  redirectUri: string
  code: string
}

export interface IMsAuthenticationOnBehalfOfArgs extends IMsAuthenticationArgs {
  oboAssertion: string
}

export interface IMsAuthenticationSilentFlowArgs extends IMsAuthenticationArgs {
  account: AccountInfo
}

export enum events {
  AUTHENTICATED = 'authenticated',
}

export enum MsAuthenticationTypeEnum {
  ClientCredential= 'ClientCredential',
  AuthorizationCode = 'AuthorizationCode',
  UsernamePassword = 'UsernamePassword',
  BehalfOf = 'BehalfOf',
  Silent = 'Silent',
}

export type IRequiredContext = IAgentContext<Record<string, never>>
export type IMsAuthenticationResponse = String
