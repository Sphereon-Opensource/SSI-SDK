import {
  IAgentContext,
  IPluginMethodMap
} from '@veramo/core'

export interface IConnectionManager extends IPluginMethodMap {
  getParty(args: IGetPartyArgs, context: IRequiredContext): Promise<IConnectionParty>
  getParties(): Promise<Array<IConnectionParty>>
  addParty(args: IAddPartyArgs, context: IRequiredContext): Promise<IConnectionParty>
  updateParty(args: IUpdatePartyArgs, context: IRequiredContext): Promise<IConnectionParty>
  removeParty(args: IRemovePartyArgs, context: IRequiredContext): Promise<boolean>
  getConnection(args: IGetConnectionArgs, context: IRequiredContext): Promise<IConnection>
  getConnections(args: IGetConnectionsArgs, context: IRequiredContext): Promise<Array<IConnection>>
  addConnection(args: IAddConnectionArgs, context: IRequiredContext): Promise<IConnection>
  updateConnection(args: IUpdateConnectionArgs, context: IRequiredContext): Promise<IConnection>
  removeConnection(args: IRemoveConnectionArgs, context: IRequiredContext): Promise<boolean>
}

export interface IGetPartyArgs {
  partyId: string
}

export interface IAddPartyArgs {
  name: string
}

export interface IUpdatePartyArgs {
  party: IConnectionParty
}

export interface IRemovePartyArgs {
  partyId: string
}

export interface IGetConnectionArgs {
  connectionId: string
}

export interface IGetConnectionsArgs {
  partyId: string
}

export interface IAddConnectionArgs {
  partyId: string
  connection: Omit<IConnection, 'id' | 'createdAt' | 'lastUpdatedAt' | 'config.id' | 'identifier.id'>
}

export interface IUpdateConnectionArgs {
  connection: IConnection
}

export interface IRemoveConnectionArgs {
  connectionId: string
}

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
  identifier: string
  redirectUrl: string
  sessionId: string
}

export declare type ConnectionConfig = IOpenIdConfig | IDidAuthConfig

export type IRequiredContext = IAgentContext<never>
