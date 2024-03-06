import { IAbstractMachineStateInfoStore, StoreFindActiveMachinesArgs, StoreMachineStateInfo } from '@sphereon/ssi-sdk.data-store'
import { IAgentContext } from '@veramo/core'
import { AnyEventObject, HistoryValue, SCXML, StateValue } from 'xstate'
import { EventObject } from 'xstate/lib/types'

import { IMachineStatePersistence } from './IMachineStatePersistence'

export type MachineStatePersistOpts = { store: IAbstractMachineStateInfoStore; eventTypes: Array<string> }

export enum MachineStatePersistEventType {
  EVERY = 'every',
}

export type DeleteExpiredStatesArgs = Pick<StoreMachineStateInfo, 'machineId'>

export type NonPersistedMachineInstance = MachineStatePersistArgs

export type FindActiveStatesArgs = StoreFindActiveMachinesArgs

export type DeleteStateResult = boolean

export type MachineStatePersistEvent = {
  type: MachineStatePersistEventType
  data: NonPersistedMachineInstance
}

export type RequiredContext = IAgentContext<IMachineStatePersistence>

export type MachineStateInfo = Omit<StoreMachineStateInfo, 'state'> & {
  state: SerializableState
}

export type MachineStatePersistArgs = Pick<MachineStateInfo, 'state' | 'machineId' | 'expiresAt' | 'tenantId'>

// export type SerializableState = XStateConfig<any, AnyEventObject>
export type SerializableState = XStateConfig<any, AnyEventObject>

/*
export type XStateNode = Omit<StateNode, 'initial'| 'states'> & { initial?: any, states?: any}*/

// Simplified StateConfig object from XState so we have a minimal typed structure
export interface XStateConfig<TContext, TEvent extends EventObject> {
  value: StateValue
  context: TContext
  _event: SCXML.Event<TEvent>
  _sessionid: string | null
  historyValue?: HistoryValue | undefined

  // @ts-ignore
  history?: any

  actions?: Array<any>

  /**
   * @deprecated
   */
  activities?: any
  meta?: any
  /**
   * @deprecated
   */
  events?: TEvent[]
  configuration: Array<any>
  transitions: Array<any>
  children: Record<string, any>
  done?: boolean
  tags?: Set<string>
  machine?: any
}
