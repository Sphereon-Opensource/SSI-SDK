import {State} from "../entities/State";

export type PersistStateArgs = {
    state: string
    type: string
    createdAt: Date
    updatedAt: Date
    completedAt: Date
    tenantId: string
    ttl?: number
}

export type LoadStateArgs = Pick<PersistStateArgs, 'type'>

export type DeleteStateArgs = LoadStateArgs

export type PersistStateResult = void

export type LoadStateResult = State | null

export type DeleteStateResult = PersistStateResult
