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
  StateMachine,
  TypegenDisabled,
} from 'xstate'
import { IMachineStatePersistence, interpreterStartOrResume, MachineStatePersistArgs, machineStatePersistRegistration } from '../../index'

type ConfiguredAgent = TAgent<IMachineStatePersistence>

export const newCounterMachine = (name?: string) =>
  createMachine({
    predictableActionArguments: true,
    id: name ?? 'counter',
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
              count: (context) => context.count + 1,
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
    let counterMachine: StateMachine<any, any, any>
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
      counterMachine = newCounterMachine(`counter-${Date.now()}`)
      instance = interpret(counterMachine)
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
      instance.start()
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
      instance.start()
      const init = await machineStatePersistRegistration({
        context,
        interpreter: instance,
        machineName: instance.machine.id,
        cleanupOnFinalState: false,
        cleanupAllOtherInstances: true,
      })
      if (!init) {
        return Promise.reject(new Error('No init'))
      }
      expect(init).toBeDefined()

      const { instanceId, machineName } = init

      instance.send('increment')

      // Wait some time since events are async
      await new Promise((res) => setTimeout(res, 50))
      let activeStates = await agent.machineStatesFindActive({ machineName: instance.machine.id })
      expect(activeStates).toHaveLength(1)
      expect(activeStates[0].instanceId).toEqual(instanceId)
      expect(activeStates[0].createdAt).toBeDefined()
      expect(activeStates[0].state).toBeDefined()
      expect(activeStates[0].state.context.count).toEqual(1)
      console.log(JSON.stringify(activeStates[0], null, 2))

      instance.send('increment')
      // Wait some time since events are async
      await new Promise((res) => setTimeout(res, 50))
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
      await new Promise((res) => setTimeout(res, 50))
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

    it('should automatically start a new state machine with provided id', async (): Promise<void> => {
      const instanceId = 'autoStart-' + Date.now()
      await interpreterStartOrResume({
        stateType: 'new',
        machineName: counterMachine.id,
        instanceId,
        context,
        singletonCheck: true,
        interpreter: instance,
        cleanupAllOtherInstances: true,
      })

      await new Promise((res) => setTimeout(res, 50))
      instance.send('increment')

      // Wait some time since events are async
      await new Promise((res) => setTimeout(res, 100))
      let activeStates = await agent.machineStatesFindActive({ machineName: instance.machine.id })
      expect(activeStates).toHaveLength(1)
      expect(activeStates[0].state).toBeDefined()
      await agent.machineStateDelete({ instanceId })
    })

    it('should not automatically start a new state machine with for the same machine in case singleton check is true', async (): Promise<void> => {
      await interpreterStartOrResume({ stateType: 'new', machineName: counterMachine.id, context, singletonCheck: true, interpreter: instance })
      let activeStates = await agent.machineStatesFindActive({ machineName: instance.machine.id })
      expect(activeStates).toHaveLength(1)
      expect(activeStates[0].state).toBeDefined()

      await expect(
        interpreterStartOrResume({ stateType: 'new', machineName: 'counter', context, singletonCheck: true, interpreter: interpret(counterMachine) }),
      ).rejects.toThrowError()
      await agent.machineStateDelete({ instanceId: activeStates[0].instanceId })
    })

    it('should automatically start 2 new state machines with for the same machine in case singleton check is false', async (): Promise<void> => {
      await interpreterStartOrResume({
        stateType: 'new',
        machineName: counterMachine.id,
        context,
        singletonCheck: false,
        interpreter: instance,
        cleanupOnFinalState: false,
        cleanupAllOtherInstances: true,
      })
      let activeStates = await agent.machineStatesFindActive({ machineName: instance.machine.id })
      expect(activeStates).toHaveLength(1)
      expect(activeStates[0].state).toBeDefined()

      await expect(
        interpreterStartOrResume({
          stateType: 'new',
          machineName: counterMachine.id,
          context,
          singletonCheck: false,
          interpreter: interpret(counterMachine),
          cleanupOnFinalState: false,
        }),
      ).resolves.toBeDefined()
      await new Promise((res) => setTimeout(res, 50))
      activeStates = await agent.machineStatesFindActive({ machineName: instance.machine.id })

      expect(activeStates).toHaveLength(2)
      expect(activeStates[1].state).toBeDefined()
      activeStates.forEach(async (state) => await agent.machineStateDelete({ instanceId: state.instanceId }))
    })

    it('should automatically start 1 new state machine and resume it after it was stopped', async (): Promise<void> => {
      const info = await interpreterStartOrResume({
        stateType: 'new',
        context,
        singletonCheck: true,
        interpreter: instance,
        cleanupOnFinalState: false,
      })
      instance.send('increment')

      // Wait some time since events are async
      await new Promise((res) => setTimeout(res, 50))
      let activeStates = await agent.machineStatesFindActive({ machineName: info.init.machineName })
      expect(activeStates).toHaveLength(1)
      console.log(JSON.stringify(activeStates[0], null, 2))
      const originalSessionId = instance.sessionId
      instance.stop()

      const resumeInterpreter = interpret(counterMachine)
      const resumeInfo = await interpreterStartOrResume({
        stateType: 'existing',
        instanceId: info.init.instanceId,
        context,
        singletonCheck: true,
        interpreter: resumeInterpreter,
      })
      expect(originalSessionId).not.toEqual(resumeInterpreter.sessionId)
      expect(resumeInfo.init.instanceId).toEqual(info.init.instanceId)
      await new Promise((res) => setTimeout(res, 50))
      activeStates = await agent.machineStatesFindActive({ machineName: instance.machine.id })

      expect(activeStates).toHaveLength(1)
      expect(activeStates[0].state).toBeDefined()

      resumeInterpreter.send('increment')
      // Wait some time since events are async
      await new Promise((res) => setTimeout(res, 50))
      activeStates = await agent.machineStatesFindActive({ machineName: info.init.machineName })
      expect(activeStates).toHaveLength(1)
      console.log(JSON.stringify(activeStates[0], null, 2))

      await Promise.all(activeStates.map((state) => agent.machineStateDelete({ instanceId: state.instanceId })))
    })
  })
}

const expectDateOrString = (warn?: boolean) => {
  warn && console.log(`WARN: Convert Date issue applies: https://sphereon.atlassian.net/browse/SDK-6`)
  return expect.anything()
}
