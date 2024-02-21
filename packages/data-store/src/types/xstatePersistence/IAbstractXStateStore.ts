import {ObjectLiteral} from "typeorm";

export type SaveStateArgs = {
    state: string
    type: string
    createdAt?: Date
    updatedAt?: Date
    completedAt?: Date
    tenantId?: string
}

export type GetStateArgs = Pick<SaveStateArgs, 'type'>

export type FindStatesArgs = Partial<SaveStateArgs>

export type GetStatesArgs = {
    filter: FindStatesArgs
}

export type NonPersistedXStateStoreEvent = SaveStateArgs

export type DeleteStateArgs = { where: string, parameters?: ObjectLiteral }

export type VoidResult = void

export type State = {
    state: string
    type: string
    createdAt: Date
    updatedAt: Date
    completedAt?: Date
    tenantId?: string
}
