import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateMnemonics1659566636105 implements MigrationInterface {
  name = 'CreateMnemonics1659566636105'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "Mnemonic" ("id" character varying NOT NULL, "hash" character varying NOT NULL, "mnemonic" character varying NOT NULL, "master_key" character varying, "chain_code" character varying, CONSTRAINT "UQ_hash" UNIQUE ("hash"), CONSTRAINT "UQ_mnemonic" UNIQUE ("mnemonic"), CONSTRAINT "PK_mnemonic_id" PRIMARY KEY ("id"))`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "Mnemonic"`)
  }
}
