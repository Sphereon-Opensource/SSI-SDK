import Debug from 'debug'
import { MachineStatePersistEvent, RequiredContext } from '../types'

const debug = Debug('sphereon:ssi-sdk:machine-state:xstate-persistence')
export const emitMachineStatePersistEvent = (event: MachineStatePersistEvent, context: RequiredContext) => {
  debug(`Emitting machine state persistence event '${event.type}' with counter: ${event.data._eventCounter}`)
  void context.agent.emit(event.type, event.data)
}
