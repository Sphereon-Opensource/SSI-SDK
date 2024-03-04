import { DataSource } from 'typeorm'
import { StateEntity, stateEntityFrom } from '../entities/xstate/StateEntity'

import { DataStoreXStateStoreEntities, DataStoreXStateStoreMigrations, NonPersistedXStateStoreEvent } from '../index'

describe('Database entities tests', (): void => {
  let dbConnection: DataSource

  beforeEach(async (): Promise<void> => {
    dbConnection = await new DataSource({
      type: 'sqlite',
      database: ':memory:',
      //logging: 'all',
      migrationsRun: false,
      migrations: DataStoreXStateStoreMigrations,
      synchronize: false,
      entities: [...DataStoreXStateStoreEntities],
    }).initialize()
    await dbConnection.runMigrations()
    expect(await dbConnection.showMigrations()).toBeFalsy()
  })

  afterEach(async (): Promise<void> => {
    await dbConnection.destroy()
  })

  it('should save xstate event to database', async (): Promise<void> => {
    const xstateEvent: NonPersistedXStateStoreEvent = {
      step: 'acceptAgreement',
      type: 'Onboarding',
      eventName: 'SET_TOC',
      state: 'test_state',
      expiresAt: new Date(new Date().getDate() + 100000),
      tenantId: 'test_tenant_id',
    }

    const xstateEventEntity: StateEntity = stateEntityFrom(xstateEvent)
    const fromDb: StateEntity = await dbConnection.getRepository(StateEntity).save(xstateEventEntity)

    expect(fromDb).toBeDefined()
    expect(fromDb?.id).not.toBeNull()
    expect(fromDb?.type).toEqual(xstateEvent.type)
    expect(fromDb?.state).toEqual(xstateEvent.state)
    expect(fromDb?.tenantId).toEqual(xstateEvent.tenantId)
    expect(fromDb?.completedAt).toBeNull()
  })
})
