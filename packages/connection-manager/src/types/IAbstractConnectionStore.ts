import { IBasicConnection, IConnection, IConnectionParty } from '@sphereon/ssi-sdk-data-store-common'
import { FindPartyArgs } from './IConnectionManager'

export interface IGetPartyArgs {
  partyId: string
}

export interface IGetPartiesArgs {
  filter?: FindPartyArgs
}

export interface IAddPartyArgs {
  name: string
  alias: string
  uri?: string
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
  connection: IBasicConnection
}

export interface IUpdateConnectionArgs {
  connection: IConnection
}

export interface IRemoveConnectionArgs {
  connectionId: string
}
