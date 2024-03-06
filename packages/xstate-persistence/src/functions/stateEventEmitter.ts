import { RequiredContext, MachineStatePersistEvent } from '../types'

export const emitMachineStatePersistEvent = (event: MachineStatePersistEvent, context: RequiredContext) => {
  void context.agent.emit(event.type, event.data)
}
