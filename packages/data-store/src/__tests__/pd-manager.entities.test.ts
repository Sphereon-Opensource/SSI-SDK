import { DataSources } from '@sphereon/ssi-sdk.agent-config'
import { DataSource } from 'typeorm'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DcqlQueryItemEntity } from '../entities/presentationDefinition/DcqlQueryItemEntity'
import { DataStorePresentationDefinitionEntities } from '../index'
import { DataStorePresentationDefinitionMigrations } from '../migrations'
import { SAMPLE_DCQL_QUERY_IMPORT } from './pd-manager.store.test'

describe('DcqlQueryItemEntity tests', (): void => {
  let dbConnection: DataSource

  beforeEach(async (): Promise<void> => {
    DataSources.singleInstance().defaultDbType = 'sqlite'
    dbConnection = await new DataSource({
      type: 'sqlite',
      database: ':memory:',
      logging: ['info'],
      synchronize: true,
      migrationsRun: false,
      migrations: DataStorePresentationDefinitionMigrations,
      entities: DataStorePresentationDefinitionEntities,
    }).initialize()
  })

  afterEach(async (): Promise<void> => {
    await dbConnection.destroy()
  })

  it('should create and retrieve DcqlQueryItemEntity', async (): Promise<void> => {
    const repository = dbConnection.getRepository(DcqlQueryItemEntity)
    const entity = new DcqlQueryItemEntity()
    entity.queryId = 'ajax-club'
    entity.version = '1.0'
    entity.query = JSON.stringify(SAMPLE_DCQL_QUERY_IMPORT.query)

    const savedEntity = await repository.save(entity)
    expect(savedEntity).toBeDefined()
    expect(savedEntity.id).toBeDefined()
    expect(savedEntity.query).toBeDefined()

    const retrievedEntity = await repository.findOneBy({ id: savedEntity.id })
    expect(retrievedEntity).toBeDefined()
    expect(retrievedEntity!.query).toBeDefined()
    const parsedDcql = JSON.parse(retrievedEntity!.query)
    expect(parsedDcql.credentials[0].id).toEqual('clubcard-v1')
    expect(parsedDcql.credentials[0].format).toEqual('dc+sd-jwt')
    expect(parsedDcql.credentials[0].meta.vct_values).toContain('clubcard-v1')
    expect(parsedDcql.credentials[0].claims).toHaveLength(4)
  })

  it('should update DcqlQueryItemEntity dcql query', async (): Promise<void> => {
    const repository = dbConnection.getRepository(DcqlQueryItemEntity)
    const entity = new DcqlQueryItemEntity()
    entity.queryId = 'ajax-club'
    entity.version = '1.0'
    entity.query = JSON.stringify(SAMPLE_DCQL_QUERY_IMPORT.query)

    const savedEntity = await repository.save(entity)
    expect(savedEntity).toBeDefined()

    const updatedDcql = {
      credentials: [
        {
          id: 'updated-clubcard',
          format: 'jwt_vc',
          claims: [
            {
              path: ['name'],
            },
          ],
        },
      ],
    }
    savedEntity.query = JSON.stringify(updatedDcql)
    const updatedEntity = await repository.save(savedEntity)
    expect(updatedEntity).toBeDefined()
    expect(JSON.parse(updatedEntity.query).credentials[0].id).toEqual('updated-clubcard')
    expect(JSON.parse(updatedEntity.query).credentials[0].format).toEqual('jwt_vc')
  })
})
