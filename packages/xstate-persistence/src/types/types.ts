import {
  IAbstractMachineStateStore,
  StoreMachineStateDeleteExpiredArgs,
  StoreMachineStateInfo,
  StoreMachineStatesFindActiveArgs,
} from '@sphereon/ssi-sdk.data-store'
import { IAgentContext } from '@veramo/core'
import { AnyEventObject, EventObject, HistoryValue, SCXML, StateValue } from 'xstate'

import { IMachineStatePersistence } from './IMachineStatePersistence'

export type MachineStatePersistOpts = { store: IAbstractMachineStateStore; eventTypes: Array<string> }

export enum MachineStatePersistEventType {
  INIT = 'INIT',
  EVERY = 'EVERY',
}

export type DeleteExpiredStatesArgs = Pick<StoreMachineStateDeleteExpiredArgs, 'deleteDoneStates' | 'machineName' | 'tenantId'>

export type FindActiveStatesArgs = StoreMachineStatesFindActiveArgs

export type DeleteStateResult = number

export type MachineStatePersistEvent = {
  type: MachineStatePersistEventType
  data: MachineStatePersistArgs & { _eventCounter: number; _eventDate: Date }
}

export type RequiredContext = IAgentContext<IMachineStatePersistence>

export type MachineStateInfo = Omit<StoreMachineStateInfo, 'state'> & {
  state: SerializableState
}

export type MachineStateInit = Pick<MachineStateInfo, 'instanceId' | 'machineName' | 'tenantId' | 'createdAt' | 'expiresAt'>

export type InitMachineStateArgs = Partial<MachineStateInit> & Pick<MachineStateInfo, 'machineName'>

export type MachineStatePersistArgs = Omit<MachineStateInit, 'createdAt'> &
  Pick<MachineStateInfo, 'state' | 'instanceId'> &
  Partial<Pick<MachineStateInfo, 'updatedCount'>>

export type MachineStateGetArgs = Pick<StoreMachineStateInfo, 'instanceId' | 'tenantId'>
export type MachineStateDeleteArgs = Pick<StoreMachineStateInfo, 'instanceId' | 'tenantId'>

export type SerializableState = XStateConfig<any, AnyEventObject>

// Simplified StateConfig object from XState so we have a minimal typed structure
export interface XStateConfig<TContext, TEvent extends EventObject> {
  value: StateValue
  context: TContext
  _event: SCXML.Event<TEvent>
  _sessionid: string | null
  historyValue?: HistoryValue | undefined
  history?: any
  actions?: Array<any>
  activities?: any
  meta?: any
  events?: TEvent[]
  configuration: Array<any>
  transitions: Array<any>
  children: Record<string, any>
  done?: boolean
  tags?: Set<string>
  machine?: any
}
