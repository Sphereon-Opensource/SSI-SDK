import {IAbstractXStateStore} from "@sphereon/ssi-sdk.data-store";
import {IAgentPlugin,} from '@veramo/core'

import {
    DeleteStateResult,
    OnEventResult,
    PersistStateResult,
    RequiredContext,
    schema,
    XStatePersistenceEvent,
    XStatePersistenceEventType,
    XStateStateManagerOptions
} from '../index'
import {IXStatePersistence, LoadStateArgs, LoadStateResult, PersistStateArgs} from "../types";

/**
 * This class implements the IXStateStateManager interface using a TypeORM compatible database.
 *
 * This allows you to store and retrieve the State of a state machine/application by their types.
 *
 * @beta This API may change without a BREAKING CHANGE notice.
 */
export class XStatePersistence implements IAgentPlugin {
    readonly schema = schema.IXStatePersistence
    readonly methods: IXStatePersistence
    readonly eventTypes: Array<string>
    readonly store: IAbstractXStateStore

    constructor(opts: XStateStateManagerOptions) {
        const { store, eventTypes } = opts

        this.store = store
        this.eventTypes = eventTypes
        
        this.methods = {
            persistState: this.persistState.bind(this),
            loadState: this.loadState.bind(this),
            deleteState: this.deleteState.bind(this),
            onEvent: this.onEvent.bind(this)
        }
    }

    async onEvent(event: XStatePersistenceEvent, context: RequiredContext): Promise<OnEventResult> {
        switch (event.type) {
            case XStatePersistenceEventType.EVERY:
                // Calling the context of the agent to make sure the REST client is called when configured
                await context.agent.persistState(event.data)
                break
            default:
                return Promise.reject(Error('Event type not supported'))
        }
    }

    private async persistState(state: PersistStateArgs): Promise<PersistStateResult> {
        if (!this.store) {
            return Promise.reject(Error('No store available in options'))
        }
        await this.store.saveState(state)
    }

    private async loadState(args: LoadStateArgs): Promise<LoadStateResult> {
        if (!this.store) {
            return Promise.reject(Error('No store available in options'))
        }
        return this.store.getState(args)
    }

    private async deleteState(args: LoadStateArgs): Promise<DeleteStateResult> {
        if (!this.store) {
            return Promise.reject(Error('No store available in options'))
        }
        return this.store.deleteState(args)
    }
}
