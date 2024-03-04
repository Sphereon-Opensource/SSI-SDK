export type SaveStateArgs = {
  step: string
  type: string
  eventName: string
  state: string
  expiresAt?: Date
  completedAt?: Date
  tenantId?: string
}

export type GetStateArgs = Pick<SaveStateArgs, 'type'>

export type FindStatesArgs = Partial<SaveStateArgs>

export type GetStatesArgs = {
  filter: FindStatesArgs
}

export type NonPersistedXStateStoreEvent = SaveStateArgs

export type DeleteStateArgs = { id: string }
export type DeleteExpiredStateArgs = { type?: string }

export type State = {
  id: string
  /**
   * value of the state. top level of eventName. examples: acceptAgreement, enterPersonalDetails
   */
  step: string
  /**
   * Machine id
   */
  type: string
  /**
   * event name like SET_TOC, SET_FIRSTNAME, ...
   */
  eventName: string
  /**
   * stringified value of the state
   */
  state: string
  createdAt: Date
  expiresAt?: Date
  updatedAt: Date
  completedAt?: Date
  tenantId?: string
}
