
import {IAgentContext} from "@veramo/core";
import {OrPromise} from "@veramo/utils";
import {DataSource} from "typeorm";

import {State} from "../entities/State";

import {IXStateStateManager} from "./IXStateStateManager";

export type XStateStateManagerOptions = { dbConnection: OrPromise<DataSource>, eventTypes: Array<string> }

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

export type LoadStateResult = State | null

export type DeleteStateResult = PersistStateResult

export type OnEventResult = PersistStateResult

export type XStateStateManagerEvent = {
    type: XStateStateManagerEventType,
    data: NonPersistedXStateStateManagerEvent
}

export type RequiredContext = IAgentContext<IXStateStateManager>
