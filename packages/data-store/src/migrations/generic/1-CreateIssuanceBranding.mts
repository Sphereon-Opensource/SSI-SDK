import { MigrationInterface, QueryRunner } from 'typeorm'
import Debug from 'debug'
import { CreateIssuanceBranding1685628974232 } from '../postgres/1685628974232-CreateIssuanceBranding.mjs'
import { CreateIssuanceBranding1685628973231 } from '../sqlite/1685628973231-CreateIssuanceBranding.mjs'

const debug = Debug('sphereon:ssi-sdk:migrations')

export class CreateIssuanceBranding1659463079429 implements MigrationInterface {
  name = 'CreateIssuanceBranding1659463079429'

  public async up(queryRunner: QueryRunner): Promise<void> {
    debug('migration: creating issuance branding tables')
    const dbType = queryRunner.connection.driver.options.type
    if (dbType === 'postgres') {
      debug('using postgres migration file')
      const mig = new CreateIssuanceBranding1685628974232()
      const up = await mig.up(queryRunner)
      debug('Migration statements executed')
      return up
    } else if (dbType === 'sqlite' || 'react-native') {
      debug('using sqlite/react-native migration file')
      const mig = new CreateIssuanceBranding1685628973231()
      const up = await mig.up(queryRunner)
      debug('Migration statements executed')
      return up
    } else {
      return Promise.reject(
        "Migrations are currently only supported for sqlite, react-native and postgres. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now"
      )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    debug('migration: reverting issuance branding tables')
    const dbType = queryRunner.connection.driver.options.type
    if (dbType === 'postgres') {
      debug('using postgres migration file')
      const mig = new CreateIssuanceBranding1685628974232()
      const down = await mig.down(queryRunner)
      debug('Migration statements executed')
      return down
    } else if (dbType === 'sqlite' || 'react-native') {
      debug('using sqlite/react-native migration file')
      const mig = new CreateIssuanceBranding1685628973231()
      const down = await mig.down(queryRunner)
      debug('Migration statements executed')
      return down
    } else {
      return Promise.reject(
        "Migrations are currently only supported for sqlite, react-native and postgres. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now"
      )
    }
  }
}
