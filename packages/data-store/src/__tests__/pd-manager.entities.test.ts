import { DataSources } from '@sphereon/ssi-sdk.agent-config'
import { DataSource } from 'typeorm'
import { PresentationDefinitionItemEntity } from '../entities/presentationDefinition/PresentationDefinitionItemEntity'
import { DataStorePresentationDefinitionMigrations } from '../migrations'
import { DataStorePresentationDefinitionEntities } from '../index'

describe('PresentationDefinitionItemEntity tests', (): void => {
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

  it('should create and retrieve PresentationDefinitionItemEntity', async (): Promise<void> => {
    const repository = dbConnection.getRepository(PresentationDefinitionItemEntity)
    const entity = new PresentationDefinitionItemEntity()
    entity.definitionId = 'definition1'
    entity.version = '1.0'
    entity.definitionPayload = JSON.stringify({ id: 'definition1', input_descriptors: [] })

    const savedEntity = await repository.save(entity)
    expect(savedEntity).toBeDefined()
    expect(savedEntity.id).toBeDefined()

    const retrievedEntity = await repository.findOneBy({ id: savedEntity.id })
    expect(retrievedEntity).toBeDefined()
    expect(retrievedEntity!.definitionId).toEqual('definition1')
  })

  it('should update PresentationDefinitionItemEntity', async (): Promise<void> => {
    const repository = dbConnection.getRepository(PresentationDefinitionItemEntity)
    const entity = new PresentationDefinitionItemEntity()
    entity.definitionId = 'definition1'
    entity.version = '1.0'
    entity.definitionPayload = JSON.stringify({ id: 'definition1', input_descriptors: [] })

    const savedEntity = await repository.save(entity)
    expect(savedEntity).toBeDefined()

    savedEntity.version = '1.1'
    const updatedEntity = await repository.save(savedEntity)
    expect(updatedEntity).toBeDefined()
    expect(updatedEntity.version).toEqual('1.1')
  })

  it('should delete PresentationDefinitionItemEntity', async (): Promise<void> => {
    const repository = dbConnection.getRepository(PresentationDefinitionItemEntity)
    const entity = new PresentationDefinitionItemEntity()
    entity.definitionId = 'definition1'
    entity.version = '1.0'
    entity.definitionPayload = JSON.stringify({ id: 'definition1', input_descriptors: [] })

    const savedEntity = await repository.save(entity)
    expect(savedEntity).toBeDefined()

    await repository.delete(savedEntity.id)
    const retrievedEntity = await repository.findOneBy({ id: savedEntity.id })
    expect(retrievedEntity).toBeNull()
  })
})
