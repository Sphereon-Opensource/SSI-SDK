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
  IUpdateConnectionArgs,
} from '../types/IConnectionManager'
import { IConnection, IConnectionParty } from '@sphereon/ssi-sdk-data-store-common'

/**
 * {@inheritDoc IConnectionManager}
 */
export class ConnectionManager implements IAgentPlugin {
  readonly schema = schema.IConnectionManager
  readonly methods: IConnectionManager = {
    cmGetParty: this.cmGetParty.bind(this),
    cmGetParties: this.cmGetParties.bind(this),
    cmAddParty: this.cmAddParty.bind(this),
    cmUpdateParty: this.cmUpdateParty.bind(this),
    cmRemoveParty: this.cmRemoveParty.bind(this),
    cmGetConnection: this.cmGetConnection.bind(this),
    cmGetConnections: this.cmGetConnections.bind(this),
    cmAddConnection: this.cmAddConnection.bind(this),
    cmUpdateConnection: this.cmUpdateConnection.bind(this),
    cmRemoveConnection: this.cmRemoveConnection.bind(this),
  }

  private readonly store: AbstractConnectionStore

  constructor(options: { store: AbstractConnectionStore }) {
    this.store = options.store
  }

  /** {@inheritDoc IConnectionManager.cmGetParty} */
  private async cmGetParty(args: IGetPartyArgs, context: IRequiredContext): Promise<IConnectionParty> {
    return this.store.getParty(args)
  }

  /** {@inheritDoc IConnectionManager.cmGetParties} */
  private async cmGetParties(): Promise<Array<IConnectionParty>> {
    return this.store.getParties()
  }

  /** {@inheritDoc IConnectionManager.cmAddParty} */
  private async cmAddParty(args: IAddPartyArgs, context: IRequiredContext): Promise<IConnectionParty> {
    return this.store.addParty(args)
  }

  /** {@inheritDoc IConnectionManager.cmUpdateParty} */
  private async cmUpdateParty(args: IUpdatePartyArgs, context: IRequiredContext): Promise<IConnectionParty> {
    return this.store.updateParty(args)
  }

  /** {@inheritDoc IConnectionManager.cmRemoveParty} */
  private async cmRemoveParty(args: IRemovePartyArgs, context: IRequiredContext): Promise<boolean> {
    return this.store.removeParty(args).then(() => true)
  }

  /** {@inheritDoc IConnectionManager.cmGetConnection} */
  private async cmGetConnection(args: IGetConnectionArgs, context: IRequiredContext): Promise<IConnection> {
    return this.store.getConnection(args)
  }

  /** {@inheritDoc IConnectionManager.cmGetConnections} */
  private async cmGetConnections(args: IGetConnectionsArgs, context: IRequiredContext): Promise<Array<IConnection>> {
    return this.store.getConnections(args)
  }

  /** {@inheritDoc IConnectionManager.cmAddConnection} */
  private async cmAddConnection(args: IAddConnectionArgs, context: IRequiredContext): Promise<IConnection> {
    return this.store.addConnection(args)
  }

  /** {@inheritDoc IConnectionManager.cmUpdateConnection} */
  private async cmUpdateConnection(args: IUpdateConnectionArgs, context: IRequiredContext): Promise<IConnection> {
    return this.store.updateConnection(args)
  }

  /** {@inheritDoc IConnectionManager.cmRemoveConnection} */
  private async cmRemoveConnection(args: IRemoveConnectionArgs, context: IRequiredContext): Promise<boolean> {
    return this.store.removeConnection(args).then(() => true)
  }
}
