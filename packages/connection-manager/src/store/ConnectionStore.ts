import { Connection } from 'typeorm'
import { BaseConfigEntity } from '../entities/BaseConfigEntity'
import { ConnectionEntity } from '../entities/ConnectionEntity'
import { ConnectionIdentifierEntity } from '../entities/ConnectionIdentifierEntity'
import { DidAuthConfigEntity } from '../entities/DidAuthConfigEntity'
import { MetadataItemEntity } from '../entities/MetadataItemEntity'
import { OpenIdConfigEntity } from '../entities/OpenIdConfigEntity'
import { PartyEntity } from '../entities/PartyEntity'
import { AbstractConnectionStore } from './AbstractConnectionStore'
import {
  ConnectionConfig,
  ConnectionTypeEnum,
  IConnection,
  IDidAuthConfig,
  IOpenIdConfig,
  IConnectionParty,
  IConnectionMetadataItem,
  IConnectionIdentifier
} from '../types/IConnectionManager'

export class ConnectionStore extends AbstractConnectionStore {
  private readonly party_relations = [
    'connections',
    'connections.config',
    'connections.metadata',
    'connections.identifier'
  ]
  private readonly connection_relations = [
    'config',
    'metadata',
    'identifier'
  ]

  constructor(private dbConnection: Promise<Connection>) {
    super()
  }

  getParty = async (partyId: string): Promise<IConnectionParty> => {
    const result = await (await this.dbConnection).getRepository(PartyEntity).findOne({
      where: { id: partyId },
      relations: this.party_relations
    })

    if (!result) {
      return Promise.reject(Error(`No party found for id: ${partyId}`))
    }

    return this.partyFrom(result)
  }

  getParties = async (): Promise<Array<IConnectionParty>> => {
    const result = await (await this.dbConnection).getRepository(PartyEntity).find({
      relations: this.party_relations
    });

    return result.map(party => this.partyFrom(party))
  }

  addParty = async (name: string): Promise<IConnectionParty> => {
    const result = await (await this.dbConnection).getRepository(PartyEntity).findOne({
      where: { name },
      relations: this.party_relations
    })

    if (result) {
      return Promise.reject(Error(`Duplicate names are not allowed. Name: ${name}`))
    }

    const partyEntity = new PartyEntity()
    partyEntity.name = name

    const createdResult = await (await this.dbConnection).getRepository(PartyEntity).save(partyEntity);

    return this.partyFrom(createdResult)
  }

  updateParty = async (party: IConnectionParty): Promise<IConnectionParty> => {
    const result = await (await this.dbConnection).getRepository(PartyEntity).findOne({
      where: { id: party.id },
      relations: this.party_relations
    })

    if (!result) {
      return Promise.reject(Error(`No party found for id: ${party.id}`))
    }

    const updatedResult = await (await this.dbConnection).getRepository(PartyEntity).save(
        party,
        { transaction: true }
    );

    return this.partyFrom(updatedResult)
  }

  removeParty = async (partyId: string): Promise<void> => {
    (await this.dbConnection).getRepository(PartyEntity).delete({ id: partyId })
      .catch(error => Promise.reject(Error(`Unable to remove party with id: ${partyId}. ${error}`)))
  }

  getConnection = async (connectionId: string): Promise<IConnection> => {
    const result = await (await this.dbConnection).getRepository(ConnectionEntity).findOne({
      where: { id: connectionId },
      relations: this.connection_relations
    })

    if (!result) {
      return Promise.reject(Error(`No connection found for id: ${connectionId}`))
    }

    return this.connectionFrom(result)
  }

  getConnections = async (partyId: string): Promise<Array<IConnection>> => {
    const result = await (await this.dbConnection).getRepository(PartyEntity).findOne({
      where: { id: partyId },
      relations: this.party_relations
    })

    if (!result) {
      return Promise.reject(Error(`No party found for id: ${partyId}`))
    }

    return result.connections.map(connection => this.connectionFrom(connection))
  }

  addConnection = async (partyId: string, connection: IConnection): Promise<IConnection> => {
    const party = await (await this.dbConnection).getRepository(PartyEntity).findOne({
      where: { id: partyId },
      relations: this.party_relations
    })

    if (!party) {
      return Promise.reject(Error(`No party found for id: ${partyId}`))
    }

    if (!this.hasCorrectConfig(connection.type, connection.config)) {
      return Promise.reject(Error(`Connection type ${connection.type}, does not match for provided config`))
    }

    const connectionEntity = new ConnectionEntity()
    connectionEntity.party = party
    connectionEntity.type = connection.type
    connectionEntity.identifier = this.connectionIdentifierEntityFrom(connection.identifier)
    connectionEntity.config = this.configEntityFrom(connection.type, connection.config)
    connectionEntity.metadata = connection.metadata ? connection.metadata.map((item: IConnectionMetadataItem) => this.metadataItemEntityFrom(item)) : []

    const result = await (await this.dbConnection).getRepository(ConnectionEntity).save(connectionEntity, {
      transaction: true
    })

    return this.connectionFrom(result)
  }

