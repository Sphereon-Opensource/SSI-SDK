import Debug, { Debugger } from 'debug'
import { DatabaseType, MigrationInterface, QueryRunner } from 'typeorm'
import { AddServiceMetadata1764000000001 } from '../postgres/1764000000001-AddServiceMetadata'
import { AddServiceMetadata1764000000002 } from '../sqlite/1764000000002-AddServiceMetadata'

const debug: Debugger = Debug('sphereon:ssi-sdk:migrations')

export class AddServiceMetadata1764000000000 implements MigrationInterface {
  name: string = 'AddServiceMetadata1764000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    debug('migration: adding metadata column to service table')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file for AddServiceMetadata')
        const mig: AddServiceMetadata1764000000001 = new AddServiceMetadata1764000000001()
        await mig.up(queryRunner)
        debug('Postgres migration statements for AddServiceMetadata executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file for AddServiceMetadata')
        const mig: AddServiceMetadata1764000000002 = new AddServiceMetadata1764000000002()
        await mig.up(queryRunner)
        debug('SQLite migration statements for AddServiceMetadata executed')
        return
      }
      default:
        return Promise.reject(
          `Migrations are currently only supported for sqlite, react-native, expo, and postgres for AddServiceMetadata. Was ${dbType}. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now`,
        )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    debug('migration: reverting metadata column from service table')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file for AddServiceMetadata')
        const mig: AddServiceMetadata1764000000001 = new AddServiceMetadata1764000000001()
        await mig.down(queryRunner)
        debug('Postgres migration statements for AddServiceMetadata reverted')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file for AddServiceMetadata')
        const mig: AddServiceMetadata1764000000002 = new AddServiceMetadata1764000000002()
        await mig.down(queryRunner)
        debug('SQLite migration statements for AddServiceMetadata reverted')
        return
      }
      default:
        return Promise.reject(
          `Migrations are currently only supported for sqlite, react-native, expo, and postgres for AddServiceMetadata. Was ${dbType}. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now`,
        )
    }
  }
}
