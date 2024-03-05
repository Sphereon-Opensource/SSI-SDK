import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateXStateStore1708796002272 implements MigrationInterface {
  name = 'CreateXStateStore1708796002272'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "StateEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "state_name" varchar NOT NULL,
                "machine_type" varchar NOT NULL,
                "xstate_event_type" varchar NOT NULL,
                "state" text NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "expires_at" datetime,
                "completed_at" datetime,
                "tenant_id" varchar
            )
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "StateEntity"`)
  }
}
