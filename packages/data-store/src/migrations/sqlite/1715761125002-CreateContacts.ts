import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateContacts1715761125002 implements MigrationInterface {
  name = 'CreateContacts1715761125002'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Upgrade IdentityMetadata table
    await queryRunner.query(`ALTER TABLE "IdentityMetadata" RENAME TO "temporary_IdentityMetadata"`)
    await queryRunner.query(`CREATE TABLE "IdentityMetadata"
                             (
                                 "id"          varchar PRIMARY KEY NOT NULL,
                                 "label"       varchar(255)        NOT NULL,
                                 "valueType"   varchar             NOT NULL,
                                 "stringValue" varchar(255),
                                 "numberValue" double,
                                 "dateValue"   datetime,
                                 "boolValue"   boolean,
                                 "identityId"  varchar,
                                 FOREIGN KEY ("identityId") REFERENCES "Identity" ("id") ON DELETE CASCADE)`)
    await queryRunner.query(`INSERT INTO "IdentityMetadata" ("id", "label", "valueType", "stringValue", "identityId")
                                 SELECT "id", "label", 'string', "value", "identityId"
                                 FROM "temporary_IdentityMetadata"
        `)
    await queryRunner.query(`DROP TABLE "temporary_IdentityMetadata"`)

    // Create new ContactMetadata table
    await queryRunner.query(`CREATE TABLE "ContactMetadata"
                                 (
                                     "id"          varchar PRIMARY KEY NOT NULL,
                                     "label"       varchar(255)        NOT NULL,
                                     "valueType"   varchar             NOT NULL,
                                     "stringValue" text,
                                     "numberValue" double,
                                     "dateValue"   datetime,
                                     "boolValue"   boolean,
                                     "contactId"   varchar,
                                     FOREIGN KEY ("contactId") REFERENCES "BaseContact" ("id") ON DELETE CASCADE)`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the ContactMetadata table
    await queryRunner.query(`DROP TABLE "ContactMetadata"`)

    // Restore the IdentityMetadata table
    await queryRunner.query(`ALTER TABLE "IdentityMetadata" RENAME TO "temporary_IdentityMetadata"`)
    await queryRunner.query(`CREATE TABLE "IdentityMetadata"
                                 (
                                     "id"         varchar PRIMARY KEY NOT NULL,
                                     "label"      varchar(255)        NOT NULL,
                                     "value"      varchar(255)        NOT NULL,
                                     "identityId" varchar,
                                     FOREIGN KEY ("identityId") REFERENCES "Identity" ("id") ON DELETE CASCADE
                                 )`)
    await queryRunner.query(`INSERT INTO "IdentityMetadata" ("id", "label", "value", "identityId")
                                 SELECT "id", "label", "stringValue", "identityId"
                                 FROM "temporary_IdentityMetadata"`)
    await queryRunner.query(`DROP TABLE "temporary_IdentityMetadata"`)
  }
}
