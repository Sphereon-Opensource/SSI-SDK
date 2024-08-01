import { DataSources } from '@sphereon/ssi-sdk.agent-config'
import { DataSource } from 'typeorm'
import { DataStoreMachineStateEntities, MachineStateStore, StoreMachineStatesFindActiveArgs, StoreMachineStatePersistArgs } from '../index'
import { DataStoreMachineStateMigrations } from '../migrations'

describe('Machine State store tests', (): void => {
  let dbConnection: DataSource
  let store: MachineStateStore

  beforeEach(async (): Promise<void> => {
    DataSources.singleInstance().defaultDbType = 'sqlite'
    dbConnection = await new DataSource({
      type: 'sqlite',
      database: ':memory:',
      logging: 'all',
      migrationsRun: false,
      migrations: DataStoreMachineStateMigrations,
      synchronize: false,
      entities: DataStoreMachineStateEntities,
    }).initialize()
    await dbConnection.runMigrations()
    expect(await dbConnection.showMigrations()).toBeFalsy()
    store = new MachineStateStore(dbConnection)
  })

  afterEach(async (): Promise<void> => {
    await dbConnection.destroy()
  })

  it('should store machine state info', async (): Promise<void> => {
    const persistArgs: StoreMachineStatePersistArgs = {
      instanceId: 'Onboarding1',
      machineName: 'Onboarding',
      updatedCount: 0,
      latestStateName: 'enterPersonalDetails',
      latestEventType: 'SET_PERSONAL_DATA',
      state: 'test_state',
      expiresAt: new Date(new Date().getDate() + 100000),
      tenantId: 'test_tenant_id',
    }

    const persistMachineStateResult = await store.persistMachineState(persistArgs)
    expect(persistMachineStateResult).toBeDefined()
  })

  it('should get all machines with their current state', async (): Promise<void> => {
    const persistArgs: StoreMachineStatePersistArgs = {
      instanceId: 'Onboarding1',
      machineName: 'Onboarding',
      latestStateName: 'enterPersonalDetails',
      latestEventType: 'SET_PERSONAL_DATA',
      updatedCount: 0,
      state: 'test_state',
      expiresAt: new Date(new Date().getDate() + 100000),
      tenantId: 'test_tenant_id',
    }

    const stateEvent1 = await store.persistMachineState({ ...persistArgs })
    expect(stateEvent1).toBeDefined()

    const stateEvent2 = await store.persistMachineState({ ...persistArgs, instanceId: 'Onboarding2' })
    expect(stateEvent2).toBeDefined()

    const result = await store.findMachineStates()
    expect(result).toHaveLength(2)
  })

  it('should retrieve a machine state', async (): Promise<void> => {
    const expiresAt = new Date()
    expiresAt.setTime(expiresAt.getTime() + 100000)
    const persistArgs: StoreMachineStatePersistArgs = {
      instanceId: 'Onboarding1',
      machineName: 'Onboarding',
      latestStateName: 'enterPersonalDetails',
      latestEventType: 'SET_PERSONAL_DATA',
      state: 'test_state',
      updatedCount: 0,
      expiresAt,
      tenantId: 'test_tenant_id',
    }

    const machineStatePersisted = await store.persistMachineState(persistArgs)
    expect(machineStatePersisted).toBeDefined()
    const result = await store.findActiveMachineStates({ machineName: persistArgs.machineName, tenantId: persistArgs.tenantId })
    expect(result).toBeDefined()
  })

  it('should delete a machine state', async (): Promise<void> => {
    const persistArgs: StoreMachineStatePersistArgs = {
      instanceId: 'Onboarding1',
      machineName: 'Onboarding',
      updatedCount: 0,
      latestStateName: 'enterPersonalDetails',
      latestEventType: 'SET_PERSONAL_DATA',
      state: 'test_state',
      expiresAt: new Date(new Date().getDate() + 100000),
      tenantId: 'test_tenant_id',
    }

    const persistedState = await store.persistMachineState(persistArgs)
    expect(persistedState).toBeDefined()

    const result: boolean = await store.deleteMachineState({ instanceId: persistedState.instanceId })
    expect(result).toBeTruthy()
  })

  it('should return an error if type filter does not match', async (): Promise<void> => {
    const args: StoreMachineStatesFindActiveArgs = {
      machineName: 'unknown_machine',
    }

    await expect(store.findActiveMachineStates(args)).resolves.toEqual([])
  })

  it('should delete the expired records', async () => {
    const futureExpiresAt = new Date()
    futureExpiresAt.setTime(futureExpiresAt.getTime() + 100000) // Future expiration

    const pastExpiresAt = new Date()
    pastExpiresAt.setTime(pastExpiresAt.getTime() - 100000) // Past expiration, already expired

    const oldestXstateEvent: StoreMachineStatePersistArgs = {
      instanceId: 'Onboarding1',
      machineName: 'Onboarding',
      latestStateName: 'enterPersonalDetails',
      latestEventType: 'SET_TOC',
      updatedCount: 0,
      state: 'test_state',
      expiresAt: futureExpiresAt,
      tenantId: 'test_tenant_id',
    }
    const middleXstateEvent: StoreMachineStatePersistArgs = {
      instanceId: 'Onboarding1',
      machineName: 'Onboarding',
      latestStateName: 'TOC',
      latestEventType: 'SET_POLICY2',
      updatedCount: 1,
      state: 'test_state',
      expiresAt: futureExpiresAt,
      tenantId: 'test_tenant_id',
    }
    const newestXstateEvent: StoreMachineStatePersistArgs = {
      instanceId: 'OnboardingExpired',
      machineName: 'Onboarding',
      latestStateName: 'POLICY',
      latestEventType: 'SET_PERSONAL_DATA',
      updatedCount: 0,
      state: 'test_state',
      expiresAt: pastExpiresAt, // This event should be already expired
      tenantId: 'test_tenant_id',
    }

    await store.persistMachineState(oldestXstateEvent)
    await store.persistMachineState(middleXstateEvent)
    await store.persistMachineState(newestXstateEvent)

    await expect(store.findActiveMachineStates({ machineName: 'Onboarding' })).resolves.toHaveLength(1)

    await store.deleteExpiredMachineStates({})
    await expect(store.findActiveMachineStates({ machineName: 'Onboarding' })).resolves.toHaveLength(1)
    await expect(store.findActiveMachineStates({ machineName: 'Onboarding' })).resolves.toMatchObject([
      {
        completedAt: null,
        createdAt: expect.anything(),
        expiresAt: expect.anything(),
        instanceId: 'Onboarding1',
        latestEventType: 'SET_POLICY2',
        latestStateName: 'TOC',
        machineName: 'Onboarding',
        state: 'test_state',
        tenantId: 'test_tenant_id',
        updatedAt: expect.anything(),
      },
    ])
  })
})
