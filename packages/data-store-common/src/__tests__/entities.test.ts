import { Connection, createConnection } from 'typeorm'
import { ConnectionIdentifierEnum, ConnectionTypeEnum, DataStoreConnectionEntities, DataStoreMigrations } from '../index'
import { PartyEntity } from '../entities/connection/PartyEntity'
import { OpenIdConfigEntity } from '../entities/connection/OpenIdConfigEntity'
import { DidAuthConfigEntity } from '../entities/connection/DidAuthConfigEntity'
import { ConnectionEntity, connectionEntityFrom } from '../entities/connection/ConnectionEntity'

describe('Database entities test', () => {
  let dbConnection: Connection
  const connection_relations = ['config', 'metadata', 'identifier']

  beforeEach(async () => {
    dbConnection = await createConnection({
      type: 'sqlite',
      database: ':memory:',
      // logging: 'all',
      migrationsRun: false,
      migrations: DataStoreMigrations,
      synchronize: false,
      entities: DataStoreConnectionEntities,
    })
    await dbConnection.runMigrations()
    expect(await dbConnection.showMigrations()).toBeFalsy()
  })

  afterEach(async () => {
    await dbConnection.close()
  })

  it('Should save party to database', async () => {
    const party = new PartyEntity()
    party.name = 'test_name'

    await dbConnection.getRepository(PartyEntity).save(party)

    const fromDb = await dbConnection.getRepository(PartyEntity).findOne({
      where: { name: party.name },
    })
    expect(fromDb?.name).toEqual(party.name)
  })

  it('Should enforce unique name for a party', async () => {
    const partyName = 'non_unique_name'
    const party = new PartyEntity()
    party.name = partyName
    await dbConnection.getRepository(PartyEntity).save(party)

    const party2 = new PartyEntity()
    party2.name = partyName
    await expect(dbConnection.getRepository(PartyEntity).save(party2)).rejects.toThrowError('SQLITE_CONSTRAINT: UNIQUE constraint failed: Party.name')
  })

  it('Should save connection with openid config to database', async () => {
    const correlationId = 'https://example.com'
    const connection = {
      type: ConnectionTypeEnum.OPENID,
      identifier: {
        type: ConnectionIdentifierEnum.URL,
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
        type: ConnectionIdentifierEnum.URL,
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
