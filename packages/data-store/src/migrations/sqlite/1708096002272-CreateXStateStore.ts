import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateXStateStore1708096002272 implements MigrationInterface {
    name = 'CreateXStateStore1708096002272'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(
            `CREATE TABLE "XStateEntity" ("id" varchar PRIMARY KEY NOT NULL, "state" varchar(255) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT (datetime('now')), "updatedAt" TIMESTAMP NOT NULL DEFAULT (datetime('now')), "deletedAt" TIMESTAMP, CONSTRAINT "PK_XStateEntity_id")`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "XStateEntity" DROP CONSTRAINT "PK_XStateEntity_id"`)
        await queryRunner.query(`DROP TABLE "XStateEntity"`)
    }
}
