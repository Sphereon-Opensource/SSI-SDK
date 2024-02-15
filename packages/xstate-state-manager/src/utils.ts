import {OrPromise} from "@veramo/utils";
import {DataSource} from "typeorm";

/**
 *  Ensures that the provided DataSource is connected.
 *
 * @param dbConnection - a TypeORM DataSource or a Promise that resolves to a DataSource
 */
export async function getConnectedDb(dbConnection: OrPromise<DataSource>): Promise<DataSource> {
    if (dbConnection instanceof Promise) {
        return await dbConnection
    } else if (!dbConnection.isInitialized) {
        return await (<DataSource>dbConnection).initialize()
    } else {
        return dbConnection
    }
}