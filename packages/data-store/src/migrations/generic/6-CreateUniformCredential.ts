import { DatabaseType, MigrationInterface, QueryRunner } from 'typeorm'
import Debug, { Debugger } from 'debug'
import { CreateUniformCredential1708525189001 } from '../postgres/1708525189001-CreateUniformCredential'
import { CreateUniformCredential1708525189002 } from '../sqlite/1708525189002-CreateUniformCredential'

const debug: Debugger = Debug('sphereon:ssi-sdk:migrations')

export class CreateUniformCredential1708525189000 implements MigrationInterface {
  name: string = 'CreateUniformCredential1708525189000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    debug('migration: creating UniformCredential tables')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file for UniformCredential')
        const mig: CreateUniformCredential1708525189001 = new CreateUniformCredential1708525189001()
        await mig.up(queryRunner)
        debug('Postgres Migration statements for UniformCredential executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file for UniformCredential')
        const mig: CreateUniformCredential1708525189002 = new CreateUniformCredential1708525189002()
        await mig.up(queryRunner)
        debug('SQLite Migration statements for UniformCredential executed')
        return
      }
      default:
        return Promise.reject(
          `Migrations are currently only supported for sqlite, react-native, expo, and postgres for UniformCredential. Was ${dbType}. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now`
        )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    debug('migration: reverting UniformCredential tables')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file for UniformCredential')
        const mig: CreateUniformCredential1708525189001 = new CreateUniformCredential1708525189001()
        await mig.down(queryRunner)
        debug('Postgres Migration statements for UniformCredential reverted')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file for UniformCredential')
        const mig: CreateUniformCredential1708525189002 = new CreateUniformCredential1708525189002()
        await mig.down(queryRunner)
        debug('SQLite Migration statements for UniformCredential reverted')
        return
      }
      default:
        return Promise.reject(
          `Migrations are currently only supported for sqlite, react-native, expo, and postgres for UniformCredential. Was ${dbType}. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now`
        )
    }
  }
}
