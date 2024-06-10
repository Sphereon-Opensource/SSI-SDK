import { DatabaseType, MigrationInterface, QueryRunner } from 'typeorm'
import Debug from 'debug'
import { CreatePresentationDefinitions1716475165345 } from '../postgres/1716475165345-CreatePresentationDefinitions'
import { CreatePresentationDefinitions1716475165344 } from '../sqlite/1716475165344-CreatePresentationDefinitions'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:migrations')

export class CreatePresentationDefinitions1716533767523 implements MigrationInterface {
  name = 'CreatePresentationDefinitionItems1716533767523'

  public async up(queryRunner: QueryRunner): Promise<void> {
    debug('migration: creating machine state tables')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file')
        const mig: CreatePresentationDefinitions1716475165345 = new CreatePresentationDefinitions1716475165345()
        await mig.up(queryRunner)
        debug('Migration statements executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file')
        const mig: CreatePresentationDefinitions1716475165344 = new CreatePresentationDefinitions1716475165344()
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
        const mig: CreatePresentationDefinitions1716475165345 = new CreatePresentationDefinitions1716475165345()
        await mig.down(queryRunner)
        debug('Migration statements executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file')
        const mig: CreatePresentationDefinitions1716475165344 = new CreatePresentationDefinitions1716475165344()
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
