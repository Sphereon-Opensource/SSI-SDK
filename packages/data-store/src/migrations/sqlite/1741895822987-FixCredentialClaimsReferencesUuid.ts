import { MigrationInterface, QueryRunner } from 'typeorm'

export class FixCredentialClaimsReferencesUuid1741895822987 implements MigrationInterface {
  name = 'FixCredentialClaimsReferencesUuid1741895822987'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`BEGIN TRANSACTION;`)

    // Create a new table with the updated column type (uuid)
    await queryRunner.query(`
            CREATE TABLE "CredentialClaims_new"
            (
                "id"                         uuid                   NOT NULL DEFAULT (lower(hex(randomblob(16)))),
                "key"                        character varying(255) NOT NULL,
                "name"                       character varying(255) NOT NULL,
                "credentialLocaleBrandingId" uuid,
                CONSTRAINT "PK_CredentialClaims_id" PRIMARY KEY ("id")
            )
        `)

    // Copy data from the old table
    await queryRunner.query(`
            INSERT INTO "CredentialClaims_new" ("id", "key", "name", "credentialLocaleBrandingId")
            SELECT "id", "key", "name", "credentialLocaleBrandingId"
            FROM "CredentialClaims"
        `)

    // Drop the old table
    await queryRunner.query(`DROP TABLE "CredentialClaims"`)

    // Rename the new table to the original name
    await queryRunner.query(`ALTER TABLE "CredentialClaims_new" RENAME TO "CredentialClaims"`)

    // Recreate the unique index
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_CredentialClaimsEntity_credentialLocaleBranding_locale"
                ON "CredentialClaims" ("credentialLocaleBrandingId", "key")
        `)

    await queryRunner.query(`COMMIT;`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Migrate uuid back to varchar
    await queryRunner.query(`BEGIN TRANSACTION;`)

    // Create a new table reverting the column back to character varying
    await queryRunner.query(`
            CREATE TABLE "CredentialClaims_old"
            (
                "id"                         uuid                   NOT NULL DEFAULT (lower(hex(randomblob(16)))),
                "key"                        character varying(255) NOT NULL,
                "name"                       character varying(255) NOT NULL,
                "credentialLocaleBrandingId" character varying,
                CONSTRAINT "PK_CredentialClaims_id" PRIMARY KEY ("id")
            )
        `)

    // Copy data from the current table
    await queryRunner.query(`
            INSERT INTO "CredentialClaims_old" ("id", "key", "name", "credentialLocaleBrandingId")
            SELECT "id", "key", "name", "credentialLocaleBrandingId"
            FROM "CredentialClaims"
        `)

    // Drop the current table
    await queryRunner.query(`DROP TABLE "CredentialClaims"`)

    // Rename the new table back to the original name
    await queryRunner.query(`ALTER TABLE "CredentialClaims_old" RENAME TO "CredentialClaims"`)

    // Recreate the unique index
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_CredentialClaimsEntity_credentialLocaleBranding_locale"
                ON "CredentialClaims" ("credentialLocaleBrandingId", "key")
        `)

    await queryRunner.query(`COMMIT;`)
  }
}
