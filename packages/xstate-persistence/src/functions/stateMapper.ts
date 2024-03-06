import { StoreMachineStateInfo } from '@sphereon/ssi-sdk.data-store'
import { State } from 'xstate'
import { EventObject } from 'xstate/lib/types'
import { MachineStatePersistArgs, SerializableState } from '../types'

export const machineStateToStoreInfo = (
  machineInfo: MachineStatePersistArgs,
  existingState?: Partial<StoreMachineStateInfo>
): StoreMachineStateInfo => {
  const { state, machineId, tenantId, expiresAt } = machineInfo

  const existing: Partial<StoreMachineStateInfo> = existingState ?? { machineId, createdAt: new Date(), expiresAt }
  const stateInstance = State.create(machineInfo.state)
  if (!stateInstance._sessionid) {
    throw Error(`No session id found for state machine ${machineId}`)
  }
  let latestStateName = undefined
  if (stateInstance.value) {
    latestStateName = typeof stateInstance.value === 'string' ? stateInstance.value : JSON.stringify(stateInstance.value)
  }
  return {
    id: stateInstance._sessionid,
    machineId,
    state: serializeMachineState(state),
    tenantId,
    latestStateName,
    latestEventType: stateInstance.event.type,
    updatedAt: new Date(),
    expiresAt,
    createdAt: existing.createdAt ?? new Date(),
    completedAt: existing.completedAt ?? (stateInstance.done ? new Date() : undefined),
  }
}

export const serializeMachineState = <T, TEvent extends EventObject>(state: State<T, TEvent> | SerializableState): string => {
  const jsonState = 'toJSON' in state ? state.toJSON() : state
  return JSON.stringify(jsonState)
}
export const deserializeMachineState = <T, TEvent extends EventObject>(state: string): State<T, TEvent> => {
  return State.create(JSON.parse(state))
}
