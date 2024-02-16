import { DatabaseType, MigrationInterface, QueryRunner } from 'typeorm'
import Debug from 'debug'
import { CreateXStateStore1708097018115 } from '../postgres/1708097018115-CreateXStateStore'
import { CreateXStateStore1708096002272 } from '../sqlite/1708096002272-CreateXStateStore'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:migrations')

export class CreateXStateStore1708098041262 implements MigrationInterface {
    name = 'CreateXStateStore1708098041262'

    public async up(queryRunner: QueryRunner): Promise<void> {
        debug('migration: creating contacts tables')
        const dbType: DatabaseType = queryRunner.connection.driver.options.type

        switch (dbType) {
            case 'postgres': {
                debug('using postgres migration file')
                const mig: CreateXStateStore1708097018115 = new CreateXStateStore1708097018115()
                await mig.up(queryRunner)
                debug('Migration statements executed')
                return
            }
            case 'sqlite':
            case 'expo':
            case 'react-native': {
                debug('using sqlite/react-native migration file')
                const mig: CreateXStateStore1708096002272 = new CreateXStateStore1708096002272()
                await mig.up(queryRunner)
                debug('Migration statements executed')
                return
            }
            default:
                return Promise.reject(
                    `Migrations are currently only supported for sqlite, react-native, expo and postgres. Was ${dbType}. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now`
                )
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        debug('migration: reverting contacts tables')
        const dbType: DatabaseType = queryRunner.connection.driver.options.type

        switch (dbType) {
            case 'postgres': {
                debug('using postgres migration file')
                const mig: CreateXStateStore1708097018115 = new CreateXStateStore1708097018115()
                await mig.down(queryRunner)
                debug('Migration statements executed')
                return
            }
            case 'sqlite':
            case 'expo':
            case 'react-native': {
                debug('using sqlite/react-native migration file')
                const mig: CreateXStateStore1708096002272 = new CreateXStateStore1708096002272()
                await mig.down(queryRunner)
                debug('Migration statements executed')
                return
            }
            default:
                return Promise.reject(
                    `Migrations are currently only supported for sqlite, react-native, expo and postgres. Was ${dbType}. Please run your database without migrations and with 'migrationsRun: false' and 'synchronize: true' for now`
                )
        }
    }
}
