import { DataSources } from '@sphereon/ssi-sdk.agent-config'
import { DataSource } from 'typeorm'
import { MachineStateInfoEntity } from '../entities/machineState/MachineStateInfoEntity'

import { DataStoreMachineStateEntities, DataStoreMachineStateMigrations, StoreMachineStatePersistArgs, MachineStateStore } from '../index'

describe('Machine State Info Database entities tests', (): void => {
  let dbConnection: DataSource

  beforeEach(async (): Promise<void> => {
    DataSources.singleInstance().defaultDbType = 'sqlite'
    dbConnection = await new DataSource({
      type: 'sqlite',
      database: ':memory:',
      //logging: 'all',
      migrationsRun: false,
      migrations: DataStoreMachineStateMigrations,
      synchronize: false,
      entities: [...DataStoreMachineStateEntities],
    }).initialize()
    await dbConnection.runMigrations()
    expect(await dbConnection.showMigrations()).toBeFalsy()
  })

  afterEach(async (): Promise<void> => {
    await dbConnection.destroy()
  })

  it('should save machine state info to database', async (): Promise<void> => {
    const expiresAt = new Date()
    expiresAt.setTime(expiresAt.getTime() + 100000)
    const machineInfo: StoreMachineStatePersistArgs = {
      instanceId: 'Onboarding1',
      latestStateName: 'acceptAgreement',
      machineName: 'Onboarding',
      updatedCount: 0,
      latestEventType: 'SET_TOC',
      state: JSON.stringify({ myState: 'test_state' }),
      tenantId: 'test_tenant_id',
      expiresAt,
    }
    const fromDb: MachineStateInfoEntity = await dbConnection
      .getRepository(MachineStateInfoEntity)
      .save(MachineStateStore.machineStateInfoEntityFrom(machineInfo))

    expect(fromDb).toBeDefined()
    expect(fromDb?.instanceId).not.toBeNull()
    expect(fromDb?.machineName).toEqual(machineInfo.machineName)
    expect(fromDb?.state).toEqual(machineInfo.state)
    expect(fromDb?.tenantId).toEqual(machineInfo.tenantId)
    expect(fromDb?.completedAt).toBeNull()
  })
})
