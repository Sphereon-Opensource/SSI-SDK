import {IAbstractXStateStore, XStateEntity} from "@sphereon/ssi-sdk.data-store";
import {IAgentContext} from "@veramo/core";

import {IXStatePersistence} from "./IXStatePersistence";

export type XStateStateManagerOptions = { store: IAbstractXStateStore, eventTypes: Array<string> }

export enum XStateStateManagerEventType {
    EVERY = 'every'
}

export type PersistStateArgs = {
    state: string
    type: string
    createdAt: Date
    updatedAt: Date
    completedAt: Date
    tenantId?: string
    ttl: number
}

export type NonPersistedXStateStateManagerEvent = PersistStateArgs

export type LoadStateArgs = Pick<PersistStateArgs, 'type'>

export type DeleteStateArgs = LoadStateArgs

export type PersistStateResult = void

export type LoadStateResult = XStateEntity | null

export type DeleteStateResult = PersistStateResult

export type OnEventResult = PersistStateResult

export type XStateStateManagerEvent = {
    type: XStateStateManagerEventType,
    data: NonPersistedXStateStateManagerEvent
}

export type RequiredContext = IAgentContext<IXStatePersistence>
