import Debug, { Debugger } from 'debug'
import { DatabaseType, MigrationInterface, QueryRunner } from 'typeorm'
import { AddCredentialStatusFields1780000000001 } from '../postgres/1780000000001-AddCredentialStatusFields'
import { AddCredentialStatusFields1780000000002 } from '../sqlite/1780000000002-AddCredentialStatusFields'

const debug: Debugger = Debug('sphereon:ssi-sdk:migrations')

export class AddCredentialStatusFields1780000000000 implements MigrationInterface {
  name: string = 'AddCredentialStatusFields1780000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    debug('migration: adding credential status fields to DigitalCredential table')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file for AddCredentialStatusFields')
        const mig: AddCredentialStatusFields1780000000001 = new AddCredentialStatusFields1780000000001()
        await mig.up(queryRunner)
        debug('Postgres migration statements for AddCredentialStatusFields executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file for AddCredentialStatusFields')
        const mig: AddCredentialStatusFields1780000000002 = new AddCredentialStatusFields1780000000002()
        await mig.up(queryRunner)
        debug('SQLite migration statements for AddCredentialStatusFields executed')
        return
      }
      default:
        return Promise.reject(
          `Migrations are currently only supported for sqlite, react-native, expo, and postgres for AddCredentialStatusFields. Was ${dbType}. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now`,
        )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    debug('migration: reverting credential status fields from DigitalCredential table')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file for AddCredentialStatusFields')
        const mig: AddCredentialStatusFields1780000000001 = new AddCredentialStatusFields1780000000001()
        await mig.down(queryRunner)
        debug('Postgres migration statements for AddCredentialStatusFields reverted')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file for AddCredentialStatusFields')
        const mig: AddCredentialStatusFields1780000000002 = new AddCredentialStatusFields1780000000002()
        await mig.down(queryRunner)
        debug('SQLite migration statements for AddCredentialStatusFields reverted')
        return
      }
      default:
        return Promise.reject(
          `Migrations are currently only supported for sqlite, react-native, expo, and postgres for AddCredentialStatusFields. Was ${dbType}. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now`,
        )
    }
  }
}
