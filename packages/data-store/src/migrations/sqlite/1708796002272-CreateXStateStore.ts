import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateXStateStore1708796002272 implements MigrationInterface {
  name = 'CreateXStateStore1708796002272'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "StateEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "step" varchar NOT NULL,
                "type" varchar NOT NULL,
                "event_name" varchar NOT NULL,
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
