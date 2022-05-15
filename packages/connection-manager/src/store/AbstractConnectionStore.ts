import {
  IConnection,
  IConnectionParty
} from '../types/IConnectionManager'

export abstract class AbstractConnectionStore {
  abstract getParty(partyId: string): Promise<IConnectionParty>
  abstract getParties(): Promise<Array<IConnectionParty>>
  abstract addParty(name: string): Promise<IConnectionParty>
  abstract updateParty(party: IConnectionParty): Promise<IConnectionParty>
  abstract removeParty(partyId: string): Promise<void>
  abstract getConnection(connectionId: string): Promise<IConnection>
  abstract getConnections(partyId: string): Promise<Array<IConnection>>
  abstract addConnection(partyId: string, connection: Omit<IConnection, 'id' | 'createdAt' | 'lastUpdatedAt' | 'config.id' | 'identifier.id'>): Promise<IConnection>
  abstract updateConnection(connection: IConnection): Promise<IConnection>
  abstract removeConnection(connectionId: string): Promise<void>
}
