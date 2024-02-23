import { enablePostgresUuidExtension } from '@sphereon/ssi-sdk.core'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateXStateStore1708097018115 implements MigrationInterface {
  name = 'CreateXStateStore1708097018115'

  public async up(queryRunner: QueryRunner): Promise<any> {
    await enablePostgresUuidExtension(queryRunner)
    await queryRunner.query(
      `CREATE TABLE "StateEntity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "state" varchar(255) NOT NULL, "type" varchar(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "completed_at" TIMESTAMP, "tenant_id" varchar(255) NULL, "ttl" INTEGER NULL, CONSTRAINT PK_XStateStore_id PRIMARY KEY ("id"))`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "StateEntity" DROP CONSTRAINT "PK_StateStore_id"`)
    await queryRunner.query(`DROP TABLE "StateEntity"`)
  }
}
