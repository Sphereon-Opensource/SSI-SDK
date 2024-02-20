export type SaveStateArgs = {
    state: string
    type: string
    createdAt?: Date
    updatedAt?: Date
    completedAt?: Date
    tenantId?: string
    ttl: number
}

export type GetStateArgs = Pick<SaveStateArgs, 'type'>

export type NonPersistedXStateStoreEvent = SaveStateArgs

export type DeleteStateArgs = Pick<SaveStateArgs, 'type'>

export type VoidResult = void

export type State = {
    state: string
    type: string
    createdAt: Date
    updatedAt: Date
    completedAt?: Date
    tenantId?: string
    ttl: number
}
