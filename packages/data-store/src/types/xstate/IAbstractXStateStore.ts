export type StorePersistMachineArgs = Omit<StoreMachineStateInfo, 'createdAt' | 'updatedAt'>

export type StoreFindActiveMachinesArgs = Pick<StoreMachineStateInfo, 'machineId' | 'tenantId'>

export type FindMachinesFilterArgs = Array<Partial<Omit<StoreMachineStateInfo, 'state'>>>

export type StoreFindMachinesArgs = {
  filter: FindMachinesFilterArgs
}

export type StoreGetMachineArgs = {
  id: string
}

// export type NonPersistedXStateStoreEvent = StoreSaveMachineArgs

export type StoreDeleteMachineArgs = StoreGetMachineArgs
export type StoreDeleteExpiredMachineArgs = { machineId?: string }

export type StoreMachineStateInfo = {
  /**
   * Unique instance ID of the machine
   */
  id: string // Todo add session id
  /**
   * Machine type/id
   */
  machineId: string
  /**
   * The latest state name. Can be empty for a newly initialize machine
   */
  latestStateName?: string
  /**
   * event types like SET_TOC, SET_FIRSTNAME, .... Will be xstate.init on a newly initialized machine
   */
  latestEventType: string
  /**
   * Machine state exported to JSON with the toJSON() method
   */
  state: string
  createdAt: Date
  expiresAt?: Date
  updatedAt: Date
  completedAt?: Date
  tenantId?: string
}
