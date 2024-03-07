import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateMachineStateStore1708796002272 implements MigrationInterface {
  name = 'CreateMachineStateStore1708796002272'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "MachineStateInfoEntity" (
                "instance_id" varchar PRIMARY KEY NOT NULL,
                "session_id" varchar,
                "machine_name" varchar NOT NULL,
                "latest_state_name" varchar,
                "latest_event_type" varchar NOT NULL,
                "state" text NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_count" integer NOT NULL DEFAULT 0,
                "expires_at" datetime,
                "completed_at" datetime,
                "tenant_id" varchar
            )
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "MachineStateInfoEntity"`)
  }
}
