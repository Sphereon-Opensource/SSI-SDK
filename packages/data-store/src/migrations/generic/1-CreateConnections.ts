import { MigrationInterface, QueryRunner } from 'typeorm'
import debug from 'debug'
import { CreateConnections1659463079428 } from '../postgres/1659463079428-CreateConnections'
import { CreateConnections1659463069549 } from '../sqlite/1659463069549-CreateConnections'

export class CreateConnections1659463079429 implements MigrationInterface {
  name = 'CreateConnections1659463079429'

  public up(queryRunner: QueryRunner): Promise<void> {
    debug(`creating connections tables`)
    const dbType = queryRunner.connection.driver.options.type
    if (dbType === 'postgres') {
      debug(`using postgres migration file`)
      const mig = new CreateConnections1659463079428()
      return mig.up(queryRunner)
    } else if (dbType === 'sqlite' || 'react-native') {
      debug(`using sqlite/react-native migration file`)
      const mig = new CreateConnections1659463069549()
      return mig.up(queryRunner)
    } else {
      throw new Error(
        "Migrations are currently only supported for sqlite, react-native and postgres. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now"
      )
    }
  }

  public down(queryRunner: QueryRunner): Promise<void> {
    debug(`reverting connections tables`)
    const dbType = queryRunner.connection.driver.options.type
    if (dbType === 'postgres') {
      debug(`using postgres migration file`)
      const mig = new CreateConnections1659463079428()
      return mig.down(queryRunner)
    } else if (dbType === 'sqlite' || 'react-native') {
      debug(`using sqlite/react-native migration file`)
      const mig = new CreateConnections1659463069549()
      return mig.down(queryRunner)
    } else {
      throw new Error(
        "Migrations are currently only supported for sqlite, react-native and postgres. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now"
      )
    }
  }
}
