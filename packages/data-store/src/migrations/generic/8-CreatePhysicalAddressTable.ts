import { DatabaseType, MigrationInterface, QueryRunner } from 'typeorm'
import Debug from 'debug'
import { CreatePhysicalAddressTable1712695589134 } from '../postgres/1712695589134-CreatePhysicalAddressTable'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:migrations')

export class CreatePhysicalAddressTable1708098041262 implements MigrationInterface {
  name = 'CreatePhysicalAddressTable1708098041262'

  public async up(queryRunner: QueryRunner): Promise<void> {
    debug('migration: creating physical address tables on postgres')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file')
        const mig: CreatePhysicalAddressTable1712695589134 = new CreatePhysicalAddressTable1712695589134()
        await mig.up(queryRunner)
        debug('Migration statements executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('No need to execute migration for this update')
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
        const mig: CreatePhysicalAddressTable1712695589134 = new CreatePhysicalAddressTable1712695589134()
        await mig.down(queryRunner)
        debug('Migration statements executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('No need to execute migration for this update')
        return
      }
      default:
        return Promise.reject(
          `Migrations are currently only supported for sqlite, react-native, expo and postgres. Was ${dbType}. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now`,
        )
    }
  }
}
