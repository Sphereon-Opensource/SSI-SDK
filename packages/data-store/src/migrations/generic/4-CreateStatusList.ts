import Debug from 'debug'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { CreateStatusList1693866470001 } from '../postgres/1693866470001-CreateStatusList'
import { CreateStatusList1693866470002 } from '../sqlite/1693866470000-CreateStatusList'

const debug = Debug('sphereon:ssi-sdk:migrations')

export class CreateStatusList1693866470000 implements MigrationInterface {
  name = 'CreateStatusList1693866470000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    debug('migration: creating issuance branding tables')
    const dbType = queryRunner.connection.driver.options.type
    if (dbType === 'postgres') {
      debug('using postgres migration file')
      const mig = new CreateStatusList1693866470001()
      const up = await mig.up(queryRunner)
      debug('Migration statements executed')
      return up
    } else if (dbType === 'sqlite' || dbType === 'react-native' || dbType === 'expo') {
      debug('using sqlite/react-native migration file')
      const mig = new CreateStatusList1693866470002()
      const up = await mig.up(queryRunner)
      debug('Migration statements executed')
      return up
    } else {
      return Promise.reject(
        `Migrations are currently only supported for sqlite, react-native, expo and postgres. Was ${dbType}. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now`,
      )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    debug('migration: reverting issuance branding tables')
    const dbType = queryRunner.connection.driver.options.type
    if (dbType === 'postgres') {
      debug('using postgres migration file')
      const mig = new CreateStatusList1693866470002()
      const down = await mig.down(queryRunner)
      debug('Migration statements executed')
      return down
    } else if (dbType === 'sqlite' || dbType === 'react-native' || dbType === 'expo') {
      debug('using sqlite/react-native migration file')
      const mig = new CreateStatusList1693866470002()
      const down = await mig.down(queryRunner)
      debug('Migration statements executed')
      return down
    } else {
      return Promise.reject(
        `Migrations are currently only supported for sqlite, react-native, expo and postgres. Was ${dbType}. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now`,
      )
    }
  }
}
