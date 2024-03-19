import { DatabaseType, MigrationInterface, QueryRunner } from 'typeorm'
import Debug, { Debugger } from 'debug'
import { CreateAuditEvents1701634819487 } from '../sqlite/1701634819487-CreateAuditEvents'
import { CreateAuditEvents1701634812183 } from '../postgres/1701634812183-CreateAuditEvents'

const debug: Debugger = Debug('sphereon:ssi-sdk:migrations')

export class CreateAuditEvents1701635835330 implements MigrationInterface {
  name: string = 'CreateAuditEvents1701635835330'

  public async up(queryRunner: QueryRunner): Promise<void> {
    debug('migration: creating audit events tables')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file')
        const mig: CreateAuditEvents1701634812183 = new CreateAuditEvents1701634812183()
        await mig.up(queryRunner)
        debug('Migration statements executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file')
        const mig: CreateAuditEvents1701634819487 = new CreateAuditEvents1701634819487()
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
    debug('migration: reverting audit events tables')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file')
        const mig: CreateAuditEvents1701634812183 = new CreateAuditEvents1701634812183()
        await mig.down(queryRunner)
        debug('Migration statements executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file')
        const mig: CreateAuditEvents1701634819487 = new CreateAuditEvents1701634819487()
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
