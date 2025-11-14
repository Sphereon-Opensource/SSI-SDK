import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddBitstringStatusListEnumPG1741895823000 implements MigrationInterface {
  name = 'AddBitstringStatusListEnum1741895823000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.startTransaction()
    await queryRunner.query(`ALTER TYPE "StatusList_type_enum" ADD VALUE 'BitstringStatusList'`)
    await queryRunner.commitTransaction()
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: Cannot remove enum value in Postgres without recreating the type
  }
}

export class CreateBitstringStatusListPG1741895823000 implements MigrationInterface {
  name = 'CreateBitstringStatusList1741895823000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add BitstringStatusList columns to StatusList table
    await queryRunner.query(`ALTER TABLE "StatusList" ADD COLUMN "ttl" integer`)
    await queryRunner.query(`ALTER TABLE "StatusList" ADD COLUMN "validFrom" TIMESTAMP`)
    await queryRunner.query(`ALTER TABLE "StatusList" ADD COLUMN "validUntil" TIMESTAMP`)

    // Update type enum constraint to include BitstringStatusList
    await queryRunner.query(`ALTER TABLE "StatusList" DROP CONSTRAINT IF EXISTS "CHK_StatusList_type"`)
    await queryRunner.query(
      `ALTER TABLE "StatusList" ADD CONSTRAINT "CHK_StatusList_type" CHECK ("type" IN ('StatusList2021', 'OAuthStatusList', 'BitstringStatusList'))`,
    )

    // Add inheritance discriminator column to StatusListEntry table
    await queryRunner.query(`ALTER TABLE "StatusListEntry" ADD COLUMN "type" character varying NOT NULL DEFAULT 'StatusListEntryEntity'`)

    // Add BitstringStatusListEntry specific columns to StatusListEntry table
    await queryRunner.query(`ALTER TABLE "StatusListEntry" ADD COLUMN "statusPurpose" character varying`)
    await queryRunner.query(`ALTER TABLE "StatusListEntry" ADD COLUMN "bitsPerStatus" integer DEFAULT 1`)
    await queryRunner.query(`ALTER TABLE "StatusListEntry" ADD COLUMN "statusMessage" text`)
    await queryRunner.query(`ALTER TABLE "StatusListEntry" ADD COLUMN "statusReference" text`)

    // Add constraint for entry type
    await queryRunner.query(
      `ALTER TABLE "StatusListEntry" ADD CONSTRAINT "CHK_StatusListEntry_type" CHECK ("type" IN ('StatusListEntryEntity', 'bitstring'))`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove entry type constraint and columns
    await queryRunner.query(`ALTER TABLE "StatusListEntry" DROP CONSTRAINT "CHK_StatusListEntry_type"`)
    await queryRunner.query(`ALTER TABLE "StatusListEntry" DROP COLUMN "statusReference"`)
    await queryRunner.query(`ALTER TABLE "StatusListEntry" DROP COLUMN "statusMessage"`)
    await queryRunner.query(`ALTER TABLE "StatusListEntry" DROP COLUMN "bitsPerStatus"`)
    await queryRunner.query(`ALTER TABLE "StatusListEntry" DROP COLUMN "statusPurpose"`)
    await queryRunner.query(`ALTER TABLE "StatusListEntry" DROP COLUMN "type"`)

    // Revert StatusList type constraint
    await queryRunner.query(`ALTER TABLE "StatusList" DROP CONSTRAINT "CHK_StatusList_type"`)
    await queryRunner.query(`ALTER TABLE "StatusList" ADD CONSTRAINT "CHK_StatusList_type" CHECK ("type" IN ('StatusList2021', 'OAuthStatusList'))`)

    // Remove BitstringStatusList columns from StatusList table
    await queryRunner.query(`ALTER TABLE "StatusList" DROP COLUMN "validUntil"`)
    await queryRunner.query(`ALTER TABLE "StatusList" DROP COLUMN "validFrom"`)
    await queryRunner.query(`ALTER TABLE "StatusList" DROP COLUMN "ttl"`)
    await queryRunner.query(`ALTER TABLE "StatusList" DROP COLUMN "bitsPerStatus"`)
  }
}
