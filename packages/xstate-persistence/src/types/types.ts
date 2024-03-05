import { GetActiveStateArgs, IAbstractXStateStore, SaveStateArgs, State } from '@sphereon/ssi-sdk.data-store'
import { IAgentContext } from '@veramo/core'

import { IXStatePersistence } from './IXStatePersistence'

export type XStateStateManagerOptions = { store: IAbstractXStateStore; eventTypes: Array<string> }

export enum XStatePersistenceEventType {
  EVERY = 'every',
}

export type DeleteExpiredStatesArgs = Pick<State, 'machineType'>

export type NonPersistedMachineSnapshot = SaveStateArgs

export type LoadActiveStateArgs = GetActiveStateArgs

export type DeleteStateResult = boolean

export type XStatePersistenceEvent = {
  type: XStatePersistenceEventType
  data: NonPersistedMachineSnapshot
}

export type RequiredContext = IAgentContext<IXStatePersistence>
