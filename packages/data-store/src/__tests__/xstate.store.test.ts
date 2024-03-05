import { DataSource } from 'typeorm'
import {
  DataStoreXStateStoreEntities,
  GetActiveStateArgs,
  NonPersistedXStateStoreEvent,
  SaveStateArgs,
  State,
  XStateStore,
} from '../index'
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
      stateName: 'enterPersonalDetails',
      machineType: 'Onboarding',
      xStateEventType: 'SET_PERSONAL_DATA',
      state: 'test_state',
      expiresAt: new Date(new Date().getDate() + 100000),
      tenantId: 'test_tenant_id',
    }

    const savedXStoreEvent: State = await xstateStore.saveState(xstateEvent)
    expect(savedXStoreEvent).toBeDefined()
  })

  it('should get all state events', async (): Promise<void> => {
    const xstateEvent: NonPersistedXStateStoreEvent = {
      stateName: 'enterPersonalDetails',
      machineType: 'Onboarding',
      xStateEventType: 'SET_PERSONAL_DATA',
      state: 'test_state',
      expiresAt: new Date(new Date().getDate() + 100000),
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
    const expiresAt = new Date()
    expiresAt.setTime(expiresAt.getTime() + 100000)
    const xstateEvent: SaveStateArgs = {
      stateName: 'enterPersonalDetails',
      machineType: 'Onboarding',
      xStateEventType: 'SET_PERSONAL_DATA',
      state: 'test_state',
      expiresAt,
      tenantId: 'test_tenant_id',
    }

    const savedXStoreEvent1: State = await xstateStore.saveState(xstateEvent)
    expect(savedXStoreEvent1).toBeDefined()
    const result: State = await xstateStore.getActiveState({ machineType: xstateEvent.machineType, tenantId: xstateEvent.tenantId })
    expect(result).toBeDefined()
  })

  it('should delete an xstate event', async (): Promise<void> => {
    const xstateEvent: NonPersistedXStateStoreEvent = {
      stateName: 'enterPersonalDetails',
      machineType: 'Onboarding',
      xStateEventType: 'SET_PERSONAL_DATA',
      state: 'test_state',
      expiresAt: new Date(new Date().getDate() + 100000),
      tenantId: 'test_tenant_id',
    }

    const savedXStoreEvent: State = await xstateStore.saveState(xstateEvent)
    expect(savedXStoreEvent).toBeDefined()

    const result: boolean = await xstateStore.deleteState({ id: savedXStoreEvent.id })
    expect(result).toBeTruthy()
  })

  it('should return an error if type filter does not match', async (): Promise<void> => {
    const args: GetActiveStateArgs = {
      machineType: 'unknown_machine',
    }

    await expect(xstateStore.getActiveState(args)).rejects.toEqual(
      Error('No active state found for machineType: unknown_machine, tenantId: undefined')
    )
  })

  it('should delete the expired records', async () => {
    const futureExpiresAt = new Date()
    futureExpiresAt.setTime(futureExpiresAt.getTime() + 100000) // Future expiration

    const pastExpiresAt = new Date()
    pastExpiresAt.setTime(pastExpiresAt.getTime() - 100000) // Past expiration, already expired

    const oldestXstateEvent: SaveStateArgs = {
      stateName: 'acceptAgreement',
      machineType: 'Onboarding1',
      xStateEventType: 'SET_TOC',
      state: 'test_state',
      expiresAt: futureExpiresAt,
      tenantId: 'test_tenant_id',
    }
    const middleXstateEvent: SaveStateArgs = {
      stateName: 'acceptAgreement',
      machineType: 'Onboarding2',
      xStateEventType: 'SET_POLICY2',
      state: 'test_state',
      expiresAt: futureExpiresAt,
      tenantId: 'test_tenant_id',
    }
    const newestXstateEvent: SaveStateArgs = {
      stateName: 'enterPersonalDetails',
      machineType: 'Onboarding3',
      xStateEventType: 'SET_PERSONAL_DATA',
      state: 'test_state',
      expiresAt: pastExpiresAt, // This event should be already expired
      tenantId: 'test_tenant_id',
    }

    await xstateStore.saveState(oldestXstateEvent)
    await xstateStore.saveState(middleXstateEvent)
    await xstateStore.saveState(newestXstateEvent)

    await xstateStore.deleteExpiredStates({})

    await expect(xstateStore.getActiveState({ machineType: 'Onboarding1' })).resolves.toBeDefined()
    await expect(xstateStore.getActiveState({ machineType: 'Onboarding2' })).resolves.toBeDefined()
    await expect(xstateStore.getActiveState({ machineType: 'Onboarding3' })).rejects.toEqual(
      Error('No active state found for machineType: Onboarding3, tenantId: undefined')
    )
  })
})
