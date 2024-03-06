import { enablePostgresUuidExtension } from '@sphereon/ssi-sdk.core'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateMachineStateStore1708797018115 implements MigrationInterface {
  name = 'CreateMachineStateStore1708797018115'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await enablePostgresUuidExtension(queryRunner)
    await queryRunner.query(`
            CREATE TABLE "MachineStateInfoEntity" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "latest_state_name" character varying NOT NULL,
                "machine_id" character varying NOT NULL,
                "latest_event_type" character varying NOT NULL,
                "state" text NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "expires_at" TIMESTAMP,
                "completed_at" TIMESTAMP,
                "tenant_id" character varying,
                CONSTRAINT "PK_MachineStateInfoEntity_id" PRIMARY KEY ("id")
            )
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "MachineStateInfoEntity"`)
  }
}
