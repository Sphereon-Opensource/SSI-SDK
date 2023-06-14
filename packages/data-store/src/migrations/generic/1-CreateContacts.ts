import { MigrationInterface, QueryRunner } from 'typeorm'
import Debug from 'debug'
import { CreateContacts1659463079428 } from '../postgres/1659463079428-CreateContacts'
import { CreateContacts1659463069549 } from '../sqlite/1659463069549-CreateContacts'

const debug = Debug('sphereon:ssi-sdk:migrations')

export class CreateContacts1659463079429 implements MigrationInterface {
  name = 'CreateContacts1659463079429'

  public async up(queryRunner: QueryRunner): Promise<void> {
    debug('migration: creating contacts tables')
    const dbType = queryRunner.connection.driver.options.type
    if (dbType === 'postgres') {
      debug('using postgres migration file')
      const mig = new CreateContacts1659463079428()
      const up = await mig.up(queryRunner)
      debug('Migration statements executed')
      return up
    } else if (dbType === 'sqlite' || 'react-native') {
      debug('using sqlite/react-native migration file')
      const mig = new CreateContacts1659463069549()
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
    debug('migration: reverting contacts tables')
    const dbType = queryRunner.connection.driver.options.type
    if (dbType === 'postgres') {
      debug('using postgres migration file')
      const mig = new CreateContacts1659463079428()
      const down = await mig.down(queryRunner)
      debug('Migration statements executed')
      return down
    } else if (dbType === 'sqlite' || 'react-native') {
      debug('using sqlite/react-native migration file')
      const mig = new CreateContacts1659463069549()
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
