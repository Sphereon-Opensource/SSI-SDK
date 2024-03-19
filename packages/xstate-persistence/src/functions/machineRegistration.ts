import { IAgentContext, TAgent } from '@veramo/core'
import { DefaultContext, EventObject, Interpreter, State, StateSchema, TypegenDisabled, Typestate } from 'xstate'
import { waitFor } from 'xstate/lib/waitFor'
import {
  IMachineStatePersistence,
  InitMachineStateArgs,
  MachineStateInfo,
  MachineStateInit,
  MachineStateInitType,
  MachineStatePersistenceOpts,
  MachineStatePersistEventType,
  StartedInterpreterInfo,
} from '../types'
import { emitMachineStatePersistEvent } from './stateEventEmitter'
import { machineStateToMachineInit, machineStateToStoreInfo } from './stateMapper'

/**
 * Initialize the machine state persistence. Returns a unique instanceId and the machine name amongst others
 *
 * @param {Object} opts - The options for initializing the machine state persistence.
 * @param {InitMachineStateArgs} opts - The arguments for initializing the machine state.
 * @param {IAgentContext<any>} opts.context - The agent context.
 * @returns {Promise<MachineStateInit | undefined>} - A promise that resolves to the initialized machine state, or undefined if the agent isn't using the Xstate plugin.
 */
export const machineStatePersistInit = async (
  opts: InitMachineStateArgs &
    Pick<MachineStatePersistenceOpts, 'existingInstanceId' | 'customInstanceId'> & {
      context: IAgentContext<any> // We use any as this method could be called from an agent with access to, but not exposing this plugin
    },
): Promise<MachineStateInit | undefined> => {
  // make sure the machine context does not end up in the machine state init args
  const { context, ...args } = opts
  if (!(context.agent.availableMethods().includes('machineStateInit') && 'machineStateInit' in context.agent)) {
    console.log(`IMachineStatePersistence was not exposed in the current agent. Not initializing new persistence object`)
    return
  }
  return await (context as IAgentContext<IMachineStatePersistence>).agent.machineStateInit(args)
}

/**
 * This function allows for the persistence of machine state on every xstate transition. It emits an event with the new state
 * and other relevant data to be handled by the persistence plugin when enabled.
 *
 * @param {Object} opts - The options object.
 * @param {Interpreter} opts.instance - The XState machine interpreter instance.
 * @param {IAgentContext<any>} opts.context - The agent context.
 * @param {MachineStateInit} opts.init - The initial persistence options, containing the unique instanceId.
 * @returns {Promise<void>} - A promise that resolves when the persistence event is emitted.
 */
export const machineStatePersistOnTransition = async <
  TContext = DefaultContext,
  TStateSchema extends StateSchema = any,
  TEvent extends EventObject = EventObject,
  TTypestate extends Typestate<TContext> = {
    value: any
    context: TContext
  },
  TResolvedTypesMeta = TypegenDisabled,
>(opts: {
  interpreter: Interpreter<TContext, TStateSchema, TEvent, TTypestate, TResolvedTypesMeta>
  context: IAgentContext<any> // We use any as this method could be called from an agent with access to, but not exposing this plugin
  init: MachineStateInit
  cleanupOnFinalState?: boolean
}): Promise<void> => {
  const { cleanupOnFinalState, context, init, interpreter } = opts
  const { machineState, ...initEventData } = init
  if (!(context.agent.availableMethods().includes('machineStatePersist') && 'machineStatePersist' in context.agent)) {
    console.log(`IMachineStatePersistence was not exposed in the current agent. Disabling machine state persistence events`)
    return
  }
  // We are using the event counter and evenDate to ensure we do not overwrite newer states. Events could come in out of order
  let _eventCounter = init.machineState?.updatedCount ?? 0

  // XState persistence plugin is available. So let's emit events on every transition, so it can persist the state
  interpreter.onChange(async (_machineContext) => {
    /*await (context.agent as TAgent<IMachineStatePersistence>).machineStatePersist({
          ...initEventData, // init value with machineState removed, as we are getting the latest state here
          state: interpreter.getSnapshot(),
          updatedCount: ++_eventCounter,
          cleanupOnFinalState: cleanupOnFinalState !== false,
        })*/
    emitMachineStatePersistEvent(
      {
        type: MachineStatePersistEventType.EVERY,
        data: {
          ...initEventData, // init value with machineState removed, as we are getting the latest state here
          state: interpreter.getSnapshot(),
          _eventCounter: ++_eventCounter,
          _eventDate: new Date(),
          _cleanupOnFinalState: cleanupOnFinalState !== false,
        },
      },
      context,
    )
  })
  if (cleanupOnFinalState && context.agent.availableMethods().includes('machineStateDelete')) {
    interpreter.onDone((doneEvent) => {
      ;(context.agent as TAgent<IMachineStatePersistence>).machineStateDelete({
        tenantId: initEventData.tenantId,
        instanceId: initEventData.instanceId,
      })
    })
  }
}

