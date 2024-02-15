import {IAgentPlugin,} from '@veramo/core'
import {OrPromise} from "@veramo/utils";
import Debug from 'debug'
import {DataSource} from "typeorm";

import {State} from "../entities/State";
import {DeleteStateResult, PersistStateResult, schema} from '../index'
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
    private dbConnection: OrPromise<DataSource>
    readonly methods: IXStateStateManager

    constructor(dbConnection: OrPromise<DataSource>) {
        this.dbConnection = dbConnection
        
        this.methods = {
            persistState: this.persistState.bind(this),
            loadState: this.loadState.bind(this),
            deleteState: this.deleteState.bind(this)
        }
    }

    async persistState(state: PersistStateArgs): Promise<PersistStateResult> {
        debug.log(`Executing persistState with state: ${JSON.stringify(state)}`)
        await (await getConnectedDb(this.dbConnection))
            .getRepository(State)
            .save(state)
    }

    async loadState(args: LoadStateArgs): Promise<LoadStateResult> {
        const { type } = args
        debug.log(`Executing loadState query with type: ${type}`)
        return await (await getConnectedDb(this.dbConnection))
            .getRepository(State)
            .findOne({
                where: { type }
            })
    }

    async deleteState(args: LoadStateArgs): Promise<DeleteStateResult> {
        const { type } = args
        debug.log(`Executing loadState query with type: ${type}`)
        await (await getConnectedDb(this.dbConnection))
            .getRepository(State)
            .delete({ type })
    }
}
