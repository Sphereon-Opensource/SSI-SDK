import { GetStateArgs, IAbstractXStateStore, SaveStateArgs, State } from '@sphereon/ssi-sdk.data-store'
import { IAgentContext } from '@veramo/core'

import { IXStatePersistence } from './IXStatePersistence'

export type XStateStateManagerOptions = { store: IAbstractXStateStore; eventTypes: Array<string> }

export enum XStatePersistenceEventType {
  EVERY = 'every',
}

export type DeleteExpiredStatesArgs = {
  type?: string
}

export type NonPersistedMachineSnapshot = SaveStateArgs

export type LoadStateArgs = GetStateArgs

export type LoadStateResult = State

export type DeleteStateResult = boolean

export type XStatePersistenceEvent = {
  type: XStatePersistenceEventType
  data: NonPersistedMachineSnapshot
}

export type RequiredContext = IAgentContext<IXStatePersistence>
