import {DeleteStateArgs, IAbstractXStateStore, State} from "@sphereon/ssi-sdk.data-store";
import {IAgentPlugin,} from '@veramo/core'

import {
    DeleteExpiredStatesArgs,
    DeleteStateResult,
    NonPersistedXStatePersistenceEvent,
    RequiredContext,
    schema,
    SQLDialect,
    XStatePersistenceEvent,
    XStatePersistenceEventType,
    XStateStateManagerOptions
} from '../index'
import {IXStatePersistence, LoadStateArgs, LoadStateResult} from "../types";

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
            loadState: this.loadState.bind(this),
            deleteExpiredStates: this.deleteExpiredStates.bind(this),
            persistState: this.persistState.bind(this)
        }
    }

    public async onEvent(event: XStatePersistenceEvent, context: RequiredContext): Promise<void> {
        switch (event.type) {
            case XStatePersistenceEventType.EVERY:
                // Calling the context of the agent to make sure the REST client is called when configured
                await context.agent.persistState({...event.data})
                break
            default:
                return Promise.reject(Error('Event type not supported'))
        }
    }

    private async persistState(args: NonPersistedXStatePersistenceEvent): Promise<State> {
        if (!this.store) {
            return Promise.reject(Error('No store available in options'))
        }
        return this.store.saveState(args)
    }

    private async loadState(args: LoadStateArgs): Promise<LoadStateResult> {
        if (!this.store) {
            return Promise.reject(Error('No store available in options'))
        }
        return this.store.getState(args)
    }

    private async deleteExpiredStates(args: DeleteExpiredStatesArgs): Promise<DeleteStateResult> {
        if (!this.store) {
            return Promise.reject(Error('No store available in options'))
        }
        const sqLiteParams: DeleteStateArgs = {
            where: `created_at < datetime('now', :duration)`,
            parameters: {
                duration: `-${args.duration / 1000} seconds`
            }
        }
        const postgreSQLParams: DeleteStateArgs = {
            where: 'created_at < :duration',
            parameters: {
                duration: `NOW() - ${args.duration / 1000} seconds::interval`
            }
        }
        switch (args.dialect) {
            case SQLDialect.SQLite3:
                return this.store.deleteState(sqLiteParams)
            case SQLDialect.PostgreSQL:
                return this.store.deleteState(postgreSQLParams)
            default:
                return Promise.reject(Error('Invalid database dialect'))
        }
    }
}
