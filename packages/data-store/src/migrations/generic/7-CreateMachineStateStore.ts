import { DatabaseType, MigrationInterface, QueryRunner } from 'typeorm'
import Debug from 'debug'
import { CreateMachineStateStore1708797018115 } from '../postgres/1708797018115-CreateMachineStateStore'
import { CreateMachineStateStore1708796002272 } from '../sqlite/1708796002272-CreateMachineStateStore'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:migrations')

export class CreateMachineStateStore1708098041262 implements MigrationInterface {
  name = 'CreateMachineStateStore1708098041262'

  public async up(queryRunner: QueryRunner): Promise<void> {
    debug('migration: creating machine state tables')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file')
        const mig: CreateMachineStateStore1708797018115 = new CreateMachineStateStore1708797018115()
        await mig.up(queryRunner)
        debug('Migration statements executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file')
        const mig: CreateMachineStateStore1708796002272 = new CreateMachineStateStore1708796002272()
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
    debug('migration: reverting machine state tables')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file')
        const mig: CreateMachineStateStore1708797018115 = new CreateMachineStateStore1708797018115()
        await mig.down(queryRunner)
        debug('Migration statements executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file')
        const mig: CreateMachineStateStore1708796002272 = new CreateMachineStateStore1708796002272()
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
