import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCredentialClaimOrderSqlite1768000000000 implements MigrationInterface {
  name = 'AddCredentialClaimOrder1768000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "CredentialClaims" ADD COLUMN "order" integer`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // SQLite doesn't support DROP COLUMN directly; recreate table without order
    await queryRunner.query(`PRAGMA foreign_keys = OFF`)
    await queryRunner.query(`
      CREATE TABLE "CredentialClaims_old" (
        "id" varchar PRIMARY KEY NOT NULL,
        "key" varchar(255) NOT NULL,
        "name" varchar(255) NOT NULL,
        "credentialLocaleBrandingId" varchar,
        CONSTRAINT "FK_CredentialClaims_credentialLocaleBrandingId" FOREIGN KEY ("credentialLocaleBrandingId") REFERENCES "BaseLocaleBranding" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query(`
      INSERT INTO "CredentialClaims_old" ("id", "key", "name", "credentialLocaleBrandingId")
      SELECT "id", "key", "name", "credentialLocaleBrandingId"
      FROM "CredentialClaims"
    `)
    await queryRunner.query(`DROP TABLE "CredentialClaims"`)
    await queryRunner.query(`ALTER TABLE "CredentialClaims_old" RENAME TO "CredentialClaims"`)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_CredentialClaimsEntity_credentialLocaleBranding_locale" ON "CredentialClaims" ("credentialLocaleBrandingId", "key")`,
    )
    await queryRunner.query(`PRAGMA foreign_keys = ON`)
  }
}
