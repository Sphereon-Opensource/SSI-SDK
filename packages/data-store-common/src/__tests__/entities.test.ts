import { DataSource } from 'typeorm'
import {
  CorrelationIdentifierEnum,
  ConnectionTypeEnum,
  DataStoreConnectionEntities,
  DataStoreMigrations,
  partyEntityFrom
} from '../index'
import { PartyEntity } from '../entities/connection/PartyEntity'
import { OpenIdConfigEntity } from '../entities/connection/OpenIdConfigEntity'
import { DidAuthConfigEntity } from '../entities/connection/DidAuthConfigEntity'
import { ConnectionEntity, connectionEntityFrom } from '../entities/connection/ConnectionEntity'

describe('Database entities test', () => {
  let dbConnection: DataSource
  const connection_relations = ['config', 'metadata', 'identifier']

  beforeEach(async () => {
    dbConnection = await new DataSource({
      type: 'sqlite',
      database: ':memory:',
      // logging: 'all',
      migrationsRun: false,
      migrations: DataStoreMigrations,
      synchronize: false,
      entities: DataStoreConnectionEntities,
    }).initialize()
    await dbConnection.runMigrations()
    expect(await dbConnection.showMigrations()).toBeFalsy()
  })

  afterEach(async () => {
    await (await dbConnection).destroy()
  })

  it('Should save party to database', async () => {
    const party = {
      name: 'test_name',
      alias: 'test_alias',
      uri: 'example.com',
      identifier: {
        type: CorrelationIdentifierEnum.URL,
        correlationId: 'example.com'
      }
    }

    const partyEntity: PartyEntity = partyEntityFrom(party)

    await dbConnection.getRepository(PartyEntity).save(partyEntity)

    const fromDb = await dbConnection.getRepository(PartyEntity).findOne({
      where: { name: party.name },
    })
    expect(fromDb?.name).toEqual(party.name)
  })

  it('Should enforce unique name for a party', async () => {
    const partyName = 'non_unique_name'
    const party1 = {
      name: partyName,
      alias: 'unique_alias1',
      uri: 'example.com',
      identifier: {
        type: CorrelationIdentifierEnum.URL,
        correlationId: 'example1.com'
      }
    }
    const party1Entity: PartyEntity = partyEntityFrom(party1)
    await dbConnection.getRepository(PartyEntity).save(party1Entity)

    const party2 = {
      name: partyName,
      alias: 'unique_alias2',
      uri: 'example.com',
      identifier: {
        type: CorrelationIdentifierEnum.URL,
        correlationId: 'example2.com'
      }
    }
    const party2Entity: PartyEntity = partyEntityFrom(party2)
    await expect(dbConnection.getRepository(PartyEntity).save(party2Entity)).rejects.toThrowError('SQLITE_CONSTRAINT: UNIQUE constraint failed: Party.name')
  })

  it('Should enforce unique alias for a party', async () => {
    const partyAlias = 'non_unique_alias'
    const party1 = {
      name: 'unique_name1',
      alias: partyAlias,
      uri: 'example.com',
      identifier: {
        type: CorrelationIdentifierEnum.URL,
        correlationId: 'example1.com'
      }
    }
    const party1Entity: PartyEntity = partyEntityFrom(party1)
    await dbConnection.getRepository(PartyEntity).save(party1Entity)

    const party2 = {
      name: 'unique_name2',
      alias: partyAlias,
      uri: 'example.com',
      identifier: {
        type: CorrelationIdentifierEnum.URL,
        correlationId: 'example2.com'
      }
    }
    const party2Entity: PartyEntity = partyEntityFrom(party2)
    await expect(dbConnection.getRepository(PartyEntity).save(party2Entity)).rejects.toThrowError(
      'SQLITE_CONSTRAINT: UNIQUE constraint failed: Party.alias'
    )
  })

  it('Should enforce unique correlationId for a party', async () => {
    const correlationId = 'non_unique_correlationId'
    const party1 = {
      name: 'unique_name1',
      alias: 'unique_alias1',
      uri: 'example.com',
      identifier: {
        type: CorrelationIdentifierEnum.URL,
        correlationId: correlationId
      }
    }
    const party1Entity: PartyEntity = partyEntityFrom(party1)
    await dbConnection.getRepository(PartyEntity).save(party1Entity)

    const party2 = {
      name: 'unique_name2',
      alias: 'unique_alias2',
      uri: 'example.com',
      identifier: {
        type: CorrelationIdentifierEnum.URL,
        correlationId: correlationId
      }
    }
    const party2Entity: PartyEntity = partyEntityFrom(party2)
    await expect(dbConnection.getRepository(PartyEntity).save(party2Entity)).rejects.toThrowError('SQLITE_CONSTRAINT: UNIQUE constraint failed: PartyIdentifier.correlation_id')
  })

  it('Should save connection with openid config to database', async () => {
    const correlationId = 'https://example.com'
    const connection = {
      type: ConnectionTypeEnum.OPENID,
      identifier: {
        type: CorrelationIdentifierEnum.URL,
        correlationId,
      },
      config: {
        clientId: '138d7bf8-c930-4c6e-b928-97d3a4928b01',
        clientSecret: '03b3955f-d020-4f2a-8a27-4e452d4e27a0',
        scopes: ['auth'],
        issuer: 'https://example.com/app-test',
        redirectUrl: 'app:/callback',
        dangerouslyAllowInsecureHttpRequests: true,
        clientAuthMethod: 'post' as const,
      },
      metadata: [
        {
          label: 'Authorization URL',
          value: correlationId,
        },
        {
          label: 'Scope',
          value: 'Authorization',
        },
      ],
    }
    const connectionEntity = connectionEntityFrom(connection)
    await dbConnection.getRepository(ConnectionEntity).save(connectionEntity, {
      transaction: true,
    })

    const fromDb = await dbConnection.getRepository(ConnectionEntity).findOne({
      where: { type: connection.type },
      relations: connection_relations,
    })

    expect(fromDb?.type).toEqual(connection.type)
    expect(fromDb?.identifier.correlationId).toEqual(correlationId)
    expect((fromDb?.config as OpenIdConfigEntity).clientId).toEqual(connection.config.clientId)
    expect(fromDb?.metadata.length).toEqual(2)
    expect(fromDb?.metadata[0]?.value).toEqual(correlationId)
  })

  it('Should save connection with didauth config to database', async () => {
    const correlationId = 'https://example.com'
    const connection = {
      type: ConnectionTypeEnum.DIDAUTH,
      identifier: {
        type: CorrelationIdentifierEnum.URL,
        correlationId,
      },
      config: {
        identifier: {
          did: 'did:test:138d7bf8-c930-4c6e-b928-97d3a4928b01',
          provider: 'test_provider',
          keys: [],
          services: [],
        },
        redirectUrl: 'https://example.com',
        stateId: 'e91f3510-5ce9-42ee-83b7-fa68ff323d27',
        sessionId: 'https://example.com/did:test:138d7bf8-c930-4c6e-b928-97d3a4928b01',
      },
      metadata: [
        {
          label: 'Authorization URL',
          value: correlationId,
        },
        {
          label: 'Scope',
          value: 'Authorization',
        },
      ],
    }
    const connectionEntity = connectionEntityFrom(connection)
    await dbConnection.getRepository(ConnectionEntity).save(connectionEntity, {
      transaction: true,
    })

    const fromDb = await dbConnection.getRepository(ConnectionEntity).findOne({
      where: { type: connection.type },
      relations: connection_relations,
    })

    expect(fromDb?.type).toEqual(connection.type)
    expect(fromDb?.identifier.correlationId).toEqual(correlationId)
    expect((fromDb?.config as DidAuthConfigEntity).identifier).toEqual(connection.config.identifier.did)
    expect(fromDb?.metadata.length).toEqual(2)
    expect(fromDb?.metadata[0]?.value).toEqual(correlationId)
  })
})
