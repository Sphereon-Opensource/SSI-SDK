import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Adds 'UNTRUSTED' to the digital_credential_state_type enum (a status list that could not be
 * cryptographically trusted). Uses the transaction-safe recreate-type approach.
 */
export class AddUntrustedCredentialState1780000000011 implements MigrationInterface {
  name = 'AddUntrustedCredentialState1780000000011'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "digital_credential_state_type_v3" AS ENUM('REVOKED', 'VERIFIED', 'EXPIRED', 'SUSPENDED', 'UNTRUSTED')`)
    await queryRunner.query(
      `ALTER TABLE "DigitalCredential" ALTER COLUMN "verified_state" TYPE "digital_credential_state_type_v3" USING "verified_state"::text::"digital_credential_state_type_v3"`,
    )
    await queryRunner.query(`DROP TYPE "digital_credential_state_type"`)
    await queryRunner.query(`ALTER TYPE "digital_credential_state_type_v3" RENAME TO "digital_credential_state_type"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "DigitalCredential" SET "verified_state" = NULL WHERE "verified_state" = 'UNTRUSTED'`)
    await queryRunner.query(`CREATE TYPE "digital_credential_state_type_old" AS ENUM('REVOKED', 'VERIFIED', 'EXPIRED', 'SUSPENDED')`)
    await queryRunner.query(
      `ALTER TABLE "DigitalCredential" ALTER COLUMN "verified_state" TYPE "digital_credential_state_type_old" USING "verified_state"::text::"digital_credential_state_type_old"`,
    )
    await queryRunner.query(`DROP TYPE "digital_credential_state_type"`)
    await queryRunner.query(`ALTER TYPE "digital_credential_state_type_old" RENAME TO "digital_credential_state_type"`)
  }
}
