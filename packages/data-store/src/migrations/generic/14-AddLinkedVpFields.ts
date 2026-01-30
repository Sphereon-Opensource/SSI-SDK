import Debug, { Debugger } from 'debug'
import { DatabaseType, MigrationInterface, QueryRunner } from 'typeorm'
import { AddLinkedVpFields1763387280001 } from '../postgres/1763387280001-AddLinkedVpFields'
import { AddLinkedVpFields1763387280002 } from '../sqlite/1763387280002-AddLinkedVpFields'

const debug: Debugger = Debug('sphereon:ssi-sdk:migrations')

export class AddLinkedVpFields1763387280000 implements MigrationInterface {
  name: string = 'AddLinkedVpFields1763387280000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    debug('migration: adding linked VP fields to DigitalCredential table')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file for AddLinkedVpFields')
        const mig: AddLinkedVpFields1763387280001 = new AddLinkedVpFields1763387280001()
        await mig.up(queryRunner)
        debug('Postgres migration statements for AddLinkedVpFields executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file for AddLinkedVpFields')
        const mig: AddLinkedVpFields1763387280002 = new AddLinkedVpFields1763387280002()
        await mig.up(queryRunner)
        debug('SQLite migration statements for AddLinkedVpFields executed')
        return
      }
      default:
        return Promise.reject(
          `Migrations are currently only supported for sqlite, react-native, expo, and postgres for AddLinkedVpFields. Was ${dbType}. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now`,
        )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    debug('migration: reverting linked VP fields from DigitalCredential table')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file for AddLinkedVpFields')
        const mig: AddLinkedVpFields1763387280001 = new AddLinkedVpFields1763387280001()
        await mig.down(queryRunner)
        debug('Postgres migration statements for AddLinkedVpFields reverted')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file for AddLinkedVpFields')
        const mig: AddLinkedVpFields1763387280002 = new AddLinkedVpFields1763387280002()
        await mig.down(queryRunner)
        debug('SQLite migration statements for AddLinkedVpFields reverted')
        return
      }
      default:
        return Promise.reject(
          `Migrations are currently only supported for sqlite, react-native, expo, and postgres for AddLinkedVpFields. Was ${dbType}. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now`,
        )
    }
  }
}
