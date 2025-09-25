import Debug from 'debug'
import { DatabaseType, MigrationInterface, QueryRunner } from 'typeorm'

import { CreateDcqlQueryItemPG1726588800000 } from '../postgres/1726588800000-CreateDcqlQueryItem'
import { CreateDcqlQueryItemSQlite1726617600000 } from '../sqlite/1726617600000-CreateDcqlQueryItem'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:migrations')

export class CreateDcqlQueryItem1726617600000 implements MigrationInterface {
  name = 'CreateDcqlQueryItem1726617600000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    debug('migration: updating presentation definition item nullable fields')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file')
        const mig: CreateDcqlQueryItemPG1726588800000 = new CreateDcqlQueryItemPG1726588800000()
        await mig.up(queryRunner)
        debug('Migration statements executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file')
        const mig: CreateDcqlQueryItemSQlite1726617600000 = new CreateDcqlQueryItemSQlite1726617600000()
        await mig.up(queryRunner)
        debug('Migration statements executed')
        return
      }
      default:
        return Promise.reject(
          `Migrations are currently only supported for sqlite, react-native, expo and postgres. Was ${dbType}. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now`,
        )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    debug('migration: reverting presentation definition item nullable fields')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file')
        const mig: CreateDcqlQueryItemPG1726588800000 = new CreateDcqlQueryItemPG1726588800000()
        await mig.down(queryRunner)
        debug('Migration statements executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file')
        const mig: CreateDcqlQueryItemSQlite1726617600000 = new CreateDcqlQueryItemSQlite1726617600000()
        await mig.down(queryRunner)
        debug('Migration statements executed')
        return
      }
      default:
        return Promise.reject(
          `Migrations are currently only supported for sqlite, react-native, expo and postgres. Was ${dbType}. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now`,
        )
    }
  }
}
