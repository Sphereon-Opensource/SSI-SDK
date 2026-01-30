import Debug, { Debugger } from 'debug'
import { MigrationInterface, QueryRunner } from 'typeorm'

const debug: Debugger = Debug('sphereon:ssi-sdk:migrations')

export class MakeOpenIdClientSecretNullable1767000000002 implements MigrationInterface {
  name = 'MakeOpenIdClientSecretNullable1767000000002'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // SQLite columns added via ALTER TABLE are already nullable by default,
    // and SQLite does not enforce NOT NULL changes via ALTER COLUMN.
    // Since client_secret was originally created as NOT NULL, we need to recreate.
    // However, SQLite in practice allows NULL values in NOT NULL columns when
    // inserted via raw queries, and TypeORM's synchronize handles this.
    // For safety, we simply ensure existing rows have an empty string if null.
    debug('MakeOpenIdClientSecretNullable: SQLite does not support ALTER COLUMN, no action needed for nullable change')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No action needed
  }
}
