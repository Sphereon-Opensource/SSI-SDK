import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateBitstringStatusListPG1741895823000 implements MigrationInterface {
  name = 'CreateBitstringStatusList1741895823000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add BitstringStatusList columns to StatusList table
    await queryRunner.query(`ALTER TABLE "StatusList" ADD COLUMN "bitsPerStatus" integer DEFAULT 1`)
    await queryRunner.query(`ALTER TABLE "StatusList" ADD COLUMN "ttl" integer`)
    await queryRunner.query(`ALTER TABLE "StatusList" ADD COLUMN "validFrom" TIMESTAMP`)
    await queryRunner.query(`ALTER TABLE "StatusList" ADD COLUMN "validUntil" TIMESTAMP`)

    // Update type enum constraint to include BitstringStatusList
    await queryRunner.query(`ALTER TABLE "StatusList" DROP CONSTRAINT IF EXISTS "CHK_StatusList_type"`)
    await queryRunner.query(
      `ALTER TABLE "StatusList" ADD CONSTRAINT "CHK_StatusList_type" CHECK ("type" IN ('StatusList2021', 'OAuthStatusList', 'BitstringStatusList'))`,
    )

    // Create BitstringStatusListEntry table
    await queryRunner.query(`
      CREATE TABLE "BitstringStatusListEntry" (
        "statusListId" character varying NOT NULL,
        "statusListIndex" integer NOT NULL,
        "credentialId" text,
        "credentialHash" character varying(128),
        "correlationId" character varying(255),
        "statusPurpose" character varying NOT NULL,
        "bitsPerStatus" integer DEFAULT 1,
        "statusMessage" text,
        "statusReference" text,
        CONSTRAINT "PK_BitstringStatusListEntry" PRIMARY KEY ("statusListId", "statusListIndex")
      )
    `)

    await queryRunner.query(`
      ALTER TABLE "BitstringStatusListEntry" 
      ADD CONSTRAINT "FK_BitstringStatusListEntry_statusListId" 
      FOREIGN KEY ("statusListId") REFERENCES "StatusList"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "BitstringStatusListEntry" DROP CONSTRAINT "FK_BitstringStatusListEntry_statusListId"`)
    await queryRunner.query(`DROP TABLE "BitstringStatusListEntry"`)

    await queryRunner.query(`ALTER TABLE "StatusList" DROP CONSTRAINT "CHK_StatusList_type"`)
    await queryRunner.query(`ALTER TABLE "StatusList" ADD CONSTRAINT "CHK_StatusList_type" CHECK ("type" IN ('StatusList2021', 'OAuthStatusList'))`)

    await queryRunner.query(`ALTER TABLE "StatusList" DROP COLUMN "validUntil"`)
    await queryRunner.query(`ALTER TABLE "StatusList" DROP COLUMN "validFrom"`)
    await queryRunner.query(`ALTER TABLE "StatusList" DROP COLUMN "ttl"`)
    await queryRunner.query(`ALTER TABLE "StatusList" DROP COLUMN "bitsPerStatus"`)
  }
}
