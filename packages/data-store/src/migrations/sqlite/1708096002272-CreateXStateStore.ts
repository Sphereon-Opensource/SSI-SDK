import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateXStateStore1708096002272 implements MigrationInterface {
    name = 'CreateXStateStore1708096002272'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(
            `CREATE TABLE "StateEntity" ("id" varchar PRIMARY KEY, "state" varchar(255) NOT NULL, "type" varchar(255) NOT NULL, "created_at" DATETIME NOT NULL DEFAULT (datetime('now')), "updated_at" DATETIME NOT NULL DEFAULT (datetime('now')), "completed_at" DATETIME, "tenant_id" varchar(255) NULL, "ttl" INTEGER NULL)`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "StateEntity"`)
        await queryRunner.query(`DROP TABLE "StateEntity"`)
    }
}
