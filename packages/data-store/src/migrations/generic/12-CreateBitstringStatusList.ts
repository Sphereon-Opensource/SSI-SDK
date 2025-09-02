import Debug from 'debug'
import { DatabaseType, MigrationInterface, QueryRunner } from 'typeorm'
import {
  AddBitstringStatusListEnumPG1741895823000,
  CreateBitstringStatusListPG1741895823000,
} from '../postgres/1741895823000-CreateBitstringStatusList'
import { CreateBitstringStatusListSqlite1741895823001 } from '../sqlite/1741895823001-CreateBitstringStatusList'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:migrations')

export class AddBitstringStatusListEnum1741895823000 implements MigrationInterface {
  name = 'AddBitstringStatusListEnum1741895823000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    debug('migration: creating bitstring status list tables')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type
    switch (dbType) {
      case 'postgres': {
        const mig = new AddBitstringStatusListEnumPG1741895823000()
        await mig.up(queryRunner)
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        return
      }
      default:
        return Promise.reject(`Migrations only supported for sqlite and postgres. Was ${dbType}`)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async down(queryRunner: QueryRunner): Promise<void> {}
}

export class CreateBitstringStatusList1741895823000 implements MigrationInterface {
  name = 'CreateBitstringStatusList1741895823000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    debug('migration: creating bitstring status list tables')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type
    switch (dbType) {
      case 'postgres': {
        const mig = new CreateBitstringStatusListPG1741895823000()
        await mig.up(queryRunner)
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        const mig = new CreateBitstringStatusListSqlite1741895823001()
        await mig.up(queryRunner)
        return
      }
      default:
        return Promise.reject(`Migrations only supported for sqlite and postgres. Was ${dbType}`)
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    debug('migration: dropping bitstring status list tables')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type
    switch (dbType) {
      case 'postgres': {
        const mig = new CreateBitstringStatusListPG1741895823000()
        await mig.down(queryRunner)
        return
      }
      case 'sqlite':
      case 'expo':
      case 'react-native': {
        const mig = new CreateBitstringStatusListSqlite1741895823001()
        await mig.down(queryRunner)
        return
      }
      default:
        return Promise.reject(`Migrations only supported for sqlite and postgres. Was ${dbType}`)
    }
  }
}
