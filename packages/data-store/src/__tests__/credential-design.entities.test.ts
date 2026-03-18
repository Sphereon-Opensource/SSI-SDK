import { DataSources } from '@sphereon/ssi-sdk.agent-config'
import { NonPersistedCredentialDesign, ValueType } from '@sphereon/ssi-sdk.data-store-types'
import { DataSource } from 'typeorm'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MetaDataSetEntity, MetaDataKeyEntity, MetaDataValueEntity } from '../entities/credentialDesign'
import { DataStoreEntities, DataStoreMigrations } from '../index'
import {
  credentialDesignBrandingEntityFrom,
  credentialDesignFrom,
  metaDataKeyEntityFrom,
  schemaDefinitionEntityFrom,
} from '../utils/credentialDesign/MappingUtils'

describe('Credential Design entities tests', (): void => {
  let dbConnection: DataSource

  beforeEach(async (): Promise<void> => {
    DataSources.singleInstance().defaultDbType = 'sqlite'
    dbConnection = await new DataSource({
      type: 'sqlite',
      database: ':memory:',
      logging: ['info'],
      migrationsRun: false,
      migrations: DataStoreMigrations,
      synchronize: false,
      entities: DataStoreEntities,
    }).initialize()
    await dbConnection.runMigrations()
    expect(await dbConnection.showMigrations()).toBeFalsy()
  })

  afterEach(async (): Promise<void> => {
    await dbConnection.destroy()
  })

  it('Should save credential design to database', async (): Promise<void> => {
    const design: NonPersistedCredentialDesign = {
      label: 'TestCredentialDesign',
      tenantId: 'tenant-entity-test',
      metaDataKeys: [
        {
          key: 'credentialType',
          valueType: ValueType.Text,
          metaDataValues: [
            { index: 0, textValue: 'VerifiableCredential' },
            { index: 1, textValue: 'TestCredentialDesign' },
          ],
        },
        {
          key: 'credentialFormat',
          valueType: ValueType.Text,
          metaDataValues: [{ index: 0, textValue: 'jwt_vc_json' }],
        },
        {
          key: 'advancedSchema',
          valueType: ValueType.Boolean,
          metaDataValues: [{ index: 0, booleanValue: false }],
        },
      ],
      schemaDefinitions: [
        {
          correlationId: 'TestCredentialDesign',
          schemaType: 'Data',
          entityType: 'VC',
          schema: JSON.stringify({ type: 'object', properties: { name: { type: 'string' } } }),
        },
        {
          correlationId: 'TestCredentialDesign',
          schemaType: 'UI_Form',
          entityType: 'VC',
          schema: JSON.stringify({ type: 'VerticalLayout', elements: [] }),
        },
      ],
      branding: {
        textColor: '#FFFFFF',
        backgroundColor: '#003399',
        logo: {
          uri: 'https://example.com/logo.png',
          mediaType: 'image/png',
          alt: 'Company Logo',
          dimensions: { width: 200, height: 100 },
        },
        backgroundImage: {
          uri: 'https://example.com/bg.jpg',
          mediaType: 'image/jpeg',
          alt: 'Background',
          dimensions: { width: 1920, height: 1080 },
        },
      },
    }

    // Build entity graph using mappers
    const metaDataSetEntity = new MetaDataSetEntity()
    metaDataSetEntity.name = design.label
    metaDataSetEntity.tenantId = design.tenantId
    metaDataSetEntity.metaDataKeys = design.metaDataKeys!.map(metaDataKeyEntityFrom)
    metaDataSetEntity.schemaDefinitions = design.schemaDefinitions!.map(schemaDefinitionEntityFrom)
    metaDataSetEntity.credentialDesignBranding = credentialDesignBrandingEntityFrom(design.branding!)

    // Save to DB
    const savedEntity = await dbConnection.getRepository(MetaDataSetEntity).save(metaDataSetEntity)

    // Map back to type
    const fromDb = credentialDesignFrom(savedEntity)

    // ── Root level ──
    expect(fromDb).toBeDefined()
    expect(fromDb.id).toBeDefined()
    expect(fromDb.label).toEqual(design.label)
    expect(fromDb.tenantId).toEqual(design.tenantId)

    // ── MetaDataKeys ──
    expect(fromDb.metaDataKeys).toBeDefined()
    expect(fromDb.metaDataKeys.length).toEqual(3)

    const credentialTypeKey = fromDb.metaDataKeys.find((k) => k.key === 'credentialType')
    expect(credentialTypeKey).toBeDefined()
    expect(credentialTypeKey!.id).toBeDefined()
    expect(credentialTypeKey!.valueType).toEqual(ValueType.Text)
    expect(credentialTypeKey!.metaDataValues.length).toEqual(2)
    expect(credentialTypeKey!.metaDataValues[0].id).toBeDefined()
    expect(credentialTypeKey!.metaDataValues[0].index).toEqual(0)
    expect(credentialTypeKey!.metaDataValues[0].textValue).toEqual('VerifiableCredential')
    expect(credentialTypeKey!.metaDataValues[1].index).toEqual(1)
    expect(credentialTypeKey!.metaDataValues[1].textValue).toEqual('TestCredentialDesign')

    const credentialFormatKey = fromDb.metaDataKeys.find((k) => k.key === 'credentialFormat')
    expect(credentialFormatKey).toBeDefined()
    expect(credentialFormatKey!.valueType).toEqual(ValueType.Text)
    expect(credentialFormatKey!.metaDataValues.length).toEqual(1)
    expect(credentialFormatKey!.metaDataValues[0].textValue).toEqual('jwt_vc_json')

    const advancedSchemaKey = fromDb.metaDataKeys.find((k) => k.key === 'advancedSchema')
    expect(advancedSchemaKey).toBeDefined()
    expect(advancedSchemaKey!.valueType).toEqual(ValueType.Boolean)
    expect(advancedSchemaKey!.metaDataValues.length).toEqual(1)
    expect(advancedSchemaKey!.metaDataValues[0].booleanValue).toEqual(false)

    // ── SchemaDefinitions ──
    expect(fromDb.schemaDefinitions).toBeDefined()
    expect(fromDb.schemaDefinitions.length).toEqual(2)

    const dataSchema = fromDb.schemaDefinitions.find((s) => s.schemaType === 'Data')
    expect(dataSchema).toBeDefined()
    expect(dataSchema!.id).toBeDefined()
    expect(dataSchema!.correlationId).toEqual('TestCredentialDesign')
    expect(dataSchema!.entityType).toEqual('VC')
    expect(dataSchema!.schema).toEqual(design.schemaDefinitions![0].schema)

    const uiSchema = fromDb.schemaDefinitions.find((s) => s.schemaType === 'UI_Form')
    expect(uiSchema).toBeDefined()
    expect(uiSchema!.id).toBeDefined()
    expect(uiSchema!.correlationId).toEqual('TestCredentialDesign')
    expect(uiSchema!.schema).toEqual(design.schemaDefinitions![1].schema)

    // ── Branding ──
    expect(fromDb.branding).toBeDefined()
    expect(fromDb.branding!.id).toBeDefined()
    expect(fromDb.branding!.textColor).toEqual('#FFFFFF')
    expect(fromDb.branding!.backgroundColor).toEqual('#003399')

    // ── Branding > Logo ──
    expect(fromDb.branding!.logo).toBeDefined()
    expect(fromDb.branding!.logo!.id).toBeDefined()
    expect(fromDb.branding!.logo!.uri).toEqual(design.branding!.logo!.uri)
    expect(fromDb.branding!.logo!.mediaType).toEqual(design.branding!.logo!.mediaType)
    expect(fromDb.branding!.logo!.alt).toEqual(design.branding!.logo!.alt)
    expect(fromDb.branding!.logo!.dimensions).toBeDefined()
    expect(fromDb.branding!.logo!.dimensions!.width).toEqual(design.branding!.logo!.dimensions!.width)
    expect(fromDb.branding!.logo!.dimensions!.height).toEqual(design.branding!.logo!.dimensions!.height)

    // ── Branding > BackgroundImage ──
    expect(fromDb.branding!.backgroundImage).toBeDefined()
    expect(fromDb.branding!.backgroundImage!.id).toBeDefined()
    expect(fromDb.branding!.backgroundImage!.uri).toEqual(design.branding!.backgroundImage!.uri)
    expect(fromDb.branding!.backgroundImage!.mediaType).toEqual(design.branding!.backgroundImage!.mediaType)
    expect(fromDb.branding!.backgroundImage!.alt).toEqual(design.branding!.backgroundImage!.alt)
    expect(fromDb.branding!.backgroundImage!.dimensions).toBeDefined()
    expect(fromDb.branding!.backgroundImage!.dimensions!.width).toEqual(design.branding!.backgroundImage!.dimensions!.width)
    expect(fromDb.branding!.backgroundImage!.dimensions!.height).toEqual(design.branding!.backgroundImage!.dimensions!.height)
  })

  it('should cascade delete keys and values when removing MetaDataSet', async (): Promise<void> => {
    const metaDataSetEntity = new MetaDataSetEntity()
    metaDataSetEntity.name = 'cascade_test'
    metaDataSetEntity.metaDataKeys = [
      metaDataKeyEntityFrom({
        key: 'testKey',
        valueType: ValueType.Text,
        metaDataValues: [{ index: 0, textValue: 'test_value' }],
      }),
    ]
    metaDataSetEntity.schemaDefinitions = []

    const saved = await dbConnection.getRepository(MetaDataSetEntity).save(metaDataSetEntity)
    expect(saved.metaDataKeys.length).toEqual(1)

    await dbConnection.getRepository(MetaDataSetEntity).remove(saved)

    const keys = await dbConnection.getRepository(MetaDataKeyEntity).find()
    const values = await dbConnection.getRepository(MetaDataValueEntity).find()
    expect(keys.length).toEqual(0)
    expect(values.length).toEqual(0)
  })
})
