import {OrPromise} from "@sphereon/ssi-types";
import Debug from 'debug'
import {DataSource} from "typeorm";

import {XStateEntity} from "../entities/xstatePersistence/XStateEntity";
import {DeleteStateArgs, LoadStateArgs, LoadStateResult, PersistStateArgs, VoidResult,} from "../types";
import {IAbstractXStateStore} from "./IAbstractXStateStore";

const debug = Debug('sphereon:ssi-sdk:xstatePersistence')

export class XStateStore extends IAbstractXStateStore {
    private readonly dbConnection: OrPromise<DataSource>

    constructor(dbConnection: OrPromise<DataSource>) {
        super()
        this.dbConnection = dbConnection
    }

    async persistState(state: PersistStateArgs): Promise<VoidResult> {
        const connection: DataSource = await this.dbConnection
        debug.log(`Executing persistState with state: ${JSON.stringify(state)}`)
        await connection.getRepository(XStateEntity).save(state)
    }

    async loadState(args: LoadStateArgs): Promise<LoadStateResult> {
        const connection: DataSource = await this.dbConnection
        debug.log(`Executing loadState query with type: ${args.type}`)
        return await connection.getRepository(XStateEntity)
            .findOne({
                where: { type: args.type }
            })
    }

    async deleteState(args: DeleteStateArgs): Promise<VoidResult> {
        const connection: DataSource = await this.dbConnection
        debug.log(`Executing loadState query with type: ${args.type}`)
        await connection.getRepository(XStateEntity)
            .delete({ type: args.type })
    }
}
