import { ConnectionOptions } from 'typeorm'
import { WellknownDidIssuerEntities, WellknownDidIssuerMigrations } from '../index'

/**
 * Do Not use these connections in production!. They are only here to create/test migration files!
 */
export default [
  {
    type: 'sqlite',
    name: 'migration-sqlite',
    database: 'migration.sqlite',
    migrationsRun: false,
    synchronize: false,
    logging: ['error', 'info', 'warn', 'log'],
    entities: [...WellknownDidIssuerEntities],
    migrations: [...WellknownDidIssuerMigrations],
  },
  {
    type: 'postgres',
    name: 'migration-postgres',
    database: 'migration-postgres',
    migrationsRun: false,
    synchronize: false,
    logging: ['error', 'info', 'warn', 'log'],
    entities: [...WellknownDidIssuerEntities],
    migrations: [...WellknownDidIssuerMigrations],
  },
] as ConnectionOptions[]
