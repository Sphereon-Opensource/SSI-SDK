import {XStateEntity} from "../../entities/xstatePersistence/XStateEntity";

export type PersistStateArgs = {
    state: string
    type: string
    createdAt: Date
    updatedAt: Date
    completedAt: Date
    tenantId?: string
    ttl: number
}

export type LoadStateArgs = Pick<PersistStateArgs, 'type'>

export type DeleteStateArgs = Pick<PersistStateArgs, 'type'>

export type VoidResult = void

export type LoadStateResult = XStateEntity | null
