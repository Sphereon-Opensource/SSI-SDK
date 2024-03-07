import { StoreMachineStateInfo } from '@sphereon/ssi-sdk.data-store'
import { State } from 'xstate'
import { EventObject } from 'xstate/lib/types'
import { MachineStatePersistArgs, SerializableState } from '../types'

export const machineStateToStoreInfo = (
  machineInfo: MachineStatePersistArgs,
  existingState?: Partial<StoreMachineStateInfo>
): StoreMachineStateInfo => {
  const { state, machineName, tenantId, expiresAt, instanceId, updatedCount } = machineInfo

  const existing: Partial<StoreMachineStateInfo> = existingState ?? { machineName, createdAt: new Date(), expiresAt }
  const stateInstance = State.create(machineInfo.state)
  let latestStateName = undefined
  if (stateInstance.value) {
    latestStateName = typeof stateInstance.value === 'string' ? stateInstance.value : JSON.stringify(stateInstance.value)
  }
  if (latestStateName === '{}') {
    latestStateName = undefined
  }
  return {
    instanceId,
    updatedCount: updatedCount ?? (existing?.updatedCount ? existing.updatedCount++ : 0),
    sessionId: stateInstance._sessionid ?? undefined,
    machineName,
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

export const serializeMachineState = <T, TEvent extends EventObject>(state: State<T, TEvent> | SerializableState | string): string => {
  if (typeof state === 'string') {
    return state
  }
  const jsonState = 'toJSON' in state ? state.toJSON() : state
  return JSON.stringify(jsonState)
}
export const deserializeMachineState = <T, TEvent extends EventObject>(state: string): State<T, TEvent> => {
  return State.create(JSON.parse(state))
}
