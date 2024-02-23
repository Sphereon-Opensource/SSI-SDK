import { NonPersistedXStateStoreEvent, State } from '@sphereon/ssi-sdk.data-store'
import { TAgent } from '@veramo/core'
import { IXStatePersistence, SQLDialect } from '../../index'

type ConfiguredAgent = TAgent<IXStatePersistence>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }): void => {
  describe('xstate-persistence agent plugin', (): void => {
    let agent: ConfiguredAgent

    beforeAll(async (): Promise<void> => {
      await testContext.setup()
      agent = testContext.getAgent()
    })

    afterAll(testContext.tearDown)

    it('should store xstate event', async (): Promise<void> => {
      const xstateEvent: NonPersistedXStateStoreEvent = {
        state: 'test_state',
        type: 'b40b8474-58a2-4b23-9fde-bd6ee1902cdb',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
        tenantId: 'test_tenant_id',
      }

      const savedXStoreEvent: State = await agent.persistState(xstateEvent)
      expect(savedXStoreEvent).toBeDefined()
    })

    it('should retrieve an xstate event', async (): Promise<void> => {
      const xstateEvent: NonPersistedXStateStoreEvent = {
        state: 'test_state',
        type: 'b40b8474-58a2-4b23-9fde-bd6ee1902cdb',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
        tenantId: 'test_tenant_id',
      }

      const savedXStoreEvent: State = await agent.persistState({ ...xstateEvent })
      expect(savedXStoreEvent).toBeDefined()

      const result: State = await agent.loadState({ type: savedXStoreEvent.type })
      expect(result).toBeDefined()
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

      await agent.persistState(newestXstateEvent)
      await agent.persistState(middleXstateEvent)
      await agent.persistState(oldestXstateEvent)

      await agent.deleteExpiredStates({ duration: 40000, dialect: SQLDialect.SQLite3 })

      await expect(agent.loadState({ type: 'test_type_1' })).resolves.toBeDefined()
      await expect(agent.loadState({ type: 'test_type_2' })).resolves.toBeDefined()
      await expect(agent.loadState({ type: 'test_type_3' })).rejects.toEqual(Error('No state found for type: test_type_3'))
    })
  })
}
