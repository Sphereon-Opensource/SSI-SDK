import { DatabaseType, MigrationInterface, QueryRunner } from 'typeorm'
import Debug from 'debug'
import { CreateContacts1710438363001 } from '../postgres/1710438363001-CreateContacts'
import { CreateContacts1710438363002 } from '../sqlite/1710438363002-CreateContacts'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:migrations')

export class CreateContacts1708525189000 implements MigrationInterface {
  name = 'CreateContacts1708525189000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    debug('migration: updating contact tables')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file')
        const mig: CreateContacts1710438363001 = new CreateContacts1710438363001()
        await mig.up(queryRunner)
        debug('Migration statements executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file')
        const mig: CreateContacts1710438363002 = new CreateContacts1710438363002()
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
    debug('migration: reverting machine state tables')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file')
        const mig: CreateContacts1710438363001 = new CreateContacts1710438363001()
        await mig.down(queryRunner)
        debug('Migration statements executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file')
        const mig: CreateContacts1710438363002 = new CreateContacts1710438363002()
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
