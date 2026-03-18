import Debug from 'debug'
import { DatabaseType, MigrationInterface, QueryRunner } from 'typeorm'
import { AddCredentialDesignsPostgres1773657426000 } from '../postgres/1773657426000-AddCredentialDesigns'
import { AddCredentialDesignsSqlite1773657426000 } from '../sqlite/1773657426000-AddCredentialDesigns'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:migrations')

export class AddCredentialDesigns1773657426000 implements MigrationInterface {
  name = 'AddCredentialDesigns1773657426000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    debug('migration: adding credential designs')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type
    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file')
        const mig: AddCredentialDesigns1773657426000 = new AddCredentialDesignsPostgres1773657426000()
        await mig.up(queryRunner)
        debug('Migration statements executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file')
        const mig: AddCredentialDesignsSqlite1773657426000 = new AddCredentialDesignsSqlite1773657426000()
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
    debug('migration: removing credential designs')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type
    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file')
        const mig: AddCredentialDesignsPostgres1773657426000 = new AddCredentialDesignsPostgres1773657426000()
        await mig.down(queryRunner)
        debug('Migration statements executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file')
        const mig: AddCredentialDesignsSqlite1773657426000 = new AddCredentialDesignsSqlite1773657426000()
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
