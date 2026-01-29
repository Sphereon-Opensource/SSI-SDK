import Debug, { Debugger } from 'debug'
import { MigrationInterface, QueryRunner } from 'typeorm'

const debug: Debugger = Debug('sphereon:ssi-sdk:migrations')

export class MakeOpenIdClientSecretNullable1767000000001 implements MigrationInterface {
  name = 'MakeOpenIdClientSecretNullable1767000000001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('BaseConfig')
    if (!table) {
      debug('MakeOpenIdClientSecretNullable: Skipping migration - BaseConfig table does not exist')
      return
    }

    const column = table.columns.find((col) => col.name === 'client_secret')
    if (column && !column.isNullable) {
      await queryRunner.query(`ALTER TABLE "BaseConfig" ALTER COLUMN "client_secret" DROP NOT NULL`)
      debug('MakeOpenIdClientSecretNullable: Made client_secret nullable')
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('BaseConfig')
    if (!table) {
      return
    }

    await queryRunner.query(`UPDATE "BaseConfig" SET "client_secret" = '' WHERE "client_secret" IS NULL`)
    await queryRunner.query(`ALTER TABLE "BaseConfig" ALTER COLUMN "client_secret" SET NOT NULL`)
  }
}
