import { MigrationInterface, QueryRunner } from 'typeorm'

export class UpdateStatusList1737110469001 implements MigrationInterface {
  name = 'UpdateStatusList1737110469001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new enum value
    await queryRunner.query(`ALTER TYPE "StatusList_type_enum" ADD VALUE 'OAuthStatusList'`)

    // Make columns nullable and add new columns
    await queryRunner.query(`ALTER TABLE "StatusList" ALTER COLUMN "indexingDirection" DROP NOT NULL`)
    await queryRunner.query(`ALTER TABLE "StatusList" ALTER COLUMN "statusPurpose" DROP NOT NULL`)
    await queryRunner.query(`ALTER TABLE "StatusList" ADD "bitsPerStatus" integer DEFAULT 1`)
    await queryRunner.query(`ALTER TABLE "StatusList" ADD "expiresAt" timestamp with time zone`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "StatusList" DROP COLUMN "expiresAt"`)
    await queryRunner.query(`ALTER TABLE "StatusList" DROP COLUMN "bitsPerStatus"`)
    await queryRunner.query(`ALTER TABLE "StatusList" ALTER COLUMN "statusPurpose" SET NOT NULL`)
    await queryRunner.query(`ALTER TABLE "StatusList" ALTER COLUMN "indexingDirection" SET NOT NULL`)

    // Note: Cannot remove enum value in Postgres, would need to recreate the type
  }
}
