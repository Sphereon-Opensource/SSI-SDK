import Debug, { Debugger } from 'debug'
import { DatabaseType, MigrationInterface, QueryRunner } from 'typeorm'
import { AddUntrustedCredentialState1780000000011 } from '../postgres/1780000000011-AddUntrustedCredentialState'
import { AddUntrustedCredentialState1780000000012 } from '../sqlite/1780000000012-AddUntrustedCredentialState'

const debug: Debugger = Debug('sphereon:ssi-sdk:migrations')

export class AddUntrustedCredentialState1780000000010 implements MigrationInterface {
  name: string = 'AddUntrustedCredentialState1780000000010'

  public async up(queryRunner: QueryRunner): Promise<void> {
    debug('migration: widening DigitalCredential verified_state to include UNTRUSTED')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file for AddUntrustedCredentialState')
        const mig: AddUntrustedCredentialState1780000000011 = new AddUntrustedCredentialState1780000000011()
        await mig.up(queryRunner)
        debug('Postgres migration statements for AddUntrustedCredentialState executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file for AddUntrustedCredentialState')
        const mig: AddUntrustedCredentialState1780000000012 = new AddUntrustedCredentialState1780000000012()
        await mig.up(queryRunner)
        debug('SQLite migration statements for AddUntrustedCredentialState executed')
        return
      }
      default:
        return Promise.reject(
          `Migrations are currently only supported for sqlite, react-native, expo, and postgres for AddUntrustedCredentialState. Was ${dbType}. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now`,
        )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    debug('migration: reverting DigitalCredential verified_state UNTRUSTED widening')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file for AddUntrustedCredentialState')
        const mig: AddUntrustedCredentialState1780000000011 = new AddUntrustedCredentialState1780000000011()
        await mig.down(queryRunner)
        debug('Postgres migration statements for AddUntrustedCredentialState reverted')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file for AddUntrustedCredentialState')
        const mig: AddUntrustedCredentialState1780000000012 = new AddUntrustedCredentialState1780000000012()
        await mig.down(queryRunner)
        debug('SQLite migration statements for AddUntrustedCredentialState reverted')
        return
      }
      default:
        return Promise.reject(
          `Migrations are currently only supported for sqlite, react-native, expo, and postgres for AddUntrustedCredentialState. Was ${dbType}. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now`,
        )
    }
  }
}
