import { MigrationInterface, QueryRunner } from 'typeorm'

export class UpdateStatusList1737110469000 implements MigrationInterface {
  name = 'UpdateStatusList1737110469000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create temporary table with new schema
    await queryRunner.query(
      `CREATE TABLE "temporary_StatusList" (
                "id" varchar PRIMARY KEY NOT NULL,
                "correlationId" varchar NOT NULL,
                "length" integer NOT NULL,
                "issuer" text NOT NULL,
                "type" varchar CHECK( "type" IN ('StatusList2021', 'OAuthStatusList') ) NOT NULL DEFAULT ('StatusList2021'),
                "driverType" varchar CHECK( "driverType" IN ('agent_typeorm','agent_kv_store','github','agent_filesystem') ) NOT NULL DEFAULT ('agent_typeorm'),
                "credentialIdMode" varchar CHECK( "credentialIdMode" IN ('ISSUANCE','PERSISTENCE','NEVER') ) NOT NULL DEFAULT ('ISSUANCE'),
                "proofFormat" varchar CHECK( "proofFormat" IN ('lds','jwt') ) NOT NULL DEFAULT ('lds'),
                "indexingDirection" varchar CHECK( "indexingDirection" IN ('rightToLeft') ),
                "statusPurpose" varchar,
                "statusListCredential" text,
                "bitsPerStatus" integer,
                "expiresAt" varchar,
                CONSTRAINT "UQ_correlationId" UNIQUE ("correlationId")
            )`,
    )

    // Copy data from old table to temporary table
    await queryRunner.query(
      `INSERT INTO "temporary_StatusList"(
                "id", "correlationId", "length", "issuer", "type", "driverType",
                "credentialIdMode", "proofFormat", "indexingDirection", "statusPurpose",
                "statusListCredential"
            )
            SELECT 
                "id", "correlationId", "length", "issuer", "type", "driverType",
                "credentialIdMode", "proofFormat", "indexingDirection", "statusPurpose",
                "statusListCredential"
            FROM "StatusList"`,
    )

    // Drop old table and rename temporary table
    await queryRunner.query(`DROP TABLE "StatusList"`)
    await queryRunner.query(`ALTER TABLE "temporary_StatusList" RENAME TO "StatusList"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Create temporary table with old schema
    await queryRunner.query(
      `CREATE TABLE "temporary_StatusList" (
                "id" varchar PRIMARY KEY NOT NULL,
                "correlationId" varchar NOT NULL,
                "length" integer NOT NULL,
                "issuer" text NOT NULL,
                "type" varchar CHECK( "type" IN ('StatusList2021') ) NOT NULL DEFAULT ('StatusList2021'),
                "driverType" varchar CHECK( "driverType" IN ('agent_typeorm','agent_kv_store','github','agent_filesystem') ) NOT NULL DEFAULT ('agent_typeorm'),
                "credentialIdMode" varchar CHECK( "credentialIdMode" IN ('ISSUANCE','PERSISTENCE','NEVER') ) NOT NULL DEFAULT ('ISSUANCE'),
                "proofFormat" varchar CHECK( "proofFormat" IN ('lds','jwt') ) NOT NULL DEFAULT ('lds'),
                "indexingDirection" varchar CHECK( "indexingDirection" IN ('rightToLeft') ) NOT NULL DEFAULT ('rightToLeft'),
                "statusPurpose" varchar NOT NULL DEFAULT ('revocation'),
                "statusListCredential" text,
                CONSTRAINT "UQ_correlationId" UNIQUE ("correlationId")
            )`,
    )

    // Copy data back, excluding new columns
    await queryRunner.query(
      `INSERT INTO "temporary_StatusList"(
                "id", "correlationId", "length", "issuer", "type", "driverType",
                "credentialIdMode", "proofFormat", "indexingDirection", "statusPurpose",
                "statusListCredential"
            )
            SELECT 
                "id", "correlationId", "length", "issuer", 
                CASE WHEN "type" = 'OAuthStatusList' THEN 'StatusList2021' ELSE "type" END,
                "driverType", "credentialIdMode", "proofFormat", "indexingDirection",
                COALESCE("statusPurpose", 'revocation'), "statusListCredential"
            FROM "StatusList"`,
    )

    // Drop new table and rename temporary table back
    await queryRunner.query(`DROP TABLE "StatusList"`)
    await queryRunner.query(`ALTER TABLE "temporary_StatusList" RENAME TO "StatusList"`)
  }
}
