import Debug from 'debug'
import { MachineStatePersistEvent, RequiredContext } from '../types'

const debug = Debug('sphereon:ssi-sdk:machine-state:xstate-persistence')

/**
 * Emits a machine state persistence event.
 *
 * @param {MachineStatePersistEvent} event - The event to be emitted.
 * @param {RequiredContext} context - The required agent context for the event emission.
 * @returns {void}
 */
export const emitMachineStatePersistEvent = (event: MachineStatePersistEvent, context: RequiredContext) => {
  debug(
    `Emitting machine state persistence event '${event.type}' with counter: ${event.data._eventCounter} and state ${JSON.stringify(
      event.data.state.value,
    )}`,
  )
  void context.agent.emit(event.type, event.data)
}
