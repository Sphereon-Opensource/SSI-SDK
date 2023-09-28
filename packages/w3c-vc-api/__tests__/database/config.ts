import { Entities as VeramoDataStoreEntities, migrations as VeramoDataStoreMigrations } from '@veramo/data-store'
import { DataStoreEntities, DataStoreMigrations } from '@sphereon/ssi-sdk.data-store'
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions'
import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions'
import { KeyValueStoreEntity } from '@sphereon/ssi-sdk.kv-store-temp'
import { kvStoreMigrations } from '@sphereon/ssi-sdk.kv-store-temp'

const DB_CONNECTION_NAME_SQLITE = 'sqlite'
const DB_CONNECTION_NAME_POSTGRES = 'postgres'
const DB_ENCRYPTION_KEY = '29739248cad1bd1a0fc4d9b75cd4d2990de535baf5caadfdf8d8f86664aa830c'

const sqliteConfig: SqliteConnectionOptions = {
  type: 'sqlite',
  database: '__tests__/database/test.sqlite',
  entities: [...VeramoDataStoreEntities, ...DataStoreEntities, KeyValueStoreEntity],
  migrations: [...VeramoDataStoreMigrations, ...DataStoreMigrations, ...kvStoreMigrations],
  migrationsRun: false, // We run migrations from code to ensure proper ordering with Redux
  synchronize: false, // We do not enable synchronize, as we use migrations from code
  migrationsTransactionMode: 'each', // protect every migration with a separate transaction
  logging: ['info'], // 'all' means to enable all logging
  logger: 'advanced-console',
}

const postgresConfig: PostgresConnectionOptions = {
  type: 'postgres',
  database: 'vc-status-list', // we use the same db as the status-list to do some testing
  username: 'postgres',
  password: 'test',
  entities: [...VeramoDataStoreEntities, ...DataStoreEntities],
  migrations: [...VeramoDataStoreMigrations, ...DataStoreMigrations],
  migrationsRun: false, // We run migrations from code to ensure proper ordering with Redux
  synchronize: false, // We do not enable synchronize, as we use migrations from code
  migrationsTransactionMode: 'each', // protect every migration with a separate transaction
  logging: ['info'], // 'all' means to enable all logging
  logger: 'advanced-console',
}

export { sqliteConfig, postgresConfig, DB_CONNECTION_NAME_SQLITE, DB_CONNECTION_NAME_POSTGRES, DB_ENCRYPTION_KEY }
