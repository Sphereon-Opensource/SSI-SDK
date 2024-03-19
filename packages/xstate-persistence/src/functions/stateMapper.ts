import { StoreMachineStateInfo } from '@sphereon/ssi-sdk.data-store'
import { State } from 'xstate'
import { EventObject } from 'xstate/lib/types'
import { MachineStateInfo, MachineStateInit, MachineStateInitType, MachineStatePersistArgs, SerializableState } from '../types'

/**
 * Create a machine state info object useful for the store, based on the provided machine info and existing state.
 *
 * @param {MachineStatePersistArgs} machineInfo - The machine info object.
 * @param {Partial<StoreMachineStateInfo>} [existingState] - The optional existing state object.
 * @returns {StoreMachineStateInfo} - The store machine state info object.
 */
export const machineStateToStoreInfo = (
  machineInfo: MachineStatePersistArgs,
  existingState?: Partial<StoreMachineStateInfo>,
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
export const storeInfoToMachineInit = (
  args: StoreMachineStateInfo & { stateType: MachineStateInitType; machineState?: MachineStateInfo },
): MachineStateInit => {
  const { instanceId, machineName, tenantId, expiresAt, createdAt, stateType, machineState } = args
  return {
    stateType,
    machineName,
    tenantId,
    expiresAt,
    instanceId,
    createdAt,
    machineState,
  }
}

export const machineStateToMachineInit = (machineInfo: MachineStatePersistArgs, existingState: Partial<StoreMachineStateInfo>): MachineStateInit => {
  return storeInfoToMachineInit({
    ...machineStateToStoreInfo(machineInfo, existingState),
    stateType: 'existing',
    machineState: machineInfo.machineState,
  })
}

/**
 * Serializes a machine state to a string representation.
 *
 * @param {State<T, TEvent> | SerializableState | string} state - The machine state to serialize.
 * @returns {string} - The serialized machine state.
 */
export const serializeMachineState = <T, TEvent extends EventObject>(state: State<T, TEvent> | SerializableState | string): string => {
  if (typeof state === 'string') {
    return state
  }
  const jsonState = 'toJSON' in state ? state.toJSON() : state
  return JSON.stringify(jsonState)
}
/**
 * Deserializes a serialized machine state.
 *
 * @template T - The type of the machine's context.
 * @template TEvent - The type of the events that the machine handles.
 * @param {string} state - The serialized machine state.
 * @returns {State<T, TEvent>} - The deserialized machine state.
 */
export const deserializeMachineState = <T, TEvent extends EventObject>(state: string): State<T, TEvent> => {
  return State.create(JSON.parse(state))
}
