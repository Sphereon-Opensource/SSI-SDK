import { DatabaseType, MigrationInterface, QueryRunner } from 'typeorm'
import Debug from 'debug'
import { CreateIssuanceBranding1685628974232 } from '../postgres/1685628974232-CreateIssuanceBranding'
import { CreateIssuanceBranding1685628973231 } from '../sqlite/1685628973231-CreateIssuanceBranding'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:migrations')

export class CreateIssuanceBranding1659463079429 implements MigrationInterface {
  name = 'CreateIssuanceBranding1659463079429'

  public async up(queryRunner: QueryRunner): Promise<void> {
    debug('migration: creating issuance branding tables')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type
    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file')
        const mig: CreateIssuanceBranding1685628974232 = new CreateIssuanceBranding1685628974232()
        await mig.up(queryRunner)
        debug('Migration statements executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file')
        const mig: CreateIssuanceBranding1685628973231 = new CreateIssuanceBranding1685628973231()
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
    debug('migration: reverting issuance branding tables')
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
