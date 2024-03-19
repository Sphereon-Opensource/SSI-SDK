import { DatabaseType, MigrationInterface, QueryRunner } from 'typeorm'
import Debug from 'debug'
import { CreateContacts1659463079428 } from '../postgres/1659463079428-CreateContacts'
import { CreateContacts1659463069549 } from '../sqlite/1659463069549-CreateContacts'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:migrations')

export class CreateContacts1659463079429 implements MigrationInterface {
  name = 'CreateContacts1659463079429'

  public async up(queryRunner: QueryRunner): Promise<void> {
    debug('migration: creating contacts tables')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file')
        const mig: CreateContacts1659463079428 = new CreateContacts1659463079428()
        await mig.up(queryRunner)
        debug('Migration statements executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file')
        const mig: CreateContacts1659463069549 = new CreateContacts1659463069549()
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
    debug('migration: reverting contacts tables')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file')
        const mig: CreateContacts1659463079428 = new CreateContacts1659463079428()
        await mig.down(queryRunner)
        debug('Migration statements executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file')
        const mig: CreateContacts1659463069549 = new CreateContacts1659463069549()
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
