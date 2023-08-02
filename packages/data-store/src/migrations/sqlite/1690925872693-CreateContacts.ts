import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateContacts1690925872693 implements MigrationInterface {
  name = 'CreateContacts1690925872693'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "contact_type_entity" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar CHECK( "type" IN ('person','organization') ) NOT NULL, "name" varchar(255) NOT NULL, "description" varchar(255), "tenantId" varchar(255) NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_951a7b2f1b044e348fe5b7a6172" UNIQUE ("name"))`
    )

  }

  public async down(queryRunner: QueryRunner): Promise<void> {

  }
}
