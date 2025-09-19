import Debug from 'debug'
import { DatabaseType, MigrationInterface, QueryRunner } from 'typeorm'

import { UpdatePresentationDefinitionItemNullablePG1741895824000 } from '../postgres/1756975509000-UpdatePresentationDefinitionItemNullable'
import { UpdatePresentationDefinitionItemNullableSqlite1756975340000 } from '../sqlite/1756975340000-UpdatePresentationDefinitionItemNullable'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:migrations')

export class UpdatePresentationDefinitionItemNullable1741895824000 implements MigrationInterface {
  name = 'UpdatePresentationDefinitionItemNullable1741895824000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    debug('migration: updating presentation definition item nullable fields')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file')
        const mig: UpdatePresentationDefinitionItemNullablePG1741895824000 = new UpdatePresentationDefinitionItemNullablePG1741895824000()
        await mig.up(queryRunner)
        debug('Migration statements executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file')
        const mig: UpdatePresentationDefinitionItemNullableSqlite1756975340000 = new UpdatePresentationDefinitionItemNullableSqlite1756975340000()
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
    debug('migration: reverting presentation definition item nullable fields')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file')
        const mig: UpdatePresentationDefinitionItemNullablePG1741895824000 = new UpdatePresentationDefinitionItemNullablePG1741895824000()
        await mig.down(queryRunner)
        debug('Migration statements executed')
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        debug('using sqlite/react-native migration file')
        const mig: UpdatePresentationDefinitionItemNullableSqlite1756975340000 = new UpdatePresentationDefinitionItemNullableSqlite1756975340000()
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
