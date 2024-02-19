import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateXStateStore1708096002272 implements MigrationInterface {
    name = 'CreateXStateStore1708096002272'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(
            `CREATE TABLE "XStateStore" ("id" varchar PRIMARY KEY NOT NULL, "state" varchar(255) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_XStateStore_id")`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "XStateStore" DROP CONSTRAINT "PK_XStateStore_id"`)
        await queryRunner.query(`DROP TABLE "XStateStore"`)
    }
}
