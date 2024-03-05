export type SaveStateArgs = Omit<State, 'id' | 'createdAt' | 'updatedAt'>

export type GetActiveStateArgs = Pick<State, 'machineType' | 'tenantId'>

export type FindStatesArgs = Array<Partial<Omit<State, 'state'>>>

export type GetStatesArgs = {
  filter: FindStatesArgs
}

export type NonPersistedXStateStoreEvent = SaveStateArgs

export type DeleteStateArgs = { id: string }
export type DeleteExpiredStateArgs = { machineType?: string }

export type State = {
  id: string
  /**
   * value of the state's name. top level of event type. examples: acceptAgreement, enterPersonalDetails
   */
  stateName: string
  /**
   * Machine type/id
   */
  machineType: string
  /**
   * event types like SET_TOC, SET_FIRSTNAME, ...
   */
  xStateEventType: string
  /**
   * state of the machine in this snapshot
   */
  state: unknown
  createdAt: Date
  expiresAt?: Date
  updatedAt: Date
  completedAt?: Date
  tenantId?: string
}
