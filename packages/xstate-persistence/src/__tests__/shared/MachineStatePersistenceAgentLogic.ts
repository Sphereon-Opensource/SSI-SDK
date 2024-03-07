import { IAgentContext, TAgent } from '@veramo/core'
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
import { IMachineStatePersistence, MachineStatePersistArgs, machineStatePersistRegistration } from '../../index'

type ConfiguredAgent = TAgent<IMachineStatePersistence>

export const counterMachine = createMachine({
  predictableActionArguments: true,
  id: 'counter',
  context: {
    count: 0,
  },
  initial: 'init',

  states: {
    init: {
      id: 'init',
      on: {
        increment: {
          actions: assign({
            count: (context) => {
              console.log(context.count + 1)
              return context.count + 1
            },
          }),
        },
        finalize: {
          target: 'final',
        },
      },
    },
    final: {
      id: 'final',
      type: 'final',
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

    let context: IAgentContext<any>

    beforeEach(() => {
      instance = interpret(counterMachine).start()
    })

    afterEach(() => {
      instance?.stop()
    })

    beforeAll(async (): Promise<void> => {
      await testContext.setup()
      agent = testContext.getAgent()
      context = { ...agent.context, agent }
    })

    afterAll(testContext.tearDown)

    it('should store xstate state changes', async (): Promise<void> => {
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
        createdAt: expectDateOrString(true),
        expiresAt: expectDateOrString(),
        sessionId: 'x:0',
        latestEventType: 'xstate.init',
        latestStateName: 'init',
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
        latestStateName: 'init',
        machineName: machineStateInit.machineName,
        state: expect.anything(),
        tenantId: machineStateInit.tenantId,
        updatedAt: expectDateOrString(),
      })
      // count should have increased to 1
      expect(machineStateInfoIncrement.state.context.count).toEqual(1)

      await expect(agent.machineStateDelete({ instanceId: machineStateInfo.instanceId })).resolves.toEqual(true)
    })

    it('should automatically store xstate state changes', async (): Promise<void> => {
      const init = await machineStatePersistRegistration({ context, instance, machineName: instance.machine.id })
      if (!init) {
        return Promise.reject(new Error('No init'))
      }
      expect(init).toBeDefined()

      const { instanceId, machineName } = init

      // Wait some time since events are async
      await new Promise((res) => setTimeout(res, 100))
      instance.send('increment')

      // Wait some time since events are async
      await new Promise((res) => setTimeout(res, 100))
      let activeStates = await agent.machineStatesFindActive({ machineName: instance.machine.id })
      expect(activeStates).toHaveLength(1)
      expect(activeStates[0].instanceId).toEqual(instanceId)
      expect(activeStates[0].createdAt).toBeDefined()
      expect(activeStates[0].state).toBeDefined()
      expect(activeStates[0].state.context.count).toEqual(1)

      instance.send('increment')
      // Wait some time since events are async
      await new Promise((res) => setTimeout(res, 100))
      activeStates = await agent.machineStatesFindActive({ machineName: instance.machine.id })
      expect(activeStates).toHaveLength(1)
      expect(activeStates[0].state.context.count).toEqual(2)

      let machineState = await agent.machineStateGet({ instanceId })
      expect(machineState.state.context).toEqual(activeStates[0].state.context)

      // Should not delete anything, given the machine is not in a final state and we have no expirationDate
      await expect(agent.machineStatesDeleteExpired({ deleteDoneStates: true })).resolves.toEqual(0)
      await expect(agent.machineStatesDeleteExpired({ deleteDoneStates: true, machineName })).resolves.toEqual(0)
      await expect(agent.machineStatesDeleteExpired({ deleteDoneStates: false })).resolves.toEqual(0)
      await expect(agent.machineStatesDeleteExpired({ deleteDoneStates: false, machineName })).resolves.toEqual(0)

      // Let's move to the final state. There should be no more active state available afterwards
      instance.send('finalize')
      // Wait some time since events are async
      await new Promise((res) => setTimeout(res, 100))
      const finalActiveStates = await agent.machineStatesFindActive({ machineName: instance.machine.id })
      expect(finalActiveStates).toHaveLength(0)

      machineState = await agent.machineStateGet({ instanceId })
      expect(machineState.state.context).toEqual(activeStates[0].state.context)
      expect(machineState.completedAt).toBeDefined()
      expect(machineState.latestStateName).toEqual('final')

      // Should not delete anything, given the we look at expiration dates only when deleteDoneStates is false
      await expect(agent.machineStatesDeleteExpired({ deleteDoneStates: false })).resolves.toEqual(0)
      // Delete done states, but invalid machine name provided. So nothing should be deleted
      await expect(agent.machineStatesDeleteExpired({ deleteDoneStates: true, machineName: 'does not exist' })).resolves.toEqual(0)

      // Delete done states, with valid machine name provided. It should be gone
      await expect(agent.machineStatesDeleteExpired({ deleteDoneStates: true, machineName })).resolves.toEqual(1)
      await expect(agent.machineStateGet({ instanceId })).rejects.toThrowError()
    })
  })
}

const expectDateOrString = (warn?: boolean) => {
  warn && console.log(`WARN: Convert Date issue applies: https://sphereon.atlassian.net/browse/SDK-6`)
  return expect.anything()
}