  updateConnection = async (connection: IConnection): Promise<IConnection> => {
    const result = await (await this.dbConnection).getRepository(ConnectionEntity).findOne({
      where: { id: connection.id },
      relations: this.connection_relations
    })

    if (!result) {
      return Promise.reject(Error(`No connection found for id: ${connection.id}`))
    }

    if (!this.hasCorrectConfig(connection.type, connection.config)) {
      return Promise.reject(Error(`Connection type ${connection.type}, does not match for provided config`))
    }

    const updatedResult = await (await this.dbConnection).getRepository(ConnectionEntity).save(
        connection,
        { transaction: true }
    );

    return this.connectionFrom(updatedResult)
  }

  removeConnection = async (connectionId: string): Promise<void> => {
    const connection = await (await this.dbConnection).getRepository(ConnectionEntity).findOne({
      where: { id: connectionId },
      relations: this.connection_relations
    })

    if (!connection) {
      return Promise.reject(Error(`No connection found for id: ${connectionId}`))
    }

    (await this.dbConnection).getRepository(ConnectionEntity).delete({ id: connectionId })
      .catch(error => Promise.reject(Error(`Unable to remove connection with id: ${connectionId}. ${error}`)))
  }

  private partyFrom = (party: PartyEntity): IConnectionParty => {
    return {
      id: party.id,
      name: party.name,
      connections: party.connections ? party.connections.map((connection: ConnectionEntity) => this.connectionFrom(connection)) : []
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
      lastUpdatedAt: connection.createdAt
    }
  }

  private configFrom = (type: ConnectionTypeEnum, config: BaseConfigEntity): ConnectionConfig => {
    switch(type) {
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
          identifier: (config as DidAuthConfigEntity).identifier,
          redirectUrl: (config as DidAuthConfigEntity).redirectUrl,
          sessionId: (config as DidAuthConfigEntity).sessionId
        }
      default:
        throw new Error('Connection type not supported')
    }
  }

  private configEntityFrom = (type: ConnectionTypeEnum, config: ConnectionConfig): BaseConfigEntity => {
    switch(type) {
      case ConnectionTypeEnum.OPENID:
        return this.openIdConfigEntityFrom(config as IOpenIdConfig)
      case ConnectionTypeEnum.DIDAUTH:
        return this.didAuthConfigEntityFrom(config as IDidAuthConfig)
      default:
        throw new Error('Connection type not supported')
    }
  }

  private openIdConfigEntityFrom = (config: IOpenIdConfig): OpenIdConfigEntity => {
    const openIdConfig = new OpenIdConfigEntity()
    openIdConfig.clientId = config.clientId
    openIdConfig.clientSecret = config.clientSecret
    openIdConfig.scopes = config.scopes
    openIdConfig.issuer = config.issuer
    openIdConfig.redirectUrl = config.redirectUrl
    openIdConfig.dangerouslyAllowInsecureHttpRequests = config.dangerouslyAllowInsecureHttpRequests
    openIdConfig.clientAuthMethod = config.clientAuthMethod

    return openIdConfig
  }

  private didAuthConfigEntityFrom = (config: IDidAuthConfig): DidAuthConfigEntity => {
    const didAuthConfig = new DidAuthConfigEntity()
    didAuthConfig.identifier = config.identifier
    didAuthConfig.redirectUrl = config.redirectUrl
    didAuthConfig.sessionId = config.redirectUrl + config.identifier

    return didAuthConfig
  }

  private hasCorrectConfig(type: ConnectionTypeEnum, config: ConnectionConfig): boolean {
    switch(type) {
      case ConnectionTypeEnum.OPENID:
        return this.isOpenIdConfig(config)
      case ConnectionTypeEnum.DIDAUTH:
        return this.isDidAuthConfig(config)
      default:
        throw new Error('Connection type not supported')
    }
  }

  private isOpenIdConfig = (config: ConnectionConfig): config is IOpenIdConfig =>
    'clientSecret' in config &&
    'issuer' in config &&
    'redirectUrl' in config &&
    'dangerouslyAllowInsecureHttpRequests' in config &&
    'clientAuthMethod' in config

  private isDidAuthConfig = (config: ConnectionConfig): config is IDidAuthConfig =>
      'identifier' in config &&
      'stateId' in config &&
      'redirectUrl' in config &&
      'sessionId' in config

  private metadataItemFrom = (item: MetadataItemEntity): IConnectionMetadataItem => {
    return {
      id: item.id,
      label: item.label,
      value: item.value
    }
  }

  private metadataItemEntityFrom = (item: IConnectionMetadataItem): MetadataItemEntity => {
    const metadataItem = new MetadataItemEntity()
    metadataItem.label = item.label
    metadataItem.value = item.value

    return metadataItem
  }

  private connectionIdentifierFrom = (identifier: ConnectionIdentifierEntity): IConnectionIdentifier => {
    return {
      id: identifier.id,
      type: identifier.type,
      correlationId: identifier.correlationId
    }
  }

  private connectionIdentifierEntityFrom = (identifier: IConnectionIdentifier): ConnectionIdentifierEntity => {
    const identifierEntity = new ConnectionIdentifierEntity()
    identifierEntity.type = identifier.type
    identifierEntity.correlationId = identifier.correlationId

    return identifierEntity
  }

}