/**
 * Persist the initial state of a machine and register it with the given machine instance.
 *
 * @param {InitMachineStateArgs & {instance: Interpreter<TContext, TStateSchema, TEvent, TTypestate, TResolvedTypesMeta>, context: IAgentContext<any>}} args - The options for initializing
 * machine state and registering it.
 * @returns {Promise<MachineStateInit | undefined>} - A promise that resolves to the initial state of the machine, or undefined if the agent isn't using the Xstate plugin.
 */
export const machineStatePersistRegistration = async <
  TContext = DefaultContext,
  TStateSchema extends StateSchema = any,
  TEvent extends EventObject = EventObject,
  TTypestate extends Typestate<TContext> = {
    value: any
    context: TContext
  },
  TResolvedTypesMeta = TypegenDisabled,
>(
  args: Omit<InitMachineStateArgs, 'machineName'> &
    Partial<Pick<InitMachineStateArgs, 'machineName'>> &
    MachineStatePersistenceOpts & {
      cleanupOnFinalState?: boolean
      cleanupAllOtherInstances?: boolean
      interpreter: Interpreter<TContext, TStateSchema, TEvent, TTypestate, TResolvedTypesMeta>
      context: IAgentContext<any> // We use any as this method could be called from an agent with access to, but not exposing this plugin
    },
): Promise<MachineStateInit | undefined> => {
  const { disablePersistence } = args
  if (disablePersistence === true) {
    return
  }

  // We use expires in MS first. If not provided, look at expires at. If not provided, the persistence will not expire
  const expiresAt = args.expireInMS ? new Date(Date.now() + args.expireInMS) : args.expiresAt
  const machineName = args.machineName ?? args.interpreter.machine.id ?? args.interpreter.id
  const init = await machineStatePersistInit({ ...args, machineName, expiresAt })
  if (init) {
    await machineStatePersistOnTransition({ ...args, init })
  }
  return init
}

const assertNonExpired = (args: { expiresAt?: Date; machineName: string }) => {
  const { expiresAt, machineName } = args
  if (expiresAt && expiresAt.getTime() < Date.now()) {
    throw new Error(`Cannot resume ${machineName}. It expired at ${expiresAt.toLocaleString()}`)
  }
}

/**
 * Resumes the interpreter from a given state.
 *
 * @param {Object} args - The arguments for resuming the interpreter.
 * @param {MachineStateInfo} args.machineState - The machine state information.
 * @param {boolean} [args.noRegistration] - If true, no registration will be performed.
 * @param {Interpreter} args.interpreter - The interpreter instance.
 * @param {IAgentContext<IMachineStatePersistence>} args.context - The context for machine state persistence.
 *
 * @returns {Promise<Interpreter>} - A promise that resolves to the resumed interpreter.
 */
export const interpreterResumeFromState = async <
  TContext = DefaultContext,
  TStateSchema extends StateSchema = any,
  TEvent extends EventObject = EventObject,
  TTypestate extends Typestate<TContext> = {
    value: any
    context: TContext
  },
  TResolvedTypesMeta = TypegenDisabled,
