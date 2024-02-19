import {enablePostgresUuidExtension} from "@sphereon/ssi-sdk.core";
import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateXStateStore1708097018115 implements MigrationInterface {
    name = 'CreateXStateStore1708097018115'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await enablePostgresUuidExtension(queryRunner)
        await queryRunner.query(
            `CREATE TABLE "XStateStore" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "state" varchar(255) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT PK_XStateStore_id PRIMARY KEY ("id")`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "XStateStore" DROP CONSTRAINT "PK_XStateStore_id"`)
        await queryRunner.query(`DROP TABLE "XStateEntity"`)
    }
}
