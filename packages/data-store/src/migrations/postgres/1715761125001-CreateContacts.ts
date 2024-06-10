import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateContacts1715761125001 implements MigrationInterface {
  name = 'CreateContacts1715761125001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Upgrade IdentityMetadata table
    await queryRunner.query(`ALTER TABLE "IdentityMetadata" RENAME TO "temporary_IdentityMetadata"`)
    await queryRunner.query(`CREATE TABLE "IdentityMetadata"
                             (
                                 "id" uuid PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
                                 "label" character varying(255) NOT NULL,
                                 "valueType" character varying NOT NULL,
                                 "stringValue" text,
                                 "numberValue" double precision,
                                 "dateValue" TIMESTAMP,
                                 "boolValue" boolean,
                                 "identityId" uuid,
                                 CONSTRAINT "FK_Identity_IdentityMetadata" FOREIGN KEY ("identityId") REFERENCES "Identity" ("id") ON DELETE CASCADE
                             )`)
    await queryRunner.query(`INSERT INTO "IdentityMetadata" ("id", "label", "valueType", "stringValue", "identityId")
                             SELECT "id", "label", 'string', "value", "identityId"
                             FROM "temporary_IdentityMetadata"`)
    await queryRunner.query(`DROP TABLE "temporary_IdentityMetadata"`)

    // Create new ContactMetadata table
    await queryRunner.query(`CREATE TABLE "ContactMetadata"
                             (
                                 "id" uuid PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
                                 "label" character varying(255) NOT NULL,
                                 "valueType" character varying NOT NULL,
                                 "stringValue" text,
                                 "numberValue" double precision,
                                 "dateValue" TIMESTAMP,
                                 "boolValue" boolean,
                                 "contactId" uuid,
                                 CONSTRAINT "FK_BaseContact_ContactMetadata" FOREIGN KEY ("contactId") REFERENCES "BaseContact" ("id") ON DELETE CASCADE
                             )`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the ContactMetadata table
    await queryRunner.query(`DROP TABLE "ContactMetadata"`)

    // Restore the IdentityMetadata table
    await queryRunner.query(`ALTER TABLE "IdentityMetadata" RENAME TO "temporary_IdentityMetadata"`)
    await queryRunner.query(`CREATE TABLE "IdentityMetadata"
                             (
                                 "id" uuid PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
                                 "label" character varying(255) NOT NULL,
                                 "value" character varying(255) NOT NULL,
                                 "identityId" uuid,
                                 CONSTRAINT "FK_Identity_IdentityMetadata" FOREIGN KEY ("identityId") REFERENCES "Identity" ("id") ON DELETE CASCADE
                             )`)
    await queryRunner.query(`INSERT INTO "IdentityMetadata" ("id", "label", "value", "identityId")
                             SELECT "id", "label", "stringValue", "identityId"
                             FROM "temporary_IdentityMetadata"`)
    await queryRunner.query(`DROP TABLE "temporary_IdentityMetadata"`)
  }
}