>(args: {
  machineState: MachineStateInfo
  noRegistration?: boolean
  cleanupAllOtherInstances?: boolean
  cleanupOnFinalState?: boolean
  interpreter: Interpreter<TContext, TStateSchema, TEvent, TTypestate, TResolvedTypesMeta>
  context: IAgentContext<IMachineStatePersistence>
}): Promise<StartedInterpreterInfo<TContext, TStateSchema, TEvent, TTypestate, TResolvedTypesMeta>> => {
  const { interpreter, machineState, context, noRegistration, cleanupAllOtherInstances, cleanupOnFinalState } = args
  const { machineName, instanceId, tenantId } = machineState
  assertNonExpired(machineState)
  if (noRegistration !== true) {
    await machineStatePersistRegistration({
      stateType: 'existing',
      machineName,
      tenantId,
      existingInstanceId: instanceId,
      cleanupAllOtherInstances,
      cleanupOnFinalState,
      context,
      interpreter,
    })
  }
  const state = State.from(machineState.state.value, machineState.state.context)
  // @ts-ignore
  interpreter.start(state)
  // @ts-ignore
  await waitFor(interpreter, (awaitState) => awaitState.matches(state.value))

  return {
    machineState,
    init: machineStateToMachineInit(
      {
        ...machineState,
        stateType: 'existing',
      },
      machineStateToStoreInfo({ ...machineState, stateType: 'existing' }),
    ),

    interpreter,
  }
}

/**
 * Resumes or starts the interpreter from the initial machine state.
 *
 * @async
 * @param {Object} args - The arguments for the function.
 * @param {MachineStateInit & {stateType?: MachineStateInitType}} args.init - The initialization state of the machine.
 * @param {boolean} args.noRegistration - Whether registration is required, defaults to false.
 * @param {Interpreter<TContext, TStateSchema, TEvent, TTypestate, TResolvedTypesMeta>} args.interpreter - The interpreter object.
 * @param {IAgentContext<IMachineStatePersistence>} args.context - The context object.
 * @returns {Promise} - A promise that resolves to the interpreter instance.
 * @throws {Error} - If the machine name from init does not match the interpreter id.
 */
export const interpreterStartOrResumeFromInit = async <
  TContext = DefaultContext,
  TStateSchema extends StateSchema = any,
  TEvent extends EventObject = EventObject,
  TTypestate extends Typestate<TContext> = {
    value: any
    context: TContext
  },
  TResolvedTypesMeta = TypegenDisabled,
>(args: {
  init: MachineStateInit & { stateType?: MachineStateInitType }
  cleanupAllOtherInstances?: boolean
  cleanupOnFinalState?: boolean
  noRegistration?: boolean
  interpreter: Interpreter<TContext, TStateSchema, TEvent, TTypestate, TResolvedTypesMeta>
  context: IAgentContext<IMachineStatePersistence>
}): Promise<StartedInterpreterInfo<TContext, TStateSchema, TEvent, TTypestate, TResolvedTypesMeta>> => {
  const { init, noRegistration, interpreter, cleanupOnFinalState, cleanupAllOtherInstances, context } = args
  const { stateType, instanceId, machineName, tenantId, expiresAt } = init
  if (init.machineName !== interpreter.id) {
    throw new Error(`Machine state init machine name ${init.machineName} does not match name from state machine interpreter ${interpreter.id}`)
  }
  assertNonExpired({ machineName, expiresAt })
  if (noRegistration !== true) {
    await machineStatePersistRegistration({
      stateType: stateType ?? 'existing',
      machineName,
      tenantId,
      ...(stateType === 'existing' && { existingInstanceId: instanceId }),
      ...(stateType === 'new' && { customInstanceId: instanceId }),
      cleanupAllOtherInstances,
      cleanupOnFinalState,
      context,
      interpreter,
    })
  }
  let machineState: MachineStateInfo | undefined
  if (stateType === 'new') {
    interpreter.start()
  } else {
    machineState = await context.agent.machineStateGet({ tenantId, instanceId })
    // @ts-ignore
    interpreter.start(machineState.state)
  }
  // We are waiting a bit
  await new Promise((res) => setTimeout(res, 50))
  return {
    interpreter,
    machineState,
    init,
  }
}

/**
 * Starts or resumes the given state machine interpreter.
 *
 * @async
 * @param {Object} args - The arguments for starting or resuming the interpreter.
 * @param {MachineStateInitType | 'auto'} [args.stateType] - The state type. Defaults to 'auto'.
 * @param {string} [args.instanceId] - The instance ID.
 * @param {string} [args.machineName] - The machine name.
 * @param {string} [args.tenantId] - The tenant ID.
 * @param {boolean} args.singletonCheck - Whether to perform a singleton check or not. If more than one machine instance is found an error will be thrown
 * @param {boolean} [args.noRegistration] - Whether to skip state change event registration or not.
 * @param {Interpreter<TContext, TStateSchema, TEvent, TTypestate, TResolvedTypesMeta>} args.interpreter - The interpreter to start or resume.
 * @param {IAgentContext<IMachineStatePersistence>} args.context - The agent context.
 * @returns {Promise} A promise that resolves when the interpreter is started or resumed.
 * @throws {Error} If there are multiple active instances of the machine and singletonCheck is true.
 * @throws {Error} If a new instance was requested with the same ID as an existing active instance.
 * @throws {Error} If the existing state machine with the given machine name and instance ID cannot be found.
 */
