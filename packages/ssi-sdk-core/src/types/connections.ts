import { IIdentifier } from '@veramo/core';

export interface IConnectionParty {
  id?: string
  name: string
  connections: Array<IConnection>
}

export enum ConnectionTypeEnum {
  OPENID = 'openid',
  DIDAUTH = 'didauth'
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

export enum ConnectionIdentifierEnum {
  DID = 'did',
  URL = 'url'
}

export interface IConnectionIdentifier {
  id?: string
  type: ConnectionIdentifierEnum
  correlationId: string
}

export interface IConnectionMetadataItem {
  id?: string
  label: string
  value: string
}

export interface IOpenIdConfig {
  id?: string
  clientId: string
  clientSecret: string
  scopes: Array<string>
  issuer: string
  redirectUrl: string
  dangerouslyAllowInsecureHttpRequests: boolean
  clientAuthMethod: 'basic' | 'post' | undefined
}

export interface IDidAuthConfig {
  id?: string
  identifier: IIdentifier
  stateId: string
  redirectUrl: string
  sessionId: string
}

export declare type ConnectionConfig = IOpenIdConfig | IDidAuthConfig
