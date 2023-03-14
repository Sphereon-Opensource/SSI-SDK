import { IIdentifier } from '@veramo/core'

export enum BaseConfigType {
  OPENID = 'OpenIdConfig',
  DIDAUTH = 'DidAuthConfig',
}

export enum ConnectionRoleEnum {
  ISSUER = 'issuer',
  VERIFIER = 'verifier',
}

export enum ConnectionTypeEnum {
  OPENID = 'openid',
  DIDAUTH = 'didauth',
  SIOPV2_OIDC4VP = 'siopv2+oidc4vp',
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
  identities: Array<IIdentity>
  createdAt: Date
  lastUpdatedAt: Date
}
export declare type BasicContact = Omit<IContact, 'id' | 'identities' | 'createdAt' | 'lastUpdatedAt'>

export interface IIdentity {
  id: string
  alias: string
  identifier: ICorrelationIdentifier
  connection?: IConnection
  metadata?: Array<IMetadataItem>
  createdAt: Date
  lastUpdatedAt: Date
}
export interface IBasicIdentity {
  alias: string
  identifier: BasicCorrelationIdentifier
  connection?: IBasicConnection
  metadata?: Array<BasicMetadataItem>
}
// export type BasicIdentity = Omit<IIdentity, 'id' | 'connection.id' | 'connection.config.id' | 'createdAt' | 'lastUpdatedAt'> & {
//   identifier: Omit<IIdentity['identifier'], 'id'>
// }

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
// export declare type BasicConnection = Omit<IConnection, 'id' | 'config.id'>

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
