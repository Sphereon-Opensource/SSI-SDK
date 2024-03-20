import { DatabaseType, MigrationInterface, QueryRunner } from 'typeorm'
import Debug from 'debug'
import { CreateContacts1710941091795 } from '../postgres/1710941091795-CreateContacts'
import { CreateContacts1710941197348 } from '../sqlite/1710941197348-CreateContacts'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:migrations')

export class CreateContacts1710942112855 implements MigrationInterface {
  name = 'CreateContacts1710949828195'

  public async up(queryRunner: QueryRunner): Promise<void> {
    debug('migration: updating contact tables')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file')
        const mig: CreateContacts1710941091795 = new CreateContacts1710941091795()
        await mig.up(queryRunner)
        debug('Migration statements executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file')
        const mig: CreateContacts1710941197348 = new CreateContacts1710941197348()
        await mig.up(queryRunner)
        debug('Migration statements executed')
        return
      }
      default:
        return Promise.reject(
          `Migrations are currently only supported for sqlite, react-native, expo and postgres. Was ${dbType}. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now`
        )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    debug('migration: reverting machine state tables')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file')
        const mig: CreateContacts1710941091795 = new CreateContacts1710941091795()
        await mig.down(queryRunner)
        debug('Migration statements executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file')
        const mig: CreateContacts1710941197348 = new CreateContacts1710941197348()
        await mig.down(queryRunner)
        debug('Migration statements executed')
        return
      }
      default:
        return Promise.reject(
          `Migrations are currently only supported for sqlite, react-native, expo and postgres. Was ${dbType}. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now`
        )
    }
  }
}
