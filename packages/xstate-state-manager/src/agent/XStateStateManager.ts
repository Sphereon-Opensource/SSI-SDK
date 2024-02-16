import {IAgentPlugin,} from '@veramo/core'
import {OrPromise} from "@veramo/utils";
import Debug from 'debug'
import {DataSource} from "typeorm";

import {State} from "../entities/State";
import {
    DeleteStateResult, OnEventResult,
    PersistStateResult, RequiredContext,
    schema,
    XStateStateManagerEvent,
    XStateStateManagerEventType, XStateStateManagerOptions
} from '../index'
import {IXStateStateManager, LoadStateArgs, LoadStateResult, PersistStateArgs} from "../types";
import {getConnectedDb} from "../utils";


const debug = Debug('sphereon:ssi-sdk:xstate-state-manager')

/**
 * This class implements the IXStateStateManager interface using a TypeORM compatible database.
 *
 * This allows you to store and retrieve the State of a state machine/application by their types.
 *
 * @beta This API may change without a BREAKING CHANGE notice.
 */
export class XStateStateManager implements IAgentPlugin {
    readonly schema = schema.IXStateStateManager
    readonly methods: IXStateStateManager
    readonly eventTypes: Array<string>
    private dbConnection: OrPromise<DataSource>

    constructor(opts: XStateStateManagerOptions) {
        const { dbConnection, eventTypes } = opts
        this.dbConnection = dbConnection
        this.eventTypes = eventTypes
        
        this.methods = {
            persistState: this.persistState.bind(this),
            loadState: this.loadState.bind(this),
            deleteState: this.deleteState.bind(this),
            onEvent: this.onEvent.bind(this)
        }
    }

    async onEvent(event: XStateStateManagerEvent, context: RequiredContext): Promise<OnEventResult> {
        switch (event.type) {
            case XStateStateManagerEventType.EVERY:
                // Calling the context of the agent to make sure the REST client is called when configured
                await context.agent.persistState(event.data)
                break
            default:
                return Promise.reject(Error('Event type not supported'))
        }
    }

    private async persistState(state: PersistStateArgs): Promise<PersistStateResult> {
        debug.log(`Executing persistState with state: ${JSON.stringify(state)}`)
        await (await getConnectedDb(this.dbConnection))
            .getRepository(State)
            .save(state)
    }

    private async loadState(args: LoadStateArgs): Promise<LoadStateResult> {
        const { type } = args
        debug.log(`Executing loadState query with type: ${type}`)
        return await (await getConnectedDb(this.dbConnection))
            .getRepository(State)
            .findOne({
                where: { type }
            })
    }

    private async deleteState(args: LoadStateArgs): Promise<DeleteStateResult> {
        const { type } = args
        debug.log(`Executing loadState query with type: ${type}`)
        await (await getConnectedDb(this.dbConnection))
            .getRepository(State)
            .delete({ type })
    }
}
