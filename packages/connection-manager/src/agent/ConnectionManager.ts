import { IAgentPlugin } from '@veramo/core'
import { schema } from '../index'
import { AbstractConnectionStore } from '../store/AbstractConnectionStore'
import {
  IAddPartyArgs,
  IGetPartyArgs,
  IUpdatePartyArgs,
  IGetConnectionsArgs,
  IRemovePartyArgs,
  IAddConnectionArgs,
  IConnectionManager,
  IGetConnectionArgs,
  IRemoveConnectionArgs,
  IRequiredContext,
  IUpdateConnectionArgs
} from '../types/IConnectionManager'
import {
  IConnection,
  IConnectionParty
} from '@sphereon/ssi-sdk-core'

/**
 * {@inheritDoc IConnectionManager}
 */
export class ConnectionManager implements IAgentPlugin {
  readonly schema = schema.IConnectionManager
  readonly methods: IConnectionManager = {
    getParty: this.getParty.bind(this),
    getParties: this.getParties.bind(this),
    addParty: this.addParty.bind(this),
    updateParty: this.updateParty.bind(this),
    removeParty: this.removeParty.bind(this),
    getConnection: this.getConnection.bind(this),
    getConnections: this.getConnections.bind(this),
    addConnection: this.addConnection.bind(this),
    updateConnection: this.updateConnection.bind(this),
    removeConnection: this.removeConnection.bind(this),
  }

  private readonly store: AbstractConnectionStore;

  constructor(options: { store: AbstractConnectionStore }) {
    this.store = options.store
  }

  /** {@inheritDoc IConnectionManager.getParty} */
  private async getParty(args: IGetPartyArgs, context: IRequiredContext): Promise<IConnectionParty> {
    return this.store.getParty(args.partyId)
      .then(party => party)
  }

  /** {@inheritDoc IConnectionManager.getParties} */
  private async getParties(): Promise<Array<IConnectionParty>> {
    return this.store.getParties()
      .then(parties => parties)
  }

  /** {@inheritDoc IConnectionManager.addParty} */
  private async addParty(args: IAddPartyArgs, context: IRequiredContext): Promise<IConnectionParty> {
    return this.store.addParty(args.name)
      .then(party => party)
  }

  /** {@inheritDoc IConnectionManager.updateParty} */
  private async updateParty(args: IUpdatePartyArgs, context: IRequiredContext): Promise<IConnectionParty> {
    return this.store.updateParty(args.party)
      .then(connection => connection)
  }

  /** {@inheritDoc IConnectionManager.removeParty} */
  private async removeParty(args: IRemovePartyArgs, context: IRequiredContext): Promise<boolean> {
    return this.store.removeParty(args.partyId).then(() => true)
  }

  /** {@inheritDoc IConnectionManager.getConnection} */
  private async getConnection(args: IGetConnectionArgs, context: IRequiredContext): Promise<IConnection> {
    return this.store.getConnection(args.connectionId)
      .then(connection => connection)
  }

  /** {@inheritDoc IConnectionManager.getConnections} */
  private async getConnections(args: IGetConnectionsArgs, context: IRequiredContext): Promise<Array<IConnection>> {
    return this.store.getConnections(args.partyId)
      .then(connections => connections)
  }

  /** {@inheritDoc IConnectionManager.addConnection} */
  private async addConnection(args: IAddConnectionArgs, context: IRequiredContext): Promise<IConnection> {
    return this.store.addConnection(args.partyId, args.connection)
      .then(connection => connection)
  }

  /** {@inheritDoc IConnectionManager.updateConnection} */
  private async updateConnection(args: IUpdateConnectionArgs, context: IRequiredContext): Promise<IConnection> {
    return this.store.updateConnection(args.connection)
      .then(connection => connection)
  }

  /** {@inheritDoc IConnectionManager.removeConnection} */
  private async removeConnection(args: IRemoveConnectionArgs, context: IRequiredContext): Promise<boolean> {
    return this.store.removeConnection(args.connectionId).then(() => true)
  }
}
