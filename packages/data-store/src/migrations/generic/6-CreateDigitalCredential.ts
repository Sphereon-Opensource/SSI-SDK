import { DatabaseType, MigrationInterface, QueryRunner } from 'typeorm'
import Debug, { Debugger } from 'debug'
import { CreateDigitalCredential1708525189001 } from '../postgres/1708525189001-CreateDigitalCredential'
import { CreateDigitalCredential1708525189002 } from '../sqlite/1708525189002-CreateDigitalCredential'

const debug: Debugger = Debug('sphereon:ssi-sdk:migrations')

export class CreateDigitalCredential1708525189000 implements MigrationInterface {
  name: string = 'CreateDigitalCredential1708525189000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    debug('migration: creating DigitalCredential tables')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file for DigitalCredential')
        const mig: CreateDigitalCredential1708525189001 = new CreateDigitalCredential1708525189001()
        await mig.up(queryRunner)
        debug('Postgres Migration statements for DigitalCredential executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file for DigitalCredential')
        const mig: CreateDigitalCredential1708525189002 = new CreateDigitalCredential1708525189002()
        await mig.up(queryRunner)
        debug('SQLite Migration statements for DigitalCredential executed')
        return
      }
      default:
        return Promise.reject(
          `Migrations are currently only supported for sqlite, react-native, expo, and postgres for UniformCredential. Was ${dbType}. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now`,
        )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    debug('migration: reverting DigitalCredential tables')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file for DigitalCredential')
        const mig: CreateDigitalCredential1708525189001 = new CreateDigitalCredential1708525189001()
        await mig.down(queryRunner)
        debug('Postgres Migration statements for DigitalCredential reverted')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file for DigitalCredential')
        const mig: CreateDigitalCredential1708525189002 = new CreateDigitalCredential1708525189002()
        await mig.down(queryRunner)
        debug('SQLite Migration statements for DigitalCredential reverted')
        return
      }
      default:
        return Promise.reject(
          `Migrations are currently only supported for sqlite, react-native, expo, and postgres for DigitalCredential. Was ${dbType}. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now`,
        )
    }
  }
}
