import { IIdentifier } from '@veramo/core'

export enum IdentityRoleEnum {
  ISSUER = 'issuer',
  VERIFIER = 'verifier',
}

export enum ConnectionTypeEnum {
  OPENID_CONNECT = 'OIDC',
  SIOPv2 = 'SIOPv2',
  SIOPv2_OpenID4VP = 'SIOPv2+OpenID4VP',
}

export enum CorrelationIdentifierEnum {
  DID = 'did',
  URL = 'url',
}

export interface IContact {
  id: string
  name: string
  alias: string
  uri?: string
  roles: Array<IdentityRoleEnum>
  identities: Array<IIdentity>
  createdAt: Date
  lastUpdatedAt: Date
}
export interface IBasicContact {
  name: string
  alias: string
  uri?: string
  identities?: Array<IBasicIdentity>
}

export interface IIdentity {
  id: string
  alias: string
  roles: Array<IdentityRoleEnum>
  identifier: ICorrelationIdentifier
  connection?: IConnection
  metadata?: Array<IMetadataItem>
  createdAt: Date
  lastUpdatedAt: Date
}
export interface IBasicIdentity {
  alias: string
  roles: Array<IdentityRoleEnum>
  identifier: BasicCorrelationIdentifier
  connection?: IBasicConnection
  metadata?: Array<BasicMetadataItem>
}

export interface IMetadataItem {
  id: string
  label: string
  value: string
}
export declare type BasicMetadataItem = Omit<IMetadataItem, 'id'>

export interface ICorrelationIdentifier {
  id: string
  type: CorrelationIdentifierEnum
  correlationId: string
}
export declare type BasicCorrelationIdentifier = Omit<ICorrelationIdentifier, 'id'>

export interface IConnection {
  id: string
  type: ConnectionTypeEnum
  config: ConnectionConfig
}
export interface IBasicConnection {
  type: ConnectionTypeEnum
  config: BasicConnectionConfig
}

export interface IOpenIdConfig {
  id: string
  clientId: string
  clientSecret: string
  scopes: Array<string>
  issuer: string
  redirectUrl: string
  dangerouslyAllowInsecureHttpRequests: boolean
  clientAuthMethod: 'basic' | 'post' | undefined
}
export declare type BasicOpenIdConfig = Omit<IOpenIdConfig, 'id'>

export interface IDidAuthConfig {
  id: string
  identifier: IIdentifier
  stateId: string
  redirectUrl: string
  sessionId: string
}
export declare type BasicDidAuthConfig = Omit<IDidAuthConfig, 'id'>

export declare type ConnectionConfig = IOpenIdConfig | IDidAuthConfig
export declare type BasicConnectionConfig = BasicDidAuthConfig | BasicOpenIdConfig
