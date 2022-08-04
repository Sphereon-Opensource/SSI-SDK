import { IIdentifier } from '@veramo/core'
export enum BaseConfigType {
  OPENID = 'OpenIdConfig',
  DIDAUTH = 'DidAuthConfig',
}

export interface IConnectionParty {
  id: string
  name: string
  connections: Array<IConnection>
}

export interface IBasicConnectionParty {
  name: string
  connections: Array<IBasicConnection>
}

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
  identifier: IBasicConnectionIdentifier
  config: BasicConnectionConfig
  metadata?: Array<IBasicConnectionMetadataItem>
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
export declare type IBasicConnectionIdentifier = Omit<IConnectionIdentifier, 'id'>

export interface IConnectionMetadataItem {
  id: string
  label: string
  value: string
}
export declare type IBasicConnectionMetadataItem = Omit<IConnectionMetadataItem, 'id'>

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
export declare type IBasicOpenIdConfig = Omit<IOpenIdConfig, 'id'>

export interface IDidAuthConfig {
  id: string
  identifier: IIdentifier
  stateId: string
  redirectUrl: string
  sessionId: string
}
export declare type IBasicDidAuthConfig = Omit<IDidAuthConfig, 'id'>

export declare type ConnectionConfig = IOpenIdConfig | IDidAuthConfig
export declare type BasicConnectionConfig = IBasicDidAuthConfig | IBasicOpenIdConfig
