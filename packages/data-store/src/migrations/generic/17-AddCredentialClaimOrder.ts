import Debug from 'debug'
import { DatabaseType, MigrationInterface, QueryRunner } from 'typeorm'
import { AddCredentialClaimOrderPostgres1768000000000 } from '../postgres/1768000000000-AddCredentialClaimOrder'
import { AddCredentialClaimOrderSqlite1768000000000 } from '../sqlite/1768000000000-AddCredentialClaimOrder'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:migrations')

export class AddCredentialClaimOrder1768000000000 implements MigrationInterface {
  name = 'AddCredentialClaimOrder1768000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    debug('migration: adding credential claim order column')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type
    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file')
        const mig: AddCredentialClaimOrderPostgres1768000000000 = new AddCredentialClaimOrderPostgres1768000000000()
        await mig.up(queryRunner)
        debug('Migration statements executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file')
        const mig: AddCredentialClaimOrderSqlite1768000000000 = new AddCredentialClaimOrderSqlite1768000000000()
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
    debug('migration: removing credential claim order column')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type
    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file')
        const mig: AddCredentialClaimOrderPostgres1768000000000 = new AddCredentialClaimOrderPostgres1768000000000()
        await mig.down(queryRunner)
        debug('Migration statements executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file')
        const mig: AddCredentialClaimOrderSqlite1768000000000 = new AddCredentialClaimOrderSqlite1768000000000()
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
