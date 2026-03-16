import { DataSources } from '@sphereon/ssi-sdk.agent-config'
import { DataSource } from 'typeorm'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CredentialDesignStore } from '../credentialDesign/CredentialDesignStore'
import { DataStoreEntitiesWithVeramo, DataStoreMigrationsWithVeramo } from '../index'

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
      migrations: DataStoreMigrationsWithVeramo,
      synchronize: false,
      entities: DataStoreEntitiesWithVeramo,
    }).initialize()
    await dbConnection.runMigrations()
    expect(await dbConnection.showMigrations()).toBeFalsy()
    store = new CredentialDesignStore(dbConnection)
  })

  afterEach(async (): Promise<void> => {
    await dbConnection.destroy()
  })

  it('should add a credential design', async (): Promise<void> => {
    const result = await store.addCredentialDesign({ name: 'TestDesign' } as any)
    expect(result).toBeDefined()
    expect(result.label).toEqual('TestDesign')
  })

  it('should get all credential designs', async (): Promise<void> => {
    await store.addCredentialDesign({ name: 'Design1' } as any)
    await store.addCredentialDesign({ name: 'Design2' } as any)

    const results = await store.getCredentialDesigns()
    expect(results).toBeDefined()
    expect(results.length).toEqual(2)
  })

  it('should get a credential design by id', async (): Promise<void> => {
    await store.addCredentialDesign({ name: 'FindMe' } as any)

    const all = await store.getCredentialDesigns()
    expect(all.length).toBeGreaterThanOrEqual(1)

    // Get all MetaDataSets to find the id (since CredentialDesign only has label)
    const { MetaDataSetEntity } = await import('../entities/credentialDesign/MetaDataSetEntity')
    const entities = await dbConnection.getRepository(MetaDataSetEntity).find()
    const targetEntity = entities.find((e) => e.name === 'FindMe')
    expect(targetEntity).toBeDefined()

    const result = await store.getCredentialDesign({ credentialDesignId: targetEntity!.id })
    expect(result).toBeDefined()
    expect(result.label).toEqual('FindMe')
  })

  it('should reject when getting non-existent credential design', async (): Promise<void> => {
    await expect(store.getCredentialDesign({ credentialDesignId: 'non-existent-id' })).rejects.toThrow(
      'No credential design found for id: non-existent-id',
    )
  })

  it('should update a credential design', async (): Promise<void> => {
    await store.addCredentialDesign({ name: 'OriginalName' } as any)

    const { MetaDataSetEntity } = await import('../entities/credentialDesign/MetaDataSetEntity')
    const entities = await dbConnection.getRepository(MetaDataSetEntity).find()
    const targetEntity = entities.find((e) => e.name === 'OriginalName')
    expect(targetEntity).toBeDefined()

    const updated = await store.updateCredentialDesign({ credentialDesignId: targetEntity!.id, name: 'UpdatedName' } as any)
    expect(updated).toBeDefined()
    expect(updated.label).toEqual('UpdatedName')
  })

  it('should remove a credential design', async (): Promise<void> => {
    await store.addCredentialDesign({ name: 'ToBeRemoved' } as any)

    const { MetaDataSetEntity } = await import('../entities/credentialDesign/MetaDataSetEntity')
    const entities = await dbConnection.getRepository(MetaDataSetEntity).find()
    const targetEntity = entities.find((e) => e.name === 'ToBeRemoved')
    expect(targetEntity).toBeDefined()

    await store.removeCredentialDesign({ credentialDesignId: targetEntity!.id } as any)

    const remaining = await store.getCredentialDesigns()
    const found = remaining.find((d) => d.label === 'ToBeRemoved')
    expect(found).toBeUndefined()
  })

  it('should reject when removing non-existent credential design', async (): Promise<void> => {
    await expect(store.removeCredentialDesign({ credentialDesignId: 'non-existent-id' } as any)).rejects.toThrow(
      'No credential design found for id: non-existent-id',
    )
  })
})
