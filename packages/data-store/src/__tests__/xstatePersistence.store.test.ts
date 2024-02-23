import { DataSource } from 'typeorm'
import { DataStoreXStateStoreEntities, GetStateArgs, NonPersistedXStateStoreEvent, State, XStateStore } from '../index'
import { DataStoreXStateStoreMigrations } from '../migrations'

describe('Database entities tests', (): void => {
  let dbConnection: DataSource
  let xstateStore: XStateStore

  beforeEach(async (): Promise<void> => {
    dbConnection = await new DataSource({
      type: 'sqlite',
      database: ':memory:',
      logging: 'all',
      migrationsRun: false,
      migrations: DataStoreXStateStoreMigrations,
      synchronize: false,
      entities: DataStoreXStateStoreEntities,
    }).initialize()
    await dbConnection.runMigrations()
    expect(await dbConnection.showMigrations()).toBeFalsy()
    xstateStore = new XStateStore(dbConnection)
  })

  afterEach(async (): Promise<void> => {
    await dbConnection.destroy()
  })

  it('should store xstate event', async (): Promise<void> => {
    const xstateEvent: NonPersistedXStateStoreEvent = {
      state: 'test_state',
      type: 'b40b8474-58a2-4b23-9fde-bd6ee1902cdb',
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: new Date(),
      tenantId: 'test_tenant_id',
    }

    const savedXStoreEvent: State = await xstateStore.saveState(xstateEvent)
    expect(savedXStoreEvent).toBeDefined()
  })

  it('should get all state events', async (): Promise<void> => {
    const xstateEvent: NonPersistedXStateStoreEvent = {
      state: 'test_state',
      type: 'b40b8474-58a2-4b23-9fde-bd6ee1902cdb',
      completedAt: new Date(),
      tenantId: 'test_tenant_id',
    }

    const stateEvent1: NonPersistedXStateStoreEvent = await xstateStore.saveState({ ...xstateEvent })
    expect(stateEvent1).toBeDefined()

    const stateEvent2: NonPersistedXStateStoreEvent = await xstateStore.saveState({ ...xstateEvent })
    expect(stateEvent2).toBeDefined()

    const result: Array<State> = await xstateStore.getStates()
    expect(result).toHaveLength(2)
  })

  it('should retrieve an xstate event', async (): Promise<void> => {
    const xstateEvent: NonPersistedXStateStoreEvent = {
      state: 'test_state',
      type: 'b40b8474-58a2-4b23-9fde-bd6ee1902cdb',
      completedAt: new Date(),
      tenantId: 'test_tenant_id',
    }

    const savedXStoreEvent1: State = await xstateStore.saveState(xstateEvent)
    expect(savedXStoreEvent1).toBeDefined()

    const result: State = await xstateStore.getState(xstateEvent)
    expect(result).toBeDefined()
  })

  it('should return an error if type filter does not match', async (): Promise<void> => {
    const args: GetStateArgs = {
      type: 'unknown_event',
    }

    await expect(xstateStore.getState(args)).rejects.toEqual(Error('No state found for type: unknown_event'))
  })

  it('should delete the expired records', async () => {
    const now = new Date()
    const newestXstateEvent: NonPersistedXStateStoreEvent = {
      state: 'test_state',
      type: 'test_type_1',
      createdAt: now,
      completedAt: new Date(),
      tenantId: 'test_tenant_id',
    }
    const middleXstateEvent: NonPersistedXStateStoreEvent = {
      state: 'test_state',
      type: 'test_type_2',
      createdAt: new Date(+now - 30000),
      completedAt: new Date(),
      tenantId: 'test_tenant_id',
    }

    const oldestXstateEvent: NonPersistedXStateStoreEvent = {
      state: 'test_state',
      type: 'test_type_3',
      createdAt: new Date(+now - 60000),
      completedAt: new Date(),
      tenantId: 'test_tenant_id',
    }

    await xstateStore.saveState(oldestXstateEvent)
    await xstateStore.saveState(middleXstateEvent)
    await xstateStore.saveState(newestXstateEvent)

    await xstateStore.deleteState({
      where: `created_at < datetime('now', :ttl)`,
      parameters: { ttl: '-30 seconds' },
    })

    await expect(xstateStore.getState({ type: 'test_type_1' })).resolves.toBeDefined()
    await expect(xstateStore.getState({ type: 'test_type_2' })).resolves.toBeDefined()
    await expect(xstateStore.getState({ type: 'test_type_3' })).rejects.toEqual(Error('No state found for type: test_type_3'))
  })
})
