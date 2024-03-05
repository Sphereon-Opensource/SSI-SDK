import { SaveStateArgs, State } from '@sphereon/ssi-sdk.data-store'
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
      const xstateEvent: SaveStateArgs = {
        stateName: 'acceptAgreement',
        machineType: 'Onboarding',
        xStateEventType: 'SET_TOC',
        state: 'test_state',
        expiresAt: new Date(new Date().getDate() + 100000),
        tenantId: 'test_tenant_id',
      }

      const savedXStoreEvent: State = await agent.statePersist(xstateEvent)
      expect(savedXStoreEvent).toBeDefined()
    })

    it('should retrieve an xstate event', async (): Promise<void> => {
      const xstateEvent: SaveStateArgs = {
        stateName: 'acceptAgreement',
        machineType: 'Onboarding',
        xStateEventType: 'SET_TOC',
        state: { myState: 'test_state' },
        expiresAt: new Date(new Date().getDate() + 100000),
        tenantId: 'test_tenant_id',
      }

      const savedXStoreEvent: State = await agent.statePersist({ ...xstateEvent })
      expect(savedXStoreEvent).toBeDefined()

      const result: State = await agent.stateLoadActive({ machineType: savedXStoreEvent.machineType })
      expect(result).toBeDefined()
    })

    it('should delete the expired records', async () => {
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 100000000)
      const expired = new Date(now.getTime() - 100000000)

      const newestXstateEvent: SaveStateArgs = {
        stateName: 'enterPersonalDetails',
        state: 'test_state',
        machineType: 'Onboarding3',
        xStateEventType: 'SET_PERSONAL_DATA',
        expiresAt: expired, // This event is expired
        tenantId: 'test_tenant_id',
      }
      const middleXstateEvent: SaveStateArgs = {
        stateName: 'acceptAgreement',
        machineType: 'Onboarding2',
        xStateEventType: 'SET_POLICY',
        state: 'test_state',
        expiresAt, // This event is not expired
        tenantId: 'test_tenant_id',
      }
      const oldestXstateEvent: SaveStateArgs = {
        stateName: 'acceptAgreement',
        machineType: 'Onboarding1',
        xStateEventType: 'SET_TOC',
        state: 'test_state',
        expiresAt, // This event is not expired
        tenantId: 'test_tenant_id',
      }

      await agent.statePersist(newestXstateEvent)
      await agent.statePersist(middleXstateEvent)
      await agent.statePersist(oldestXstateEvent)
      await agent.stateDeleteExpired({ machineType: 'Onboarding3' })

      await expect(agent.stateLoadActive({ machineType: 'Onboarding1' })).resolves.toBeDefined()
      await expect(agent.stateLoadActive({ machineType: 'Onboarding2' })).resolves.toBeDefined()
      await expect(agent.stateLoadActive({ machineType: 'Onboarding3' })).rejects.toEqual(
        Error('No active state found for machineType: Onboarding3, tenantId: undefined')
      )
    })
  })
}
