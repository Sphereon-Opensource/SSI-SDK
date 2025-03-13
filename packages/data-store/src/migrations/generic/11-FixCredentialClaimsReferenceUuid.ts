import { DatabaseType, MigrationInterface, QueryRunner } from 'typeorm'
import Debug from 'debug'
import { CreateIssuanceBranding1685628974232 } from '../postgres/1685628974232-CreateIssuanceBranding'
import { CreateIssuanceBranding1685628973231 } from '../sqlite/1685628973231-CreateIssuanceBranding'
import { FixCredentialClaimsReferencesUuidPG1741895822987 } from '../postgres/1741895822987-FixCredentialClaimsReferencesUuid'
import { FixCredentialClaimsReferencesUuidSqlite1741895822987 } from '../sqlite/1741895822987-FixCredentialClaimsReferencesUuid'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:migrations')

export class FixCredentialClaimsReferencesUuid1741895822987 implements MigrationInterface {
  name = 'FixCredentialClaimsReferenceUuid1741895822987'

  public async up(queryRunner: QueryRunner): Promise<void> {
    debug('migration: creating issuance branding uuid problem')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type
    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file')
        const mig: FixCredentialClaimsReferencesUuidPG1741895822987 = new FixCredentialClaimsReferencesUuidPG1741895822987()
        await mig.up(queryRunner)
        debug('Migration statements executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file')
        const mig: FixCredentialClaimsReferencesUuidSqlite1741895822987 = new FixCredentialClaimsReferencesUuidSqlite1741895822987()
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
    debug('migration: reverting issuance branding uuid migration')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type
    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file')
        const mig: CreateIssuanceBranding1685628974232 = new CreateIssuanceBranding1685628974232()
        await mig.down(queryRunner)
        debug('Migration statements executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file')
        const mig: CreateIssuanceBranding1685628973231 = new CreateIssuanceBranding1685628973231()
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
