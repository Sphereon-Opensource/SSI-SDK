import { DataSources } from '@sphereon/ssi-sdk.agent-config'
import {
  AddCredentialDesignArgs,
  CredentialDesign,
  GetCredentialDesignsArgs,
  UpdateCredentialDesignArgs,
  ValueType,
} from '@sphereon/ssi-sdk.data-store-types'
import { DataSource } from 'typeorm'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CredentialDesignStore } from '../credentialDesign/CredentialDesignStore'
import { DataStoreEntities, DataStoreMigrations } from '../index'

describe('Credential Design store tests', (): void => {
  let dbConnection: DataSource
  let store: CredentialDesignStore

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
    store = new CredentialDesignStore(dbConnection)
  })

  afterEach(async (): Promise<void> => {
    await dbConnection.destroy()
  })

  it('should get a credential design by id', async (): Promise<void> => {
    const args: AddCredentialDesignArgs = {
      identifier: 'GetByIdDesign',
      tenantId: 'tenant-get-by-id',
      design: {
        identifier: 'GetByIdDesign',
        tenantId: 'tenant-get-by-id',
        metadataKeys: [
          {
            key: 'credentialType',
            valueType: ValueType.Text,
            metadataValues: [{ index: 0, textValue: 'VerifiableCredential' }],
          },
        ],
        schemaDefinitions: [
          {
            correlationId: 'GetByIdDesign',
            schemaType: 'Data',
            entityType: 'VC',
            schema: JSON.stringify({ type: 'object' }),
          },
        ],
      },
    }

    const savedDesign: CredentialDesign = await store.addCredentialDesign(args)
    expect(savedDesign).toBeDefined()

    const result: CredentialDesign = await store.getCredentialDesign({ credentialDesignId: savedDesign.id })

    expect(result).toBeDefined()
    expect(result.id).toEqual(savedDesign.id)
    expect(result.identifier).toEqual('GetByIdDesign')
    expect(result.tenantId).toEqual('tenant-get-by-id')
  })

  it('should throw error when getting credential design with unknown id', async (): Promise<void> => {
    const credentialDesignId = 'unknownCredentialDesignId'

    await expect(store.getCredentialDesign({ credentialDesignId })).rejects.toThrow(`No credential design found for id: ${credentialDesignId}`)
  })

  it('should get all credential designs', async (): Promise<void> => {
    const design1: AddCredentialDesignArgs = {
      identifier: 'Design1',
      tenantId: 'tenant-1',
      design: {
        identifier: 'Design1',
        tenantId: 'tenant-1',
        metadataKeys: [
          {
            key: 'credentialType',
            valueType: ValueType.Text,
            metadataValues: [{ index: 0, textValue: 'VerifiableCredential' }],
          },
        ],
        schemaDefinitions: [
          {
            correlationId: 'Design1',
            schemaType: 'Data',
            entityType: 'VC',
            schema: JSON.stringify({ type: 'object' }),
          },
        ],
      },
    }
    const savedDesign1: CredentialDesign = await store.addCredentialDesign(design1)
    expect(savedDesign1).toBeDefined()

    const design2: AddCredentialDesignArgs = {
      identifier: 'Design2',
      tenantId: 'tenant-2',
      design: {
        identifier: 'Design2',
        tenantId: 'tenant-2',
        metadataKeys: [
          {
            key: 'credentialFormat',
            valueType: ValueType.Text,
            metadataValues: [{ index: 0, textValue: 'sd-jwt' }],
          },
        ],
        schemaDefinitions: [
          {
            correlationId: 'Design2',
            schemaType: 'Data',
            entityType: 'VC',
            schema: JSON.stringify({ type: 'object' }),
          },
        ],
      },
    }
    const savedDesign2: CredentialDesign = await store.addCredentialDesign(design2)
    expect(savedDesign2).toBeDefined()

    const result: Array<CredentialDesign> = await store.getCredentialDesigns()

    expect(result).toBeDefined()
    expect(result.length).toEqual(2)
  })

  it('should get credential designs by filter', async (): Promise<void> => {
    await store.addCredentialDesign({ identifier: 'FilterDesign1', tenantId: 'tenant-filter' })
    await store.addCredentialDesign({ identifier: 'FilterDesign2', tenantId: 'tenant-other' })

    const args: GetCredentialDesignsArgs = {
      filter: {
        tenantId: 'tenant-filter',
      },
    }
    const result: Array<CredentialDesign> = await store.getCredentialDesigns(args)

    expect(result.length).toEqual(1)
    expect(result[0].identifier).toEqual('FilterDesign1')
  })

  it('should get whole credential design with all relations by filter', async (): Promise<void> => {
    const args: AddCredentialDesignArgs = {
      identifier: 'WholeDesign',
      tenantId: 'tenant-whole',
      design: {
        identifier: 'WholeDesign',
        tenantId: 'tenant-whole',
        metadataKeys: [
          {
            key: 'credentialType',
            valueType: ValueType.Text,
            metadataValues: [
              { index: 0, textValue: 'VerifiableCredential' },
              { index: 1, textValue: 'WholeDesign' },
            ],
          },
          {
            key: 'credentialFormat',
            valueType: ValueType.Text,
            metadataValues: [{ index: 0, textValue: 'jwt_vc_json' }],
          },
          {
            key: 'advancedSchema',
            valueType: ValueType.Boolean,
            metadataValues: [{ index: 0, booleanValue: false }],
          },
        ],
        schemaDefinitions: [
          {
            correlationId: 'WholeDesign',
            schemaType: 'Data',
            entityType: 'VC',
            schema: JSON.stringify({ type: 'object', properties: { name: { type: 'string' } } }),
          },
          {
            correlationId: 'WholeDesign',
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
        },
      },
    }
    await store.addCredentialDesign(args)
    await store.addCredentialDesign({ identifier: 'OtherDesign', tenantId: 'tenant-other' })

    const result: Array<CredentialDesign> = await store.getCredentialDesigns({ filter: { tenantId: 'tenant-whole' } })

    expect(result.length).toEqual(1)
    expect(result[0].metadataKeys.length).toEqual(3)
    expect(result[0].schemaDefinitions.length).toEqual(2)
    expect(result[0].branding).toBeDefined()
    expect(result[0].branding!.logo).toBeDefined()
    expect(result[0].branding!.logo!.uri).toEqual('https://example.com/logo.png')
  })

  it('should return no credential designs if filter does not match', async (): Promise<void> => {
    await store.addCredentialDesign({ identifier: 'SomeDesign', tenantId: 'tenant-exists' })

    const result: Array<CredentialDesign> = await store.getCredentialDesigns({ filter: { tenantId: 'non-existent-tenant' } })

    expect(result.length).toEqual(0)
  })

  it('should add credential design', async (): Promise<void> => {
    const args: AddCredentialDesignArgs = {
      identifier: 'AddDesign',
      tenantId: 'tenant-add',
      design: {
        identifier: 'AddDesign',
        tenantId: 'tenant-add',
        metadataKeys: [
          {
            key: 'credentialType',
            valueType: ValueType.Text,
            metadataValues: [
              { index: 0, textValue: 'VerifiableCredential' },
              { index: 1, textValue: 'AddDesign' },
            ],
          },
          {
            key: 'credentialFormat',
            valueType: ValueType.Text,
            metadataValues: [{ index: 0, textValue: 'jwt_vc_json' }],
          },
        ],
        schemaDefinitions: [
          {
            correlationId: 'AddDesign',
            schemaType: 'Data',
            entityType: 'VC',
            schema: JSON.stringify({ type: 'object', properties: { name: { type: 'string' } } }),
          },
          {
            correlationId: 'AddDesign',
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
      },
    }

    const result: CredentialDesign = await store.addCredentialDesign(args)

    expect(result).toBeDefined()
    expect(result.id).toBeDefined()
    expect(result.identifier).toEqual(args.identifier)
    expect(result.tenantId).toEqual(args.tenantId)
    expect(result.metadataKeys.length).toEqual(2)
    expect(result.schemaDefinitions.length).toEqual(2)
    expect(result.branding).toBeDefined()
    expect(result.branding!.textColor).toEqual('#FFFFFF')
    expect(result.branding!.logo).toBeDefined()
    expect(result.branding!.logo!.uri).toEqual('https://example.com/logo.png')
    expect(result.branding!.logo!.dimensions).toBeDefined()
    expect(result.branding!.logo!.dimensions!.width).toEqual(200)
    expect(result.branding!.backgroundImage).toBeDefined()
    expect(result.branding!.backgroundImage!.uri).toEqual('https://example.com/bg.jpg')
    expect(result.branding!.backgroundImage!.dimensions).toBeDefined()
    expect(result.branding!.backgroundImage!.dimensions!.width).toEqual(1920)
  })

  it('should update credential design by id', async (): Promise<void> => {
    const created: CredentialDesign = await store.addCredentialDesign({
      identifier: 'OriginalDesign',
      tenantId: 'tenant-original',
      design: {
        identifier: 'OriginalDesign',
        tenantId: 'tenant-original',
        metadataKeys: [
          {
            key: 'credentialType',
            valueType: ValueType.Text,
            metadataValues: [{ index: 0, textValue: 'VerifiableCredential' }],
          },
          {
            key: 'credentialFormat',
            valueType: ValueType.Text,
            metadataValues: [{ index: 0, textValue: 'jwt_vc_json' }],
          },
        ],
        schemaDefinitions: [
          {
            correlationId: 'OriginalDesign',
            schemaType: 'Data',
            entityType: 'VC',
            schema: JSON.stringify({ type: 'object' }),
          },
        ],
        branding: {
          textColor: '#000000',
          backgroundColor: '#FFFFFF',
        },
      },
    })
    expect(created).toBeDefined()

    const updateArgs: UpdateCredentialDesignArgs = {
      credentialDesignId: created.id,
      identifier: 'UpdatedDesign',
      design: {
        metadataKeys: [
          {
            key: 'credentialType',
            valueType: ValueType.Text,
            metadataValues: [
              { index: 0, textValue: 'VerifiableCredential' },
              { index: 1, textValue: 'UpdatedDesign' },
            ],
          },
          {
            key: 'credentialFormat',
            valueType: ValueType.Text,
            metadataValues: [{ index: 0, textValue: 'sd-jwt' }],
          },
          {
            key: 'vct',
            valueType: ValueType.Text,
            metadataValues: [{ index: 0, textValue: 'https://example.com/vct' }],
          },
        ],
      },
    }

    await store.updateCredentialDesign(updateArgs)
    const result: CredentialDesign = await store.getCredentialDesign({ credentialDesignId: created.id })

    expect(result).toBeDefined()
    expect(result.identifier).toEqual('UpdatedDesign')
    expect(result.metadataKeys.length).toEqual(3)

    const credentialFormatKey = result.metadataKeys.find((k) => k.key === 'credentialFormat')
    expect(credentialFormatKey).toBeDefined()
    expect(credentialFormatKey!.metadataValues[0].textValue).toEqual('sd-jwt')

    const vctKey = result.metadataKeys.find((k) => k.key === 'vct')
    expect(vctKey).toBeDefined()
    expect(vctKey!.metadataValues[0].textValue).toEqual('https://example.com/vct')

    // Branding should remain untouched since we only updated metadataKeys
    expect(result.branding).toBeDefined()
    expect(result.branding!.textColor).toEqual('#000000')
  })

  it('should throw error when updating credential design with unknown id', async (): Promise<void> => {
    const credentialDesignId = 'unknownCredentialDesignId'

    await expect(store.updateCredentialDesign({ credentialDesignId, identifier: 'ShouldFail' })).rejects.toThrow(
      `No credential design found for id: ${credentialDesignId}`,
    )
  })

  it('should remove credential design', async (): Promise<void> => {
    const created: CredentialDesign = await store.addCredentialDesign({
      identifier: 'ToBeRemoved',
      tenantId: 'tenant-remove',
    })
    expect(created).toBeDefined()

    const beforeRemove: Array<CredentialDesign> = await store.getCredentialDesigns()
    expect(beforeRemove.length).toEqual(1)

    await store.removeCredentialDesign({ credentialDesignId: created.id })

    const afterRemove: Array<CredentialDesign> = await store.getCredentialDesigns()
    expect(afterRemove).toBeDefined()
    expect(afterRemove.length).toEqual(0)
  })

  it('should throw error when removing credential design with unknown id', async (): Promise<void> => {
    const credentialDesignId = 'unknownCredentialDesignId'

    await expect(store.removeCredentialDesign({ credentialDesignId })).rejects.toThrow(`No credential design found for id: ${credentialDesignId}`)
  })
})
