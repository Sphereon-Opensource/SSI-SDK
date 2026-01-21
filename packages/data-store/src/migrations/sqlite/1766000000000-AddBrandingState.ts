import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddBrandingStateSqlite1766000000000 implements MigrationInterface {
  name = 'AddBrandingState1766000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add state column with empty string default for existing records
    // Note: Existing records will have state='', which won't match computed hashes.
    // This makes the knownStates optimization ineffective until records are naturally updated.
    await queryRunner.query(`ALTER TABLE "CredentialBranding" ADD COLUMN "state" varchar(255) NOT NULL DEFAULT ''`)
    await queryRunner.query(`ALTER TABLE "BaseLocaleBranding" ADD COLUMN "state" varchar(255) NOT NULL DEFAULT ''`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Disable foreign key constraints during migration to avoid issues with DROP TABLE operations
    await queryRunner.query(`PRAGMA foreign_keys = OFF`)

    // Recreate CredentialBranding without the state column
    await queryRunner.query(`
            CREATE TABLE "CredentialBranding_old"
            (
                "id"                  varchar PRIMARY KEY NOT NULL,
                "vcHash"              varchar(255)        NOT NULL,
                "issuerCorrelationId" varchar(255)        NOT NULL,
                "created_at"          datetime            NOT NULL DEFAULT (datetime('now')),
                "last_updated_at"     datetime            NOT NULL DEFAULT (datetime('now'))
            )
        `)
    await queryRunner.query(`
            INSERT INTO "CredentialBranding_old" ("id", "vcHash", "issuerCorrelationId", "created_at", "last_updated_at")
            SELECT "id", "vcHash", "issuerCorrelationId", "created_at", "last_updated_at"
            FROM "CredentialBranding"
        `)
    await queryRunner.query(`DROP TABLE "CredentialBranding"`)
    await queryRunner.query(`ALTER TABLE "CredentialBranding_old" RENAME TO "CredentialBranding"`)
    await queryRunner.query(`CREATE INDEX "IDX_CredentialBrandingEntity_issuerCorrelationId" ON "CredentialBranding" ("issuerCorrelationId")`)
    await queryRunner.query(`CREATE INDEX "IDX_CredentialBrandingEntity_vcHash" ON "CredentialBranding" ("vcHash")`)

    // Recreate BaseLocaleBranding without the state column
    await queryRunner.query(`
            CREATE TABLE "BaseLocaleBranding_old"
            (
                "id"                  varchar PRIMARY KEY NOT NULL,
                "alias"               varchar(255),
                "locale"              varchar(255)        NOT NULL,
                "description"         varchar(255),
                "created_at"          datetime            NOT NULL DEFAULT (datetime('now')),
                "last_updated_at"     datetime            NOT NULL DEFAULT (datetime('now')),
                "credentialBrandingId" varchar,
                "issuerBrandingId"    varchar,
                "type"                varchar             NOT NULL,
                "logoId"              varchar,
                "backgroundId"        varchar,
                "textId"              varchar,
                "client_uri"          varchar,
                "tos_uri"             varchar,
                "policy_uri"          varchar,
                "contacts"            varchar,
                CONSTRAINT "UQ_logoId" UNIQUE ("logoId"),
                CONSTRAINT "UQ_backgroundId" UNIQUE ("backgroundId"),
                CONSTRAINT "UQ_textId" UNIQUE ("textId"),
                CONSTRAINT "FK_BaseLocaleBranding_logoId" FOREIGN KEY ("logoId") REFERENCES "ImageAttributes" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_BaseLocaleBranding_backgroundId" FOREIGN KEY ("backgroundId") REFERENCES "BackgroundAttributes" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_BaseLocaleBranding_textId" FOREIGN KEY ("textId") REFERENCES "TextAttributes" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_BaseLocaleBranding_credentialBrandingId" FOREIGN KEY ("credentialBrandingId") REFERENCES "CredentialBranding" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_BaseLocaleBranding_issuerBrandingId" FOREIGN KEY ("issuerBrandingId") REFERENCES "IssuerBranding" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
    await queryRunner.query(`
            INSERT INTO "BaseLocaleBranding_old" ("id", "alias", "locale", "description", "created_at", "last_updated_at", "credentialBrandingId", "issuerBrandingId", "type", "logoId", "backgroundId", "textId", "client_uri", "tos_uri", "policy_uri", "contacts")
            SELECT "id", "alias", "locale", "description", "created_at", "last_updated_at", "credentialBrandingId", "issuerBrandingId", "type", "logoId", "backgroundId", "textId", "client_uri", "tos_uri", "policy_uri", "contacts"
            FROM "BaseLocaleBranding"
        `)
    await queryRunner.query(`DROP TABLE "BaseLocaleBranding"`)
    await queryRunner.query(`ALTER TABLE "BaseLocaleBranding_old" RENAME TO "BaseLocaleBranding"`)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_CredentialLocaleBrandingEntity_credentialBranding_locale" ON "BaseLocaleBranding" ("credentialBrandingId", "locale")`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_IssuerLocaleBrandingEntity_issuerBranding_locale" ON "BaseLocaleBranding" ("issuerBrandingId", "locale")`,
    )
    await queryRunner.query(`CREATE INDEX "IDX_BaseLocaleBranding_type" ON "BaseLocaleBranding" ("type")`)

    // Re-enable foreign key constraints
    await queryRunner.query(`PRAGMA foreign_keys = ON`)
  }
}
