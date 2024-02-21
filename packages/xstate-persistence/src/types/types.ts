import {GetStateArgs, IAbstractXStateStore, SaveStateArgs, State, VoidResult} from "@sphereon/ssi-sdk.data-store";
import {IAgentContext} from "@veramo/core";

import {IXStatePersistence} from "./IXStatePersistence";

export type XStateStateManagerOptions = { store: IAbstractXStateStore, eventTypes: Array<string> }

export enum XStatePersistenceEventType {
    EVERY = 'every'
}

export enum SQLDialect {
    SQLite3 = 'SQLite3',
    PostgreSQL = 'PostgreSQL',
}

export type DeleteExpiredStatesArgs = {
    duration: number,
    dialect: SQLDialect,
}

export type NonPersistedXStatePersistenceEvent = SaveStateArgs

export type LoadStateArgs = GetStateArgs

export type LoadStateResult = State

export type DeleteStateResult = VoidResult

export type OnEventResult = VoidResult

export type XStatePersistenceEvent = {
    type: XStatePersistenceEventType,
    data: NonPersistedXStatePersistenceEvent
}

export type RequiredContext = IAgentContext<IXStatePersistence>
