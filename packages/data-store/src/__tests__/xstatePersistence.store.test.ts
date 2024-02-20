import {DataSource} from 'typeorm'
import {DataStoreXStateStoreEntities, GetStateArgs, NonPersistedXStateStoreEvent, State, XStateStore} from '../index'
import {DataStoreXStateStoreMigrations} from '../migrations'

describe('Database entities tests', (): void => {
    let dbConnection: DataSource
    let xstateStore: XStateStore

    beforeEach(async (): Promise<void> => {
        dbConnection = await new DataSource({
            type: 'sqlite',
            database: ':memory:',
            //logging: 'all',
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
            completedAt:  new Date(),
            tenantId: 'test_tenant_id',
            ttl: 30000
        }

        const savedXStoreEvent: State = await xstateStore.saveState(xstateEvent)
        expect(savedXStoreEvent).toBeDefined()
    })

    it('should get all audit events', async (): Promise<void> => {
        const xstateEvent: NonPersistedXStateStoreEvent = {
            state: 'test_state',
            type: 'b40b8474-58a2-4b23-9fde-bd6ee1902cdb',
            createdAt: new Date(),
            updatedAt: new Date(),
            completedAt:  new Date(),
            tenantId: 'test_tenant_id',
            ttl: 30000
        }

        const savedXStoreEvent1: State = await xstateStore.saveState(xstateEvent)
        expect(savedXStoreEvent1).toBeDefined()

        const result: State = await xstateStore.getState(xstateEvent)
        expect(result).toBeDefined()
    })

    it('should get xstate events by filter', async (): Promise<void> => {
        const xstateEvent: NonPersistedXStateStoreEvent = {
            state: 'test_state',
            type: 'b40b8474-58a2-4b23-9fde-bd6ee1902cdb',
            createdAt: new Date(),
            updatedAt: new Date(),
            completedAt:  new Date(),
            tenantId: 'test_tenant_id',
            ttl: 30000
        }

        const savedXStoreEvent: State = await xstateStore.saveState(xstateEvent)
        expect(savedXStoreEvent).toBeDefined()

        const args: GetStateArgs = {
            type: 'b40b8474-58a2-4b23-9fde-bd6ee1902cdb'
        }
        const result: State = await xstateStore.getState(args)

        expect(result).toEqual(savedXStoreEvent)
    })

    it('should return no xstate event if filter does not match', async (): Promise<void> => {
        const args: GetStateArgs = {
            type: 'unknown_event'
        }
        const result: State = await xstateStore.getState(args)

        await expect(result).rejects.toBeDefined()
    })
})
