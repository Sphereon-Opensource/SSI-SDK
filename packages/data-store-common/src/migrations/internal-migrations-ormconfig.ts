import { ConnectionOptions } from 'typeorm'
import { DataStoreConnectionEntities } from '../index'

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
    entities: [...DataStoreConnectionEntities],
  },
  {
    type: 'react-native',
    name: 'migration-react-native',
    database: 'migration.react-native.sqlite',
    location: 'default',
    migrationsRun: false,
    synchronize: false,
    logging: ['error', 'info', 'warn', 'log'],
    entities: [...DataStoreConnectionEntities],
  },
  {
    type: 'postgres',
    name: 'migration-postgres',
    database: 'migration-postgres',
    migrationsRun: false,
    synchronize: false,
    logging: ['error', 'info', 'warn', 'log'],
    entities: [...DataStoreConnectionEntities],
  },
] as ConnectionOptions[]
