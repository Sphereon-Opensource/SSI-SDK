export type StoreMachineStatePersistArgs = Omit<StoreMachineStateInfo, 'createdAt' | 'updatedAt'>

export type StoreMachineStatesFindActiveArgs = Partial<Pick<StoreMachineStateInfo, 'machineName' | 'tenantId' | 'instanceId'>>

export type FindMachineStatesFilterArgs = Array<Partial<Omit<StoreMachineStateInfo, 'state'>>>

export type StoreFindMachineStatesArgs = {
  filter: FindMachineStatesFilterArgs
}

export type StoreMachineStateGetArgs = Pick<StoreMachineStateInfo, 'instanceId' | 'tenantId'>

export type StoreMachineStateDeleteArgs = StoreMachineStateGetArgs
export type StoreMachineStateDeleteExpiredArgs = { machineName?: string; tenantId?: string; deleteDoneStates?: boolean }

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

  /**
   * Represents the creation date
   */
  createdAt: Date

  /**
   * Represents the expiration date
   */
  expiresAt?: Date

  /**
   * Represents the update date
   */
  updatedAt: Date

  /**
   * Represents a counter for tracking updates.
   */
  updatedCount: number
  completedAt?: Date
  tenantId?: string
}
