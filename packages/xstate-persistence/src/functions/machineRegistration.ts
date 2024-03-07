import { IAgentContext } from '@veramo/core'
import { DefaultContext, EventObject, Interpreter, StateSchema, TypegenDisabled, Typestate } from 'xstate'
import { InitMachineStateArgs, MachineStateInit, MachineStatePersistEventType } from '../types'
import { emitMachineStatePersistEvent } from './stateEventEmitter'

export const machineStatePersistInit = async (
  opts: InitMachineStateArgs & {
    context: IAgentContext<any> // We use any as this method could be called from an agent with access to, but not exposing this plugin
  }
): Promise<MachineStateInit | undefined> => {
  const { context, ...args } = opts
  if (!(context.agent.availableMethods().includes('machineStateInit') && 'machineStateInit' in context.agent)) {
    console.log(`IMachineStatePersistence was not exposed in the current agent. Not initializing new persistence object`)
    return
  }
  return await context.agent.machineStateInit(args)
}

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
  instance: Interpreter<TContext, TStateSchema, TEvent, TTypestate, TResolvedTypesMeta>
  context: IAgentContext<any> // We use any as this method could be called from an agent with access to, but not exposing this plugin
  init: MachineStateInit
}): Promise<void> => {
  const { context, init, instance } = opts
  if (!(context.agent.availableMethods().includes('machineStatePersist') && 'machineStatePersist' in context.agent)) {
    console.log(`IMachineStatePersistence was not exposed in the current agent. Disabling machine state persistence events`)
    return
  }
  // We are using the event counter and evenDate to ensure we do not overwrite newer states. Events could come in out of order
  let _eventCounter = 0

  // XState persistence plugin is available. So let's emit events on every transition, so it can persist the state
  instance.subscribe((state) => {
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
  opts: InitMachineStateArgs & {
    instance: Interpreter<TContext, TStateSchema, TEvent, TTypestate, TResolvedTypesMeta>
    context: IAgentContext<any> // We use any as this method could be called from an agent with access to, but not exposing this plugin
  }
): Promise<MachineStateInit | undefined> => {
  const init = await machineStatePersistInit(opts)
  if (init) {
    await machineStatePersistOnTransition({ ...opts, init })
  }
  return init
}
