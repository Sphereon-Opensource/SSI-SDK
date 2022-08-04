import { MigrationInterface, QueryRunner } from 'typeorm'
import Debug from 'debug'
import { CreateMnemonics1659566636105 } from '../postgres/1659566636105-CreateMnemonics'
import { CreateMnemonics1659566622817 } from '../sqlite/1659566622817-CreateMnemonics'

const debug = Debug('sphereon:ssi-sdk:migrations')

export class CreateMnemonics1659567079429 implements MigrationInterface {
  name = 'CreateMnemonics1659567079429'

  public async up(queryRunner: QueryRunner): Promise<void> {
    debug('migration: creating mnemonic tables')
    const dbType = queryRunner.connection.driver.options.type
    if (dbType === 'postgres') {
      debug('using postgres migration file')
      const mig = new CreateMnemonics1659566636105()
      const up = await mig.up(queryRunner)
      debug('Migration statements executed')
      return up
    } else if (dbType === 'sqlite' || 'react-native') {
      debug('using sqlite/react-native migration file')
      const mig = new CreateMnemonics1659566622817()
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
    debug('reverting mnemonic tables')
    const dbType = queryRunner.connection.driver.options.type
    if (dbType === 'postgres') {
      debug('using postgres migration file')
      const mig = new CreateMnemonics1659566636105()
      const down = await mig.down(queryRunner)
      debug('Migration statements executed')
      return down
    } else if (dbType === 'sqlite' || 'react-native') {
      debug('using sqlite/react-native migration file')
      const mig = new CreateMnemonics1659566622817()
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
