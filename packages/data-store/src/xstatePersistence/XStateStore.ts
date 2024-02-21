import {OrPromise} from "@sphereon/ssi-types";
import Debug from 'debug'
import {DataSource} from "typeorm";

import {StateEntity} from "../entities/xstatePersistence/StateEntity";
import {DeleteStateArgs, GetStateArgs, GetStatesArgs, SaveStateArgs, State, VoidResult,} from "../types";
import {IAbstractXStateStore} from "./IAbstractXStateStore";

const debug = Debug('sphereon:ssi-sdk:xstatePersistence')

export class XStateStore extends IAbstractXStateStore {
    private readonly dbConnection: OrPromise<DataSource>

    constructor(dbConnection: OrPromise<DataSource>) {
        super()
        this.dbConnection = dbConnection
    }

    async saveState(state: SaveStateArgs): Promise<State> {
        const connection: DataSource = await this.dbConnection
        debug(`Executing saveState with state: ${JSON.stringify(state)}`)
        return connection.getRepository(StateEntity).save(state);
    }

    async getState(args: GetStateArgs): Promise<State> {
        const connection: DataSource = await this.dbConnection
        debug(`Executing loadState query with type: ${args.type}`)
        const result: StateEntity | null = await connection.getRepository(StateEntity)
            .findOne({
                where: { type: args.type }
            })
        if (!result) {
            return Promise.reject(Error(`No state found for type: ${args.type}`))
        }
        return this.stateFrom(result)
    }

    async getStates(args?: GetStatesArgs): Promise<Array<State>> {
        const connection: DataSource = await this.dbConnection // TODO apply everywhere
        debug('Getting states', args)
        const result: Array<StateEntity> = await connection.getRepository(StateEntity).find({
            ...(args?.filter && { where: args?.filter }),
        })

        return result.map((event: StateEntity) => this.stateFrom(event))
    }

    async deleteState(args: DeleteStateArgs): Promise<VoidResult> {
        const connection: DataSource = await this.dbConnection
        debug(`Executing deleteState query with where clause: ${args.where} and params: ${JSON.stringify(args.parameters)}`)
        await connection.createQueryBuilder()
            .delete()
            .from(StateEntity)
            .where(args.where, args.parameters)
            .execute()
    }

    private stateFrom = (state: StateEntity): State => {
        return {
            state: state.id,
            type: state.type,
            createdAt: state.createdAt,
            updatedAt: state.updatedAt,
            completedAt: state.completedAt,
            tenantId: state.tenantId,
            ttl: state.ttl
        }
    }
}
