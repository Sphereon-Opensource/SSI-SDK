import Debug from 'debug'
import { Connection } from 'typeorm'
import { OrPromise } from '@veramo/utils'
import {
  BaseConfigEntity,
  BasicConnectionConfig,
  ConnectionConfig,
  ConnectionEntity,
  connectionEntityFrom,
  ConnectionIdentifierEntity,
  ConnectionTypeEnum,
  DidAuthConfigEntity,
  IConnection,
  IConnectionIdentifier,
  IConnectionMetadataItem,
  IConnectionParty,
  IDidAuthConfig,
  IOpenIdConfig,
  MetadataItemEntity,
  OpenIdConfigEntity,
  PartyEntity,
  partyEntityFrom,
} from '@sphereon/ssi-sdk-data-store-common'
import {
  AbstractConnectionStore,
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
} from '@sphereon/ssi-sdk-connection-manager'

const debug = Debug('sphereon:typeorm:connection-store')

export class ConnectionStore extends AbstractConnectionStore {
  private readonly party_relations = ['connections', 'connections.config', 'connections.metadata', 'connections.identifier']
  private readonly connection_relations = ['config', 'metadata', 'identifier']

  private dbConnection: OrPromise<Connection>

  constructor(dbConnection: OrPromise<Connection>) {
    super()
    this.dbConnection = dbConnection
  }

  getParty = async ({ partyId }: IGetPartyArgs): Promise<IConnectionParty> => {
    const result = await (await this.dbConnection).getRepository(PartyEntity).findOne({
      where: { id: partyId },
      relations: this.party_relations,
    })

    if (!result) {
      return Promise.reject(Error(`No party found for id: ${partyId}`))
    }

    return this.partyFrom(result)
  }

  getParties = async ({ filter }: IGetPartiesArgs): Promise<Array<IConnectionParty>> => {
    const result = await (await this.dbConnection).getRepository(PartyEntity).find({
      ...(filter && { where: filter }),
      relations: this.party_relations,
    })

    return result.map((party) => this.partyFrom(party))
  }

  addParty = async ({ name, alias, uri }: IAddPartyArgs): Promise<IConnectionParty> => {
    if (!name || /^\s*$/.test(name)) {
      return Promise.reject(Error('Blank names are not allowed'))
    }

    if (!alias || /^\s*$/.test(alias)) {
      return Promise.reject(Error('Blank aliases are not allowed'))
    }

    const result = await (await this.dbConnection).getRepository(PartyEntity).findOne({
      where: [{ name }, { alias }],
      relations: this.party_relations,
    })

    if (result) {
      return Promise.reject(Error(`Duplicate names or aliases are not allowed. Name: ${name}, Alias: ${alias}`))
    }

    const partyEntity = partyEntityFrom({ name, alias, uri })
    debug('Adding party', name)
    const createdResult = await (await this.dbConnection).getRepository(PartyEntity).save(partyEntity)

    return this.partyFrom(createdResult)
  }

  updateParty = async ({ party }: IUpdatePartyArgs): Promise<IConnectionParty> => {
    const result = await (await this.dbConnection).getRepository(PartyEntity).findOne({
      where: { id: party.id },
      relations: this.party_relations,
    })

    if (!result) {
      return Promise.reject(Error(`No party found for id: ${party.id}`))
    }

    debug('Updating party', party)
    const updatedResult = await (await this.dbConnection).getRepository(PartyEntity).save(party, { transaction: true })

    return this.partyFrom(updatedResult)
  }

  removeParty = async ({ partyId }: IRemovePartyArgs): Promise<void> => {
    debug('Removing party', partyId)
    ;(await this.dbConnection)
      .getRepository(PartyEntity)
      .delete({ id: partyId })
      .catch((error) => Promise.reject(Error(`Unable to remove party with id: ${partyId}. ${error}`)))
  }

  getConnection = async ({ connectionId }: IGetConnectionArgs): Promise<IConnection> => {
    const result = await (await this.dbConnection).getRepository(ConnectionEntity).findOne({
      where: { id: connectionId },
      relations: this.connection_relations,
    })

    if (!result) {
      return Promise.reject(Error(`No connection found for id: ${connectionId}`))
    }

    return this.connectionFrom(result)
  }

  getConnections = async ({ partyId }: IGetConnectionsArgs): Promise<Array<IConnection>> => {
    const result = await (await this.dbConnection).getRepository(PartyEntity).findOne({
      where: { id: partyId },
      relations: this.party_relations,
    })

    if (!result) {
      return Promise.reject(Error(`No party found for id: ${partyId}`))
    }

    return result.connections.map((connection) => this.connectionFrom(connection))
  }

