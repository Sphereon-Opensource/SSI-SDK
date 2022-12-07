import { IIdentifier } from '@veramo/core'
export enum BaseConfigType {
  OPENID = 'OpenIdConfig',
  DIDAUTH = 'DidAuthConfig',
}

export interface IConnectionParty {
  id: string
  name: string
  alias: string
  uri: string
  connections: Array<IConnection>
}
export declare type BasicConnectionParty = Omit<IConnectionParty, 'id'>;

export enum ConnectionTypeEnum {
  OPENID = 'openid',
  DIDAUTH = 'didauth',
  SIOPV2_OIDC4VP = 'siopv2+oidc4vp',
}

export interface IConnection {
  id: string
  type: ConnectionTypeEnum
  identifier: IConnectionIdentifier
  config: ConnectionConfig
  metadata?: Array<IConnectionMetadataItem>
  createdAt: Date
  lastUpdatedAt: Date
}

export interface IBasicConnection {
  type: ConnectionTypeEnum
  identifier: BasicConnectionIdentifier
  config: BasicConnectionConfig
  metadata?: Array<BasicConnectionMetadataItem>
}

export enum ConnectionIdentifierEnum {
  DID = 'did',
  URL = 'url',
}

export interface IConnectionIdentifier {
  id: string
  type: ConnectionIdentifierEnum
  correlationId: string
}
export declare type BasicConnectionIdentifier = Omit<IConnectionIdentifier, 'id'>

export interface IConnectionMetadataItem {
  id: string
  label: string
  value: string
}
export declare type BasicConnectionMetadataItem = Omit<IConnectionMetadataItem, 'id'>

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
