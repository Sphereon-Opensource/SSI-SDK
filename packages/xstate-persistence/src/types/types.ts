import {GetStateArgs, IAbstractXStateStore, SaveStateArgs, State, VoidResult} from "@sphereon/ssi-sdk.data-store";
import {IAgentContext} from "@veramo/core";

import {IXStatePersistence} from "./IXStatePersistence";

export type XStateStateManagerOptions = { store: IAbstractXStateStore, eventTypes: Array<string> }

export enum XStatePersistenceEventType {
    EVERY = 'every'
}

export type PersistStateArgs = SaveStateArgs

export type NonPersistedXStatePersistenceEvent = SaveStateArgs

export type LoadStateArgs = GetStateArgs

export type DeleteStateArgs = GetStateArgs

export type PersistStateResult = VoidResult

export type LoadStateResult = State

export type DeleteStateResult = VoidResult

export type OnEventResult = VoidResult

export type XStatePersistenceEvent = {
    type: XStatePersistenceEventType,
    data: NonPersistedXStatePersistenceEvent
}

export type RequiredContext = IAgentContext<IXStatePersistence>
