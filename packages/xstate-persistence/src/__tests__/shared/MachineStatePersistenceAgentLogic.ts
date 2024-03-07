import { TAgent } from '@veramo/core'
import {
  AnyEventObject,
  assign,
  BaseActionObject,
  createMachine,
  interpret,
  Interpreter,
  ResolveTypegenMeta,
  ServiceMap,
  TypegenDisabled,
} from 'xstate'
import { IMachineStatePersistence, MachineStatePersistArgs } from '../../index'

type ConfiguredAgent = TAgent<IMachineStatePersistence>

export const counterMachine = createMachine({
  id: 'counter',
  context: {
    count: 0,
  },
  on: {
    increment: {
      actions: assign({
        count: (context) => context.count + 1,
      }),
    },
    decrement: {
      actions: assign({
        count: (context) => context.count - 1,
      }),
    },
  },
})

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }): void => {
  describe('xstate-persistence agent plugin', (): void => {
    let agent: ConfiguredAgent
    let instance: Interpreter<
      { count: number },
      any,
      AnyEventObject,
      {
        value: any
        context: { count: number }
      },
      ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>
    >
    beforeEach(() => {
      instance = interpret(counterMachine).start()
    })

    afterEach(() => {
      instance?.stop()
    })

    beforeAll(async (): Promise<void> => {
      await testContext.setup()
      agent = testContext.getAgent()
    })

    afterAll(testContext.tearDown)

    it('should store xstate event', async (): Promise<void> => {
      const machineStateInit = await agent.machineStateInit({
        machineName: counterMachine.id,
        expiresAt: new Date(new Date().getTime() + 100000),
        tenantId: 'test_tenant_id',
      })

      const persistArgs: MachineStatePersistArgs = {
        ...machineStateInit,
        state: instance.getSnapshot(),
      }

      const machineStateInfo = await agent.machineStatePersist(persistArgs)

      expect(machineStateInfo).toMatchObject({
        completedAt: null,
        instanceId: expect.anything(),
        createdAt: expectDateOrString(),
        expiresAt: expectDateOrString(),
        sessionId: 'x:0',
        latestEventType: 'xstate.init',
        latestStateName: null,
        machineName: machineStateInit.machineName,
        state: expect.anything(),
        tenantId: machineStateInit.tenantId,
        updatedAt: expectDateOrString(),
      })
      // count should still be at 0
      expect(machineStateInfo.state.context.count).toEqual(0)

      instance.send('increment')
      const persistIncrementArgs: MachineStatePersistArgs = {
        ...machineStateInit,
        state: instance.getSnapshot(),
        expiresAt: new Date(new Date().getTime() + 100000),
      }

      const machineStateInfoIncrement = await agent.machineStatePersist(persistIncrementArgs)
      expect(machineStateInfoIncrement).toMatchObject({
        completedAt: null,
        instanceId: machineStateInfo.instanceId,
        createdAt: expectDateOrString(),
        expiresAt: expectDateOrString(),
        sessionId: 'x:0',
        latestEventType: 'increment',
        latestStateName: null,
        machineName: machineStateInit.machineName,
        state: expect.anything(),
        tenantId: machineStateInit.tenantId,
        updatedAt: expectDateOrString(),
      })
      // count should have increased to 1
      expect(machineStateInfoIncrement.state.context.count).toEqual(1)
    })

    /*it('should retrieve an xstate event', async (): Promise<void> => {
              const xstateEvent: StoreMachineStatePersistArgs = {
                machineName: 'acceptAgreement',
                machineName: 'Onboarding',
                latestEventType: 'SET_TOC',
                state: { myState: 'test_state' },
                expiresAt: new Date(new Date().getTime() + 100000),
                tenantId: 'test_tenant_id',
              }

              const savedXStoreEvent: StoreMachineStateInfo = await agent.machineStatePersist({ ...xstateEvent })
              expect(savedXStoreEvent).toBeDefined()

              const result: StoreMachineStateInfo = await agent.machineStatesFindActive({ machineName: savedXStoreEvent.machineName })
              expect(result).toBeDefined()
            })

            it('should delete the expired records', async () => {
              const now = new Date()
              const expiresAt = new Date(now.getTime() + 100000000)
              const expired = new Date(now.getTime() - 100000000)

              const newestXstateEvent: StoreMachineStatePersistArgs = {
                machineName: 'enterPersonalDetails',
                state: 'test_state',
                machineName: 'Onboarding3',
                latestEventType: 'SET_PERSONAL_DATA',
                expiresAt: expired, // This event is expired
                tenantId: 'test_tenant_id',
              }
              const middleXstateEvent: StoreMachineStatePersistArgs = {
                machineName: 'acceptAgreement',
                machineName: 'Onboarding2',
                latestEventType: 'SET_POLICY',
                state: 'test_state',
                expiresAt, // This event is not expired
                tenantId: 'test_tenant_id',
              }
              const oldestXstateEvent: StoreMachineStatePersistArgs = {
                machineName: 'acceptAgreement',
                machineName: 'Onboarding1',
                latestEventType: 'SET_TOC',
                state: 'test_state',
                expiresAt, // This event is not expired
                tenantId: 'test_tenant_id',
              }

              await agent.machineStatePersist(newestXstateEvent)
              await agent.machineStatePersist(middleXstateEvent)
              await agent.machineStatePersist(oldestXstateEvent)
              await agent.machineStatesDeleteExpired({ machineName: 'Onboarding3' })

              await expect(agent.machineStatesFindActive({ machineName: 'Onboarding1' })).resolves.toBeDefined()
              await expect(agent.machineStatesFindActive({ machineName: 'Onboarding2' })).resolves.toBeDefined()
              await expect(agent.machineStatesFindActive({ machineName: 'Onboarding3' })).rejects.toEqual(
                Error('No active state found for machineName: Onboarding3, tenantId: undefined')
              )
            })*/
  })
}

const expectDateOrString = () => {
  console.log(`WARN: Convert Dat issue applies: https://sphereon.atlassian.net/browse/SDK-6`)
  return expect.anything()
}
