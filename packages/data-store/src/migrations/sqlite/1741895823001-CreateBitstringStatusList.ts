import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateBitstringStatusListSqlite1741895823001 implements MigrationInterface {
  name = 'CreateBitstringStatusList1741895823000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update StatusList table to include BitstringStatusList type and columns
    await queryRunner.query(`
      CREATE TABLE "temporary_StatusList" (
        "id" varchar PRIMARY KEY NOT NULL,
        "correlationId" varchar NOT NULL,
        "length" integer NOT NULL,
        "issuer" text NOT NULL,
        "type" varchar CHECK( "type" IN ('StatusList2021', 'OAuthStatusList', 'BitstringStatusList') ) NOT NULL DEFAULT ('StatusList2021'),
        "driverType" varchar CHECK( "driverType" IN ('agent_typeorm','agent_kv_store','github','agent_filesystem') ) NOT NULL DEFAULT ('agent_typeorm'),
        "credentialIdMode" varchar CHECK( "credentialIdMode" IN ('ISSUANCE','PERSISTENCE','NEVER') ) NOT NULL DEFAULT ('ISSUANCE'),
        "proofFormat" varchar CHECK( "proofFormat" IN ('lds','jwt', 'vc+jwt') ) NOT NULL DEFAULT ('lds'),
        "indexingDirection" varchar CHECK( "indexingDirection" IN ('rightToLeft') ),
        "statusPurpose" varchar,
        "statusListCredential" text,
        "expiresAt" datetime,
        "bitsPerStatus" integer DEFAULT (1),
        "ttl" integer,
        "validFrom" datetime,
        "validUntil" datetime,
        CONSTRAINT "UQ_correlationId" UNIQUE ("correlationId")
      )
    `)

    await queryRunner.query(`
      INSERT INTO "temporary_StatusList"(
        "id", "correlationId", "length", "issuer", "type", "driverType",
        "credentialIdMode", "proofFormat", "indexingDirection", "statusPurpose",
        "statusListCredential", "bitsPerStatus", "expiresAt"
      )
      SELECT 
        "id", "correlationId", "length", "issuer", "type", "driverType",
        "credentialIdMode", "proofFormat", "indexingDirection", "statusPurpose",
        "statusListCredential", "bitsPerStatus", "expiresAt"
      FROM "StatusList"
    `)

    await queryRunner.query(`DROP TABLE "StatusList"`)
    await queryRunner.query(`ALTER TABLE "temporary_StatusList" RENAME TO "StatusList"`)

    // Update StatusListEntry table with inheritance and bitstring columns
    await queryRunner.query(`
      CREATE TABLE "temporary_StatusListEntry" (
        "statusListId" varchar NOT NULL,
        "statusListIndex" integer NOT NULL,
        "credentialId" text,
        "credentialHash" varchar(128),
        "correlationId" varchar(255),
        "value" varchar(50),
        "type" varchar CHECK( "type" IN ('StatusListEntryEntity', 'bitstring') ) NOT NULL DEFAULT ('StatusListEntryEntity'),
        "statusPurpose" varchar,
        "bitsPerStatus" integer DEFAULT (1),
        "statusMessage" text,
        "statusReference" text,
        PRIMARY KEY ("statusListId", "statusListIndex")
      )
    `)

    await queryRunner.query(`
      INSERT INTO "temporary_StatusListEntry"(
        "statusListId", "statusListIndex", "credentialId", "credentialHash", 
        "correlationId", "value", "type"
      )
      SELECT 
        "statusListId", "statusListIndex", "credentialId", "credentialHash",
        "correlationId", "value", 'StatusListEntryEntity'
      FROM "StatusListEntry"
    `)

    await queryRunner.query(`DROP TABLE "StatusListEntry"`)
    await queryRunner.query(`ALTER TABLE "temporary_StatusListEntry" RENAME TO "StatusListEntry"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert StatusListEntry table changes
    await queryRunner.query(`
      CREATE TABLE "temporary_StatusListEntry" (
        "statusListId" varchar NOT NULL,
        "statusListIndex" integer NOT NULL,
        "credentialId" text,
        "credentialHash" varchar(128),
        "correlationId" varchar(255),
        "value" varchar(50),
        PRIMARY KEY ("statusListId", "statusListIndex")
      )
    `)

    await queryRunner.query(`
      INSERT INTO "temporary_StatusListEntry"(
        "statusListId", "statusListIndex", "credentialId", "credentialHash",
        "correlationId", "value"
      )
      SELECT 
        "statusListId", "statusListIndex", "credentialId", "credentialHash",
        "correlationId", "value"
      FROM "StatusListEntry"
      WHERE "type" = 'StatusListEntryEntity'
    `)

    await queryRunner.query(`DROP TABLE "StatusListEntry"`)
    await queryRunner.query(`ALTER TABLE "temporary_StatusListEntry" RENAME TO "StatusListEntry"`)

    // Revert StatusList table changes
    await queryRunner.query(`
      CREATE TABLE "temporary_StatusList" (
        "id" varchar PRIMARY KEY NOT NULL,
        "correlationId" varchar NOT NULL,
        "length" integer NOT NULL,
        "issuer" text NOT NULL,
        "type" varchar CHECK( "type" IN ('StatusList2021', 'OAuthStatusList') ) NOT NULL DEFAULT ('StatusList2021'),
        "driverType" varchar CHECK( "driverType" IN ('agent_typeorm','agent_kv_store','github','agent_filesystem') ) NOT NULL DEFAULT ('agent_typeorm'),
        "credentialIdMode" varchar CHECK( "credentialIdMode" IN ('ISSUANCE','PERSISTENCE','NEVER') ) NOT NULL DEFAULT ('ISSUANCE'),
        "proofFormat" varchar CHECK( "proofFormat" IN ('lds','jwt', 'vc+jwt') ) NOT NULL DEFAULT ('lds'),
        "indexingDirection" varchar CHECK( "indexingDirection" IN ('rightToLeft') ),
        "statusPurpose" varchar,
        "statusListCredential" text,
        "bitsPerStatus" integer,
        "expiresAt" datetime,
        CONSTRAINT "UQ_correlationId" UNIQUE ("correlationId")
      )
    `)

    await queryRunner.query(`
      INSERT INTO "temporary_StatusList"(
        "id", "correlationId", "length", "issuer", "type", "driverType",
        "credentialIdMode", "proofFormat", "indexingDirection", "statusPurpose",
        "statusListCredential", "bitsPerStatus", "expiresAt"
      )
      SELECT 
        "id", "correlationId", "length", "issuer", 
        CASE WHEN "type" = 'BitstringStatusList' THEN 'StatusList2021' ELSE "type" END,
        "driverType", "credentialIdMode", "proofFormat", "indexingDirection",
        "statusPurpose", "statusListCredential", "bitsPerStatus", "expiresAt"
      FROM "StatusList"
    `)

    await queryRunner.query(`DROP TABLE "StatusList"`)
    await queryRunner.query(`ALTER TABLE "temporary_StatusList" RENAME TO "StatusList"`)
  }
}
