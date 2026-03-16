import { DataSources } from '@sphereon/ssi-sdk.agent-config'
import { DataSource } from 'typeorm'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MetaDataSetEntity } from '../entities/credentialDesign/MetaDataSetEntity'
import { MetaDataKeyEntity, ValueType } from '../entities/credentialDesign/MetaDataKeyEntity'
import { MetaDataValueEntity } from '../entities/credentialDesign/MetaDataValueEntity'
import { FormStepEntity } from '../entities/credentialDesign/FormStepEntity'
import { SchemaDefinitionEntity } from '../entities/credentialDesign/SchemaDefinitionEntity'
import { CredentialDesignBrandingEntity } from '../entities/credentialDesign/CredentialDesignBrandingEntity'
import { DataStoreEntitiesWithVeramo, DataStoreMigrationsWithVeramo } from '../index'

describe('Credential Design entities tests', (): void => {
  let dbConnection: DataSource

  beforeEach(async (): Promise<void> => {
    DataSources.singleInstance().defaultDbType = 'sqlite'
    dbConnection = await new DataSource({
      type: 'sqlite',
      database: ':memory:',
      logging: ['info'],
      migrationsRun: false,
      migrations: DataStoreMigrationsWithVeramo,
      synchronize: false,
      entities: DataStoreEntitiesWithVeramo,
    }).initialize()
    await dbConnection.runMigrations()
    expect(await dbConnection.showMigrations()).toBeFalsy()
  })

  afterEach(async (): Promise<void> => {
    await dbConnection.destroy()
  })

  it('should save a MetaDataSetEntity to database', async (): Promise<void> => {
    const entity = new MetaDataSetEntity()
    entity.name = 'test_design'
    entity.tenantId = '0605761c-4113-4ce5-a6b2-9cbae2f9d289'
    entity.metaDataKeys = []
    entity.schemaDefinitions = []

    const saved = await dbConnection.getRepository(MetaDataSetEntity).save(entity)
    expect(saved).toBeDefined()
    expect(saved.id).toBeDefined()
    expect(saved.name).toEqual('test_design')
    expect(saved.tenantId).toEqual('0605761c-4113-4ce5-a6b2-9cbae2f9d289')
  })

  it('should save a MetaDataSetEntity with keys and values', async (): Promise<void> => {
    const value = new MetaDataValueEntity()
    value.index = 0
    value.textValue = 'VerifiableCredential'

    const key = new MetaDataKeyEntity()
    key.key = 'credentialType'
    key.valueType = ValueType.Text
    key.metaDataValues = [value]

    const entity = new MetaDataSetEntity()
    entity.name = 'test_with_keys'
    entity.metaDataKeys = [key]
    entity.schemaDefinitions = []

    const saved = await dbConnection.getRepository(MetaDataSetEntity).save(entity)
    expect(saved).toBeDefined()
    expect(saved.metaDataKeys).toBeDefined()
    expect(saved.metaDataKeys.length).toEqual(1)
    expect(saved.metaDataKeys[0].key).toEqual('credentialType')
    expect(saved.metaDataKeys[0].metaDataValues.length).toEqual(1)
    expect(saved.metaDataKeys[0].metaDataValues[0].textValue).toEqual('VerifiableCredential')
  })

  it('should save a FormStepEntity to database', async (): Promise<void> => {
    const entity = new FormStepEntity()
    entity.formId = 'credentialIssuanceWizard'
    entity.stepNr = 1
    entity.order = 1
    entity.schemaDefinitions = []

    const saved = await dbConnection.getRepository(FormStepEntity).save(entity)
    expect(saved).toBeDefined()
    expect(saved.id).toBeDefined()
    expect(saved.formId).toEqual('credentialIssuanceWizard')
  })

  it('should save a SchemaDefinitionEntity linked to MetaDataSet', async (): Promise<void> => {
    const metaDataSet = new MetaDataSetEntity()
    metaDataSet.name = 'schema_test'
    metaDataSet.metaDataKeys = []
    metaDataSet.schemaDefinitions = []

    const savedSet = await dbConnection.getRepository(MetaDataSetEntity).save(metaDataSet)

    const schema = new SchemaDefinitionEntity()
    schema.correlationId = 'test_correlation'
    schema.schemaType = 'Data'
    schema.entityType = 'VC'
    schema.schema = '{"type": "object"}'
    schema.metaDataSet = savedSet

    const savedSchema = await dbConnection.getRepository(SchemaDefinitionEntity).save(schema)
    expect(savedSchema).toBeDefined()
    expect(savedSchema.id).toBeDefined()
    expect(savedSchema.schemaType).toEqual('Data')
  })

  it('should save a CredentialDesignBrandingEntity', async (): Promise<void> => {
    const metaDataSet = new MetaDataSetEntity()
    metaDataSet.name = 'branding_test'
    metaDataSet.metaDataKeys = []
    metaDataSet.schemaDefinitions = []

    const savedSet = await dbConnection.getRepository(MetaDataSetEntity).save(metaDataSet)

    const branding = new CredentialDesignBrandingEntity()
    branding.textColor = '#ffffff'
    branding.backgroundColor = '#000000'
    branding.metaDataSet = savedSet

    const savedBranding = await dbConnection.getRepository(CredentialDesignBrandingEntity).save(branding)
    expect(savedBranding).toBeDefined()
    expect(savedBranding.id).toBeDefined()
    expect(savedBranding.textColor).toEqual('#ffffff')
    expect(savedBranding.backgroundColor).toEqual('#000000')
  })

  it('should cascade delete keys and values when removing MetaDataSet', async (): Promise<void> => {
    const value = new MetaDataValueEntity()
    value.index = 0
    value.textValue = 'test_value'

    const key = new MetaDataKeyEntity()
    key.key = 'testKey'
    key.valueType = ValueType.Text
    key.metaDataValues = [value]

    const entity = new MetaDataSetEntity()
    entity.name = 'cascade_test'
    entity.metaDataKeys = [key]
    entity.schemaDefinitions = []

    const saved = await dbConnection.getRepository(MetaDataSetEntity).save(entity)
    expect(saved.metaDataKeys.length).toEqual(1)

    await dbConnection.getRepository(MetaDataSetEntity).remove(saved)

    const keys = await dbConnection.getRepository(MetaDataKeyEntity).find()
    const values = await dbConnection.getRepository(MetaDataValueEntity).find()
    expect(keys.length).toEqual(0)
    expect(values.length).toEqual(0)
  })
})
