import Debug, { Debugger } from 'debug'
import { DatabaseType, MigrationInterface, QueryRunner } from 'typeorm'
import { MakeOpenIdClientSecretNullable1767000000001 } from '../postgres/1767000000001-MakeOpenIdClientSecretNullable'
import { MakeOpenIdClientSecretNullable1767000000002 } from '../sqlite/1767000000002-MakeOpenIdClientSecretNullable'

const debug: Debugger = Debug('sphereon:ssi-sdk:migrations')

export class MakeOpenIdClientSecretNullable1767000000000 implements MigrationInterface {
  name: string = 'MakeOpenIdClientSecretNullable1767000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    debug('migration: making client_secret nullable in BaseConfig table')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file for MakeOpenIdClientSecretNullable')
        const mig = new MakeOpenIdClientSecretNullable1767000000001()
        await mig.up(queryRunner)
        debug('Postgres migration statements for MakeOpenIdClientSecretNullable executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file for MakeOpenIdClientSecretNullable')
        const mig = new MakeOpenIdClientSecretNullable1767000000002()
        await mig.up(queryRunner)
        debug('SQLite migration statements for MakeOpenIdClientSecretNullable executed')
        return
      }
      default:
        return Promise.reject(
          `Migrations are currently only supported for sqlite, react-native, expo, and postgres for MakeOpenIdClientSecretNullable. Was ${dbType}. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now`,
        )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    debug('migration: reverting client_secret nullable in BaseConfig table')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        const mig = new MakeOpenIdClientSecretNullable1767000000001()
        await mig.down(queryRunner)
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        const mig = new MakeOpenIdClientSecretNullable1767000000002()
        await mig.down(queryRunner)
        return
      }
      default:
        return Promise.reject(
          `Migrations are currently only supported for sqlite, react-native, expo, and postgres for MakeOpenIdClientSecretNullable. Was ${dbType}. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now`,
        )
    }
  }
}
