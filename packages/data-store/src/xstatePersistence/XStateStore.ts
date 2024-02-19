import {OrPromise} from "@sphereon/ssi-types";
import Debug from 'debug'
import {DataSource} from "typeorm";

import {StateEntity} from "../entities/xstatePersistence/StateEntity";
import {DeleteStateArgs, GetStateArgs, GetStateResult, SaveStateArgs, VoidResult,} from "../types";
import {stateFrom} from "../utils/contact/MappingUtils";
import {IAbstractXStateStore} from "./IAbstractXStateStore";

const debug = Debug('sphereon:ssi-sdk:xstatePersistence')

export class XStateStore extends IAbstractXStateStore {
    private readonly dbConnection: OrPromise<DataSource>

    constructor(dbConnection: OrPromise<DataSource>) {
        super()
        this.dbConnection = dbConnection
    }

    async saveState(state: SaveStateArgs): Promise<VoidResult> {
        const connection: DataSource = await this.dbConnection
        debug.log(`Executing persistState with state: ${JSON.stringify(state)}`)
        await connection.getRepository(StateEntity).save(state)
    }

    async getState(args: GetStateArgs): Promise<GetStateResult> {
        const connection: DataSource = await this.dbConnection
        debug.log(`Executing loadState query with type: ${args.type}`)
        const result: StateEntity | null = await connection.getRepository(StateEntity)
            .findOne({
                where: { type: args.type }
            })
        if (!result) {
            return Promise.reject(Error(`No state found for type: ${args.type}`))
        }
        return stateFrom(result)
    }

    async deleteState(args: DeleteStateArgs): Promise<VoidResult> {
        const connection: DataSource = await this.dbConnection
        debug.log(`Executing loadState query with type: ${args.type}`)
        await connection.getRepository(StateEntity)
            .delete({ type: args.type })
    }
}
