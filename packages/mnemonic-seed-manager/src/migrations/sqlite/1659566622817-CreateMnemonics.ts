import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateMnemonics1659566622817 implements MigrationInterface {
  name = 'CreateMnemonics1659566622817'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "Mnemonic" ("id" varchar PRIMARY KEY NOT NULL, "hash" varchar NOT NULL, "mnemonic" varchar NOT NULL, "master_key" varchar, "chain_code" varchar, CONSTRAINT "UQ_hash" UNIQUE ("hash"), CONSTRAINT "UQ_mnemonic" UNIQUE ("mnemonic"))`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "Mnemonic"`)
  }
}