  addConnection = async ({ connection, partyId }: IAddConnectionArgs): Promise<IConnection> => {
    const party = await (await this.dbConnection).getRepository(PartyEntity).findOne({
      where: { id: partyId },
      relations: this.party_relations,
    })

    if (!party) {
      return Promise.reject(Error(`No party found for id: ${partyId}`))
    }

    if (!this.hasCorrectConfig(connection.type, connection.config)) {
      return Promise.reject(Error(`Connection type ${connection.type}, does not match for provided config`))
    }

    const connectionEntity = connectionEntityFrom(connection)
    connectionEntity.party = party
    debug('Adding connection', connection)
    const result = await (await this.dbConnection).getRepository(ConnectionEntity).save(connectionEntity, {
      transaction: true,
    })

    return this.connectionFrom(result)
  }

  updateConnection = async ({ connection }: IUpdateConnectionArgs): Promise<IConnection> => {
    const result = await (await this.dbConnection).getRepository(ConnectionEntity).findOne({
      where: { id: connection.id },
      relations: this.connection_relations,
    })

    if (!result) {
      return Promise.reject(Error(`No connection found for id: ${connection.id}`))
    }

    if (!this.hasCorrectConfig(connection.type, connection.config)) {
      return Promise.reject(Error(`Connection type ${connection.type}, does not match for provided config`))
    }

    debug('Updating connection', connection)
    const updatedResult = await (await this.dbConnection).getRepository(ConnectionEntity).save(connection, { transaction: true })

    return this.connectionFrom(updatedResult)
  }

  removeConnection = async ({ connectionId }: IRemoveConnectionArgs): Promise<void> => {
    const connection = await (await this.dbConnection).getRepository(ConnectionEntity).findOne({
      where: { id: connectionId },
      relations: this.connection_relations,
    })

    if (!connection) {
      return Promise.reject(Error(`No connection found for id: ${connectionId}`))
    }

    debug('Removing connection', connectionId)
    ;(await this.dbConnection)
      .getRepository(ConnectionEntity)
      .delete({ id: connectionId })
      .catch((error) => Promise.reject(Error(`Unable to remove connection with id: ${connectionId}. ${error}`)))
  }

  private partyFrom = (party: PartyEntity): IConnectionParty => {
    return {
      id: party.id,
      name: party.name,
      alias: party.alias,
      uri: party.uri,
      connections: party.connections ? party.connections.map((connection: ConnectionEntity) => this.connectionFrom(connection)) : [],
    }
  }

  private connectionFrom = (connection: ConnectionEntity): IConnection => {
    return {
      id: connection.id,
      type: connection.type,
      identifier: this.connectionIdentifierFrom(connection.identifier),
      config: this.configFrom(connection.type, connection.config),
      metadata: connection.metadata ? connection.metadata.map((item: MetadataItemEntity) => this.metadataItemFrom(item)) : [],
      createdAt: connection.createdAt,
      lastUpdatedAt: connection.createdAt,
    }
  }

  private configFrom = (type: ConnectionTypeEnum, config: BaseConfigEntity): ConnectionConfig => {
    switch (type) {
      case ConnectionTypeEnum.OPENID:
        return {
          id: (config as OpenIdConfigEntity).id,
          clientId: (config as OpenIdConfigEntity).clientId,
          clientSecret: (config as OpenIdConfigEntity).clientSecret,
          scopes: (config as OpenIdConfigEntity).scopes,
          issuer: (config as OpenIdConfigEntity).issuer!, // TODO fixme
          redirectUrl: (config as OpenIdConfigEntity).redirectUrl,
          dangerouslyAllowInsecureHttpRequests: (config as OpenIdConfigEntity).dangerouslyAllowInsecureHttpRequests,
          clientAuthMethod: (config as OpenIdConfigEntity).clientAuthMethod,
        }
      case ConnectionTypeEnum.DIDAUTH:
        return {
          id: (config as DidAuthConfigEntity).id,
          identifier: { did: (config as DidAuthConfigEntity).identifier, provider: '', keys: [], services: [] },
          stateId: '',
          redirectUrl: (config as DidAuthConfigEntity).redirectUrl,
          sessionId: (config as DidAuthConfigEntity).sessionId,
        }
      default:
        throw new Error('Connection type not supported')
    }
  }

  private hasCorrectConfig(type: ConnectionTypeEnum, config: BasicConnectionConfig): boolean {
    switch (type) {
      case ConnectionTypeEnum.OPENID:
        return this.isOpenIdConfig(config)
      case ConnectionTypeEnum.DIDAUTH:
        return this.isDidAuthConfig(config)
      default:
        throw new Error('Connection type not supported')
    }
  }

  private isOpenIdConfig = (config: BasicConnectionConfig): config is IOpenIdConfig =>
    'clientSecret' in config && 'issuer' in config && 'redirectUrl' in config

  private isDidAuthConfig = (config: BasicConnectionConfig): config is IDidAuthConfig =>
    'identifier' in config && 'redirectUrl' in config && 'sessionId' in config

  private metadataItemFrom = (item: MetadataItemEntity): IConnectionMetadataItem => {
    return {
      id: item.id,
      label: item.label,
      value: item.value,
    }
  }

  private connectionIdentifierFrom = (identifier: ConnectionIdentifierEntity): IConnectionIdentifier => {
    return {
      id: identifier.id,
      type: identifier.type,
      correlationId: identifier.correlationId,
    }
  }
}
