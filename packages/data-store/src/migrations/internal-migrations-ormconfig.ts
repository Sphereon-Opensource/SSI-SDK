import { DataSourceOptions } from 'typeorm'
import { DataStoreContactEntities, DataStoreMigrations } from '../index'

/**
 * Do Not use these connections in production!. They are only here to create/test migration files!
 */
export default [
  {
    type: 'sqlite',
    database: 'migration.sqlite',
    migrationsRun: false,
    synchronize: false,
    logging: ['error', 'info', 'warn', 'log'],
    entities: [...DataStoreContactEntities],
    migrations: [...DataStoreMigrations],
  },
  {
    type: 'postgres',
    database: 'migration-postgres',
    migrationsRun: false,
    synchronize: false,
    logging: ['error', 'info', 'warn', 'log'],
    entities: [...DataStoreContactEntities],
    migrations: [...DataStoreMigrations],
  },
] as DataSourceOptions[]
