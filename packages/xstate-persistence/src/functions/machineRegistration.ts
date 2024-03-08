import { IAgentContext } from '@veramo/core'
import { DefaultContext, EventObject, Interpreter, StateSchema, TypegenDisabled, Typestate } from 'xstate'
import { IMachineStatePersistence, InitMachineStateArgs, MachineStateInit, MachineStatePersistenceOpts, MachineStatePersistEventType } from '../types'
import { emitMachineStatePersistEvent } from './stateEventEmitter'

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
    }
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
  TResolvedTypesMeta = TypegenDisabled
>(opts: {
  interpreter: Interpreter<TContext, TStateSchema, TEvent, TTypestate, TResolvedTypesMeta>
  context: IAgentContext<any> // We use any as this method could be called from an agent with access to, but not exposing this plugin
  init: MachineStateInit
}): Promise<void> => {
  const { context, init, interpreter } = opts
  if (!(context.agent.availableMethods().includes('machineStatePersist') && 'machineStatePersist' in context.agent)) {
    console.log(`IMachineStatePersistence was not exposed in the current agent. Disabling machine state persistence events`)
    return
  }
  // We are using the event counter and evenDate to ensure we do not overwrite newer states. Events could come in out of order
  let _eventCounter = 0

  // XState persistence plugin is available. So let's emit events on every transition, so it can persist the state
  interpreter.subscribe((state) => {
    emitMachineStatePersistEvent(
      {
        type: MachineStatePersistEventType.EVERY,
        data: {
          ...init,
          state,
          _eventCounter: _eventCounter++,
          _eventDate: new Date(),
        },
      },
      context
    )
  })
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
  TResolvedTypesMeta = TypegenDisabled
>(
  args: Omit<InitMachineStateArgs, 'machineName'> &
    Partial<Pick<InitMachineStateArgs, 'machineName'>> &
    MachineStatePersistenceOpts & {
      interpreter: Interpreter<TContext, TStateSchema, TEvent, TTypestate, TResolvedTypesMeta>
      context: IAgentContext<any> // We use any as this method could be called from an agent with access to, but not exposing this plugin
    }
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
