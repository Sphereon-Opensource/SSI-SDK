import { RequestContext } from '../http/http'
export interface SecurityAuthentication {
  getName(): string
  applySecurityAuthentication(context: RequestContext): void | Promise<void>
}
export interface TokenProvider {
  getToken(): Promise<string> | string
}
export declare class ApiKeySchemeAuthentication implements SecurityAuthentication {
  private apiKey
  constructor(apiKey: string)
  getName(): string
  applySecurityAuthentication(context: RequestContext): void
}
export type AuthMethods = {
  default?: SecurityAuthentication
  apiKeyScheme?: SecurityAuthentication
}
export type ApiKeyConfiguration = string
export type HttpBasicConfiguration = {
  username: string
  password: string
}
export type HttpBearerConfiguration = {
  tokenProvider: TokenProvider
}
export type OAuth2Configuration = {
  accessToken: string
}
export type HttpSignatureConfiguration = unknown
export type AuthMethodsConfiguration = {
  default?: SecurityAuthentication
  apiKeyScheme?: ApiKeyConfiguration
}
export declare function configureAuthMethods(config: AuthMethodsConfiguration | undefined): AuthMethods
