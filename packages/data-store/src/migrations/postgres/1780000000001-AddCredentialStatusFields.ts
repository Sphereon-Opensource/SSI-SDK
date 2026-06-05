import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Adds 'SUSPENDED' to the digital_credential_state_type enum and a "status_last_checked_at"
 * column on DigitalCredential. Uses the transaction-safe recreate-type approach.
 */
export class AddCredentialStatusFields1780000000001 implements MigrationInterface {
  name = 'AddCredentialStatusFields1780000000001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "DigitalCredential" ADD COLUMN "status_last_checked_at" TIMESTAMP`)
    await queryRunner.query(`CREATE TYPE "digital_credential_state_type_v2" AS ENUM('REVOKED', 'VERIFIED', 'EXPIRED', 'SUSPENDED')`)
    await queryRunner.query(
      `ALTER TABLE "DigitalCredential" ALTER COLUMN "verified_state" TYPE "digital_credential_state_type_v2" USING "verified_state"::text::"digital_credential_state_type_v2"`,
    )
    await queryRunner.query(`DROP TYPE "digital_credential_state_type"`)
    await queryRunner.query(`ALTER TYPE "digital_credential_state_type_v2" RENAME TO "digital_credential_state_type"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "DigitalCredential" SET "verified_state" = NULL WHERE "verified_state" = 'SUSPENDED'`)
    await queryRunner.query(`CREATE TYPE "digital_credential_state_type_old" AS ENUM('REVOKED', 'VERIFIED', 'EXPIRED')`)
    await queryRunner.query(
      `ALTER TABLE "DigitalCredential" ALTER COLUMN "verified_state" TYPE "digital_credential_state_type_old" USING "verified_state"::text::"digital_credential_state_type_old"`,
    )
    await queryRunner.query(`DROP TYPE "digital_credential_state_type"`)
    await queryRunner.query(`ALTER TYPE "digital_credential_state_type_old" RENAME TO "digital_credential_state_type"`)
    await queryRunner.query(`ALTER TABLE "DigitalCredential" DROP COLUMN "status_last_checked_at"`)
  }
}
