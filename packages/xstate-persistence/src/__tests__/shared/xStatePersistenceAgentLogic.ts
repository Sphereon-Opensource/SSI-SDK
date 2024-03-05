import { NonPersistedXStateStoreEvent, State } from '@sphereon/ssi-sdk.data-store'
import { TAgent } from '@veramo/core'
import { IXStatePersistence } from '../../index'

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
        step: 'acceptAgreement',
        type: 'Onboarding',
        eventName: 'SET_TOC',
        state: 'test_state',
        expiresAt: new Date(new Date().getDate() + 100000),
        tenantId: 'test_tenant_id',
      }

      const savedXStoreEvent: State = await agent.statePersist(xstateEvent)
      expect(savedXStoreEvent).toBeDefined()
    })

    it('should retrieve an xstate event', async (): Promise<void> => {
      const xstateEvent: NonPersistedXStateStoreEvent = {
        step: 'acceptAgreement',
        type: 'Onboarding',
        eventName: 'SET_TOC',
        state: 'test_state',
        expiresAt: new Date(new Date().getDate() + 100000),
        tenantId: 'test_tenant_id',
      }

      const savedXStoreEvent: State = await agent.statePersist({ ...xstateEvent })
      expect(savedXStoreEvent).toBeDefined()

      const result: State = await agent.stateLoad({ type: savedXStoreEvent.type })
      expect(result).toBeDefined()
    })

    it('should delete the expired records', async () => {
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 100000000)
      const expired = new Date(now.getTime() - 100000000)

      const newestXstateEvent = {
        step: 'enterPersonalDetails',
        state: 'test_state',
        type: 'Onboarding3',
        eventName: 'SET_PERSONAL_DATA',
        expiresAt: expired, // This event is expired
        tenantId: 'test_tenant_id',
      }
      const middleXstateEvent = {
        step: 'acceptAgreement',
        type: 'Onboarding2',
        eventName: 'SET_POLICY',
        state: 'test_state',
        expiresAt, // This event is not expired
        tenantId: 'test_tenant_id',
      }
      const oldestXstateEvent = {
        step: 'acceptAgreement',
        type: 'Onboarding1',
        eventName: 'SET_TOC',
        state: 'test_state',
        expiresAt, // This event is not expired
        tenantId: 'test_tenant_id',
      }

      await agent.statePersist(newestXstateEvent)
      await agent.statePersist(middleXstateEvent)
      await agent.statePersist(oldestXstateEvent)
      await agent.stateDeleteExpired({ type: 'Onboarding3' })

      await expect(agent.stateLoad({ type: 'Onboarding1' })).resolves.toBeDefined()
      await expect(agent.stateLoad({ type: 'Onboarding2' })).resolves.toBeDefined()
      await expect(agent.stateLoad({ type: 'Onboarding3' })).rejects.toEqual(Error('No state found for type: Onboarding3'))
    })
  })
}