export const interpreterStartOrResume = async <
  TContext = DefaultContext,
  TStateSchema extends StateSchema = any,
  TEvent extends EventObject = EventObject,
  TTypestate extends Typestate<TContext> = {
    value: any
    context: TContext
  },
  TResolvedTypesMeta = TypegenDisabled,
>(args: {
  stateType?: MachineStateInitType | 'auto'
  instanceId?: string
  machineName?: string
  tenantId?: string
  singletonCheck: boolean
  noRegistration?: boolean
  cleanupAllOtherInstances?: boolean
  cleanupOnFinalState?: boolean
  interpreter: Interpreter<TContext, TStateSchema, TEvent, TTypestate, TResolvedTypesMeta>
  context: IAgentContext<IMachineStatePersistence>
}): Promise<StartedInterpreterInfo<TContext, TStateSchema, TEvent, TTypestate, TResolvedTypesMeta>> => {
  const { stateType, singletonCheck, instanceId, tenantId, noRegistration, context, interpreter, cleanupAllOtherInstances, cleanupOnFinalState } =
    args
  const machineName = args.machineName ?? interpreter.id
  let activeStates = await context.agent.machineStatesFindActive({
    machineName,
    tenantId,
    instanceId,
  })
  if (stateType === 'new' && activeStates.length > 0 && cleanupAllOtherInstances) {
    // We cleanup here to not influence the logic below. Normally the agent machineStateInit method does the cleanup
    await Promise.all(
      activeStates.map((state) =>
        context.agent.machineStateDelete({
          tenantId: args.tenantId,
          instanceId: state.instanceId,
        }),
      ),
    )
    // We search again, given the delete is using the passed in tenantId, instead of relying on the persisted tenantId. Should not matter, but just making sure
    activeStates = await context.agent.machineStatesFindActive({
      machineName,
      tenantId,
      instanceId,
    })
  }
  if (singletonCheck && activeStates.length > 0) {
    if (
      stateType === 'new' ||
      (stateType === 'existing' &&
        ((!instanceId && activeStates.length > 1) || (instanceId && activeStates.every((state) => state.instanceId !== instanceId))))
    ) {
      return Promise.reject(new Error(`Found ${activeStates.length} active '${machineName}' instances, but only one is allows at the same time`))
    }
  }
  if (stateType === 'new') {
    if (instanceId && activeStates.length > 0) {
      // Since an instanceId was provided it means the activeStates includes a machine with this instance. But stateType is 'new'
      return Promise.reject(
        new Error(`Found an active '${machineName}' instance with id ${instanceId}, but a new instance was requested with the same id`),
      )
    }
    const init = await context.agent.machineStateInit({
      stateType: 'new',
      customInstanceId: instanceId,
      machineName: machineName ?? interpreter.id,
      tenantId,
      cleanupAllOtherInstances,
    })
    return await interpreterStartOrResumeFromInit({
      init,
      noRegistration,
      interpreter,
      context,
      cleanupOnFinalState,
      cleanupAllOtherInstances,
    })
  }
  if (activeStates.length === 0) {
    if (stateType === 'existing') {
      return Promise.reject(new Error(`Could not find existing state machine ${machineName}, instanceId ${instanceId}`))
    }
    const init = await context.agent.machineStateInit({
      stateType: 'new',
      customInstanceId: instanceId,
      machineName: machineName ?? interpreter.id,
      tenantId,
      cleanupAllOtherInstances,
    })
    return await interpreterStartOrResumeFromInit({
      init,
      noRegistration,
      interpreter,
      context,
      cleanupOnFinalState,
      cleanupAllOtherInstances,
    })
  }

  // activeStates length >= 1
  const activeState = activeStates[0]
  return interpreterResumeFromState({
    machineState: activeState,
    noRegistration,
    interpreter,
    context,
    cleanupOnFinalState,
    cleanupAllOtherInstances,
  })
}
