export type StoreMachineStatePersistArgs = Omit<StoreMachineStateInfo, 'createdAt' | 'updatedAt'>

export type StoreMachineStatesFindActiveArgs = Partial<Pick<StoreMachineStateInfo, 'machineName' | 'tenantId' | 'sessionId'>>

export type FindMachineStatesFilterArgs = Array<Partial<Omit<StoreMachineStateInfo, 'state'>>>

export type StoreFindMachineStatesArgs = {
  filter: FindMachineStatesFilterArgs
}

export type StoreMachineStateGetArgs = {
  id: string
}

export type StoreMachineStateDeleteArgs = StoreMachineStateGetArgs
export type StoreMachineStateDeleteExpiredArgs = { machineName?: string }

export interface StoreMachineStateInfo {
  /**
   * Unique instance ID of the machine
   */
  instanceId: string

  /**
   * Session Id of the machine. Not necessarily unique
   */
  sessionId?: string

  /**
   * Machine name
   */
  machineName: string

  /**
   * The latest state name. Can be empty for a newly initialize machine
   */
  latestStateName?: string

  /**
   * event types like SET_TOC, SET_FIRSTNAME, .... Will be xstate.init on a newly initialized machine
   */
  latestEventType: string

  /**
   * Serialized Machine state
   */
  state: string
  createdAt: Date
  expiresAt?: Date
  updatedAt: Date
  completedAt?: Date
  tenantId?: string
}
