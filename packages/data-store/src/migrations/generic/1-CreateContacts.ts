import { DatabaseType, MigrationInterface, QueryRunner } from 'typeorm'
import Debug from 'debug'
import { CreateContacts1659463079428 } from '../postgres/1659463079428-CreateContacts'
// import { CreateContacts1690925872592 } from '../postgres/1690925872592-CreateContacts'
import { CreateContacts1659463069549 } from '../sqlite/1659463069549-CreateContacts'
// import { CreateContacts1690925872693 } from '../sqlite/1690925872693-CreateContacts'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:migrations')

export class CreateContacts1659463079429 implements MigrationInterface {
  name = 'CreateContacts1659463079429'

  // private readonly sqliteMigrations: MigrationInterface[] = [
  //   new CreateContacts1659463069549(),
  //   // new CreateContacts1690925872693(),
  // ];
  //
  // private readonly postgresMigrations: MigrationInterface[] = [
  //   new CreateContacts1659463079428(),
  //   new CreateContacts1690925872592()
  // ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    debug('migration: creating contacts tables')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file')
        const mig: CreateContacts1659463079428 = new CreateContacts1659463079428()
        // const up: void = await mig.up(queryRunner)
        await mig.up(queryRunner)
        // for (const mig of this.postgresMigrations) {
        //   await mig.up(queryRunner);
        // }
        debug('Migration statements executed')
        // return up
        return
      }
      case 'sqlite':
      case 'react-native': {
        debug('using sqlite/react-native migration file')
        // for (const mig of this.sqliteMigrations) {
        //   await mig.up(queryRunner);
        //   debug('Migration statements executed');
        // }
        const mig: CreateContacts1659463069549 = new CreateContacts1659463069549()
        await mig.up(queryRunner)
        // const mig: CreateContacts1659463069549 = new CreateContacts1659463069549()
        // const up: void = await mig.up(queryRunner)
        debug('Migration statements executed')
        // return up
        return
      }
      default:
        return Promise.reject(
          "Migrations are currently only supported for sqlite, react-native and postgres. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now"
        )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    debug('migration: reverting contacts tables')
    const dbType: DatabaseType = queryRunner.connection.driver.options.type

    switch (dbType) {
      case 'postgres': {
        debug('using postgres migration file')
        // const mig: CreateContacts1659463079428 = new CreateContacts1659463079428()
        // const down: void = await mig.down(queryRunner)
        const mig: CreateContacts1659463079428 = new CreateContacts1659463079428()
        await mig.down(queryRunner)
        // for (const mig of this.postgresMigrations.reverse()) {
        //   await mig.down(queryRunner);
        // }
        debug('Migration statements executed')
        // return down
        return
      }
      case 'sqlite':
      case 'react-native': {
        debug('using sqlite/react-native migration file')
        // for (const mig of this.sqliteMigrations.reverse()) {
        //   await mig.down(queryRunner);
        // }
        // const mig: CreateContacts1659463069549 = new CreateContacts1659463069549()
        // const down: void = await mig.down(queryRunner)
        const mig: CreateContacts1659463069549 = new CreateContacts1659463069549()
        await mig.down(queryRunner)
        debug('Migration statements executed')
        // return down
        return
      }
      default:
        return Promise.reject(
          "Migrations are currently only supported for sqlite, react-native and postgres. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now"
        )
    }

    // if (dbType === 'postgres') {
    //   debug('using postgres migration file')
    //   const mig = new CreateContacts1659463079428()
    //   const down = await mig.down(queryRunner)
    //   debug('Migration statements executed')
    //   return down
    // } else if (dbType === 'sqlite' || 'react-native') {
    //   debug('using sqlite/react-native migration file')
    //   const mig = new CreateContacts1659463069549()
    //   const down = await mig.down(queryRunner)
    //   debug('Migration statements executed')
    //   return down
    // } else {
    //   return Promise.reject(
    //     "Migrations are currently only supported for sqlite, react-native and postgres. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now"
    //   )
    // }
  }
}
