import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateStatusList1693866470002 implements MigrationInterface {
  name = 'CreateStatusList1693866470002'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "StatusListEntry" ("statusListId" varchar NOT NULL, "statusListIndex" integer NOT NULL, "credentialId" varchar, "credentialHash" varchar(128), "correlationId" varchar(255), "value" varchar(50), PRIMARY KEY ("statusListId", "statusListIndex"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "StatusList" ("id" varchar PRIMARY KEY NOT NULL, "correlationId" varchar NOT NULL, "length" integer NOT NULL, "issuer" text NOT NULL, "type" varchar CHECK( "type" IN ('StatusList2021') ) NOT NULL DEFAULT ('StatusList2021'), "driverType" varchar CHECK( "driverType" IN ('agent_typeorm','agent_kv_store','github','agent_filesystem') ) NOT NULL DEFAULT ('agent_typeorm'), "credentialIdMode" varchar CHECK( "credentialIdMode" IN ('ISSUANCE','PERSISTENCE','NEVER') ) NOT NULL DEFAULT ('ISSUANCE'), "proofFormat" varchar CHECK( "proofFormat" IN ('lds','jwt') ) NOT NULL DEFAULT ('lds'), "indexingDirection" varchar CHECK( "indexingDirection" IN ('rightToLeft') ) NOT NULL DEFAULT ('rightToLeft'), "statusPurpose" varchar NOT NULL DEFAULT ('revocation'), "statusListCredential" text, CONSTRAINT "UQ_correlationId" UNIQUE ("correlationId"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "temporary_StatusListEntry" ("statusListId" varchar NOT NULL, "statusListIndex" integer NOT NULL, "credentialId" varchar, "credentialHash" varchar(128), "correlationId" varchar(255), "value" varchar(50), CONSTRAINT "FK_statusListEntry_statusListId" FOREIGN KEY ("statusListId") REFERENCES "StatusList" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, PRIMARY KEY ("statusListId", "statusListIndex"))`,
    )
    await queryRunner.query(
      `INSERT INTO "temporary_StatusListEntry"("statusListId", "statusListIndex", "credentialId", "credentialHash", "correlationId", "value") SELECT "statusListId", "statusListIndex", "credentialId", "credentialHash", "correlationId", "value" FROM "StatusListEntry"`,
    )
    await queryRunner.query(`DROP TABLE "StatusListEntry"`)
    await queryRunner.query(`ALTER TABLE "temporary_StatusListEntry" RENAME TO "StatusListEntry"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
