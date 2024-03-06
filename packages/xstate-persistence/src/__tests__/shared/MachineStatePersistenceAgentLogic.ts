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
      const persistArgs: MachineStatePersistArgs = {
        machineId: counterMachine.id,
        state: instance.getSnapshot(),
        expiresAt: new Date(new Date().getTime() + 100000),
        tenantId: 'test_tenant_id',
      }

      const machineStateInfo = await agent.machineStatePersist(persistArgs)
      expect(machineStateInfo).toMatchObject({
        completedAt: null,
        createdAt: {},
        expiresAt: {},
        id: 'x:0',
        latestEventType: 'xstate.init',
        latestStateName: '{}',
        machineId: 'counter',
        state:
          '{"actions":[],"activities":{},"meta":{},"events":[],"value":{},"context":{"count":0},"_event":{"name":"xstate.init","data":{"type":"xstate.init"},"$$type":"scxml","type":"external"},"_sessionid":"x:0","event":{"type":"xstate.init"},"children":{},"done":false,"tags":[]}',
        tenantId: 'test_tenant_id',
        updatedAt: {},
      })

      instance.send('increment')
      const persistIncrementArgs: MachineStatePersistArgs = {
        machineId: counterMachine.id,
        state: instance.getSnapshot(),
        expiresAt: new Date(new Date().getTime() + 100000),
        tenantId: 'test_tenant_id',
      }

      const machineStateInfoIncrement = await agent.machineStatePersist(persistIncrementArgs)
      expect(machineStateInfoIncrement).toMatchObject({
        completedAt: null,
        createdAt: {},
        expiresAt: {},
        id: 'x:0',
        latestEventType: 'increment',
        latestStateName: '{}',
        machineId: 'counter',
        state:
          '{"actions":[],"activities":{},"meta":{},"events":[],"value":{},"context":{"count":1},"_event":{"name":"increment","data":{"type":"increment"},"$$type":"scxml","type":"external"},"_sessionid":"x:0","event":{"type":"increment"},"history":{"actions":[],"activities":{},"meta":{},"events":[],"value":{},"context":{"count":0},"_event":{"name":"xstate.init","data":{"type":"xstate.init"},"$$type":"scxml","type":"external"},"_sessionid":"x:0","event":{"type":"xstate.init"},"children":{},"done":false,"tags":[]},"children":{},"done":false,"changed":true,"tags":[]}',
        tenantId: 'test_tenant_id',
        updatedAt: {},
      })
    })

    /*it('should retrieve an xstate event', async (): Promise<void> => {
          const xstateEvent: StorePersistMachineArgs = {
            machineId: 'acceptAgreement',
            machineId: 'Onboarding',
            latestEventType: 'SET_TOC',
            state: { myState: 'test_state' },
            expiresAt: new Date(new Date().getTime() + 100000),
            tenantId: 'test_tenant_id',
          }

          const savedXStoreEvent: StoreMachineStateInfo = await agent.machineStatePersist({ ...xstateEvent })
          expect(savedXStoreEvent).toBeDefined()

          const result: StoreMachineStateInfo = await agent.machineStatesFindActive({ machineId: savedXStoreEvent.machineId })
          expect(result).toBeDefined()
        })

        it('should delete the expired records', async () => {
          const now = new Date()
          const expiresAt = new Date(now.getTime() + 100000000)
          const expired = new Date(now.getTime() - 100000000)

          const newestXstateEvent: StorePersistMachineArgs = {
            machineId: 'enterPersonalDetails',
            state: 'test_state',
            machineId: 'Onboarding3',
            latestEventType: 'SET_PERSONAL_DATA',
            expiresAt: expired, // This event is expired
            tenantId: 'test_tenant_id',
          }
          const middleXstateEvent: StorePersistMachineArgs = {
            machineId: 'acceptAgreement',
            machineId: 'Onboarding2',
            latestEventType: 'SET_POLICY',
            state: 'test_state',
            expiresAt, // This event is not expired
            tenantId: 'test_tenant_id',
          }
          const oldestXstateEvent: StorePersistMachineArgs = {
            machineId: 'acceptAgreement',
            machineId: 'Onboarding1',
            latestEventType: 'SET_TOC',
            state: 'test_state',
            expiresAt, // This event is not expired
            tenantId: 'test_tenant_id',
          }

          await agent.machineStatePersist(newestXstateEvent)
          await agent.machineStatePersist(middleXstateEvent)
          await agent.machineStatePersist(oldestXstateEvent)
          await agent.machineStatesDeleteExpired({ machineId: 'Onboarding3' })

          await expect(agent.machineStatesFindActive({ machineId: 'Onboarding1' })).resolves.toBeDefined()
          await expect(agent.machineStatesFindActive({ machineId: 'Onboarding2' })).resolves.toBeDefined()
          await expect(agent.machineStatesFindActive({ machineId: 'Onboarding3' })).rejects.toEqual(
            Error('No active state found for machineId: Onboarding3, tenantId: undefined')
          )
        })*/
  })
}
