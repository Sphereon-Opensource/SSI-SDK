import { enablePostgresUuidExtension } from '@sphereon/ssi-sdk.core'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateXStateStore1708097018115 implements MigrationInterface {
  name = 'CreateXStateStore1708097018115'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await enablePostgresUuidExtension(queryRunner)
    await queryRunner.query(`
            CREATE TABLE "StateEntity" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "step" character varying NOT NULL,
                "type" character varying NOT NULL,
                "event_name" character varying NOT NULL,
                "state" text NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "expires_at" TIMESTAMP,
                "completed_at" TIMESTAMP,
                "tenant_id" character varying,
                CONSTRAINT "PK_StateEntity_id" PRIMARY KEY ("id")
            )
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "StateEntity"`)
  }
}