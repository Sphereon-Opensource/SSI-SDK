import { IConnection, IConnectionParty } from '@sphereon/ssi-sdk-data-store-common'
import {
  IAddConnectionArgs,
  IAddPartyArgs,
  IGetConnectionArgs,
  IGetConnectionsArgs,
  IGetPartiesArgs,
  IGetPartyArgs,
  IRemoveConnectionArgs,
  IRemovePartyArgs,
  IUpdateConnectionArgs,
  IUpdatePartyArgs,
} from '../types/IAbstractConnectionStore'

export abstract class AbstractConnectionStore {
  abstract getParty(args: IGetPartyArgs): Promise<IConnectionParty>
  abstract getParties(args?: IGetPartiesArgs): Promise<Array<IConnectionParty>>
  abstract addParty(args: IAddPartyArgs): Promise<IConnectionParty>
  abstract updateParty(args: IUpdatePartyArgs): Promise<IConnectionParty>
  abstract removeParty(args: IRemovePartyArgs): Promise<void>
  abstract getConnection(args: IGetConnectionArgs): Promise<IConnection>
  abstract getConnections(args: IGetConnectionsArgs): Promise<Array<IConnection>>
  abstract addConnection(args: IAddConnectionArgs): Promise<IConnection>
  abstract updateConnection(args: IUpdateConnectionArgs): Promise<IConnection>
  abstract removeConnection(args: IRemoveConnectionArgs): Promise<void>
}
