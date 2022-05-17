import {
  IAgentContext,
  IPluginMethodMap
} from '@veramo/core'
import {
  IConnection,
  IConnectionParty
} from '@sphereon/ssi-sdk-core'

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

export type IRequiredContext = IAgentContext<never>
