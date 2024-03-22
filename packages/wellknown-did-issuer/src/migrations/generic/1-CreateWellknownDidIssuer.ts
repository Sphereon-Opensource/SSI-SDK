import { MigrationInterface, QueryRunner } from 'typeorm'
import Debug from 'debug'
import { CreateWellknownDidIssuer1661165115000 } from '../postgres/1661165115000-CreateWellknownDidIssuer'
import { CreateWellknownDidIssuer1661161799000 } from '../sqlite/1661161799000-CreateWellknownDidIssuer'

const debug = Debug('sphereon:ssi-sdk:migrations')

export class CreateWellknownDidIssuer1661162010000 implements MigrationInterface {
  name = 'CreateWellknownDidIssuer1661162010000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    debug('migration: creating well-known DID tables')
    const dbType = queryRunner.connection.driver.options.type
    if (dbType === 'postgres') {
      debug('using postgres migration file')
      const mig = new CreateWellknownDidIssuer1661165115000()
      const up = await mig.up(queryRunner)
      debug('Migration statements executed')
      return up
    } else if (dbType === 'sqlite' || dbType === 'react-native' || dbType === 'expo') {
      debug('using sqlite/react-native migration file')
      const mig = new CreateWellknownDidIssuer1661161799000()
      const up = await mig.up(queryRunner)
      debug('Migration statements executed')
      return up
    } else {
      return Promise.reject(
        `Migrations are currently only supported for sqlite, react-native, expor and postgres. Was ${dbType}. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now`,
      )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    debug('reverting well-known DID tables')
    const dbType = queryRunner.connection.driver.options.type
    if (dbType === 'postgres') {
      debug('using postgres migration file')
      const mig = new CreateWellknownDidIssuer1661165115000()
      const down = await mig.down(queryRunner)
      debug('Migration statements executed')
      return down
    } else if (dbType === 'sqlite' || dbType === 'react-native' || dbType === 'expo') {
      debug('using sqlite/react-native migration file')
      const mig = new CreateWellknownDidIssuer1661161799000()
      const down = await mig.down(queryRunner)
      debug('Migration statements executed')
      return down
    } else {
      return Promise.reject(
        `Migrations are currently only supported for sqlite, react-native, expor and postgres. Was ${dbType}. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now`,
      )
    }
  }
}
