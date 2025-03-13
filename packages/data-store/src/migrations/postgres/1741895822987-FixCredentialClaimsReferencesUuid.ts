import { MigrationInterface, QueryRunner } from 'typeorm'

export class FixCredentialClaimsReferencesUuidPG1741895822987 implements MigrationInterface {
  name = 'FixCredentialClaimsReferencesUuid1741895822987'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Migrate varchar to uuid
    await queryRunner.query(`
      ALTER TABLE "CredentialClaims"
      ALTER COLUMN "credentialLocaleBrandingId" TYPE uuid USING "credentialLocaleBrandingId"::uuid;
    `)

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Migrate uuid back to varchar
    await queryRunner.query(`
      ALTER TABLE "CredentialClaims"
      ALTER COLUMN "credentialLocaleBrandingId" TYPE character varying USING "credentialLocaleBrandingId"::text;
    `)

  }
}
