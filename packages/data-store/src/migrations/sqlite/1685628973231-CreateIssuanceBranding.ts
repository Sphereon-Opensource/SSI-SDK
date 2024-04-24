import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateIssuanceBranding1685628973231 implements MigrationInterface {
  name = 'CreateIssuanceBranding1685628973231'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "ImageDimensions" ("id" varchar PRIMARY KEY NOT NULL, "width" integer NOT NULL, "height" integer NOT NULL)`)
    await queryRunner.query(
      `CREATE TABLE "ImageAttributes" ("id" varchar PRIMARY KEY NOT NULL, "uri" varchar, "dataUri" varchar, "mediaType" varchar(255), "alt" varchar(255), "dimensionsId" varchar, CONSTRAINT "UQ_dimensionsId" UNIQUE ("dimensionsId"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "BackgroundAttributes" ("id" varchar PRIMARY KEY NOT NULL, "color" varchar(255), "imageId" varchar, CONSTRAINT "UQ_imageId" UNIQUE ("imageId"))`,
    )
    await queryRunner.query(`CREATE TABLE "TextAttributes" ("id" varchar PRIMARY KEY NOT NULL, "color" varchar(255))`)
    await queryRunner.query(
      `CREATE TABLE "BaseLocaleBranding" ("id" varchar PRIMARY KEY NOT NULL, "alias" varchar(255), "locale" varchar(255) NOT NULL, "description" varchar(255), "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "credentialBrandingId" varchar, "issuerBrandingId" varchar, "type" varchar NOT NULL, "logoId" varchar, "backgroundId" varchar, "textId" varchar, CONSTRAINT "UQ_logoId" UNIQUE ("logoId"), CONSTRAINT "UQ_backgroundId" UNIQUE ("backgroundId"), CONSTRAINT "UQ_textId" UNIQUE ("textId"))`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_CredentialLocaleBrandingEntity_credentialBranding_locale" ON "BaseLocaleBranding" ("credentialBrandingId", "locale")`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_IssuerLocaleBrandingEntity_issuerBranding_locale" ON "BaseLocaleBranding" ("issuerBrandingId", "locale")`,
    )
    await queryRunner.query(`CREATE INDEX "IDX_BaseLocaleBranding_type" ON "BaseLocaleBranding" ("type")`)
    await queryRunner.query(
      `CREATE TABLE "CredentialBranding" ("id" varchar PRIMARY KEY NOT NULL, "vcHash" varchar(255) NOT NULL, "issuerCorrelationId" varchar(255) NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_vcHash" UNIQUE ("vcHash"))`,
    )
    await queryRunner.query(`CREATE INDEX "IDX_CredentialBrandingEntity_issuerCorrelationId" ON "CredentialBranding" ("issuerCorrelationId")`)
    await queryRunner.query(`CREATE INDEX "IDX_CredentialBrandingEntity_vcHash" ON "CredentialBranding" ("vcHash")`)
    await queryRunner.query(
      `CREATE TABLE "IssuerBranding" ("id" varchar PRIMARY KEY NOT NULL, "issuerCorrelationId" varchar(255) NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_issuerCorrelationId" UNIQUE ("issuerCorrelationId"))`,
    )
    await queryRunner.query(`CREATE INDEX "IDX_IssuerBrandingEntity_issuerCorrelationId" ON "IssuerBranding" ("issuerCorrelationId")`)
    await queryRunner.query(
      `CREATE TABLE "temporary_ImageAttributes" ("id" varchar PRIMARY KEY NOT NULL, "uri" varchar, "dataUri" varchar, "mediaType" varchar(255), "alt" varchar(255), "dimensionsId" varchar, CONSTRAINT "UQ_dimensionsId" UNIQUE ("dimensionsId"), CONSTRAINT "FK_ImageAttributes_dimensionsId" FOREIGN KEY ("dimensionsId") REFERENCES "ImageDimensions" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    )
    await queryRunner.query(
      `INSERT INTO "temporary_ImageAttributes"("id", "uri", "dataUri", "mediaType", "alt", "dimensionsId") SELECT "id", "uri", "dataUri", "mediaType", "alt", "dimensionsId" FROM "ImageAttributes"`,
    )
    await queryRunner.query(`DROP TABLE "ImageAttributes"`)
    await queryRunner.query(`ALTER TABLE "temporary_ImageAttributes" RENAME TO "ImageAttributes"`)
    await queryRunner.query(
      `CREATE TABLE "temporary_BackgroundAttributes" ("id" varchar PRIMARY KEY NOT NULL, "color" varchar(255), "imageId" varchar, CONSTRAINT "UQ_imageId" UNIQUE ("imageId"), CONSTRAINT "FK_BackgroundAttributes_imageId" FOREIGN KEY ("imageId") REFERENCES "ImageAttributes" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    )
    await queryRunner.query(
      `INSERT INTO "temporary_BackgroundAttributes"("id", "color", "imageId") SELECT "id", "color", "imageId" FROM "BackgroundAttributes"`,
    )
    await queryRunner.query(`DROP TABLE "BackgroundAttributes"`)
    await queryRunner.query(`ALTER TABLE "temporary_BackgroundAttributes" RENAME TO "BackgroundAttributes"`)
    await queryRunner.query(`DROP INDEX "IDX_CredentialLocaleBrandingEntity_credentialBranding_locale"`)
    await queryRunner.query(`DROP INDEX "IDX_IssuerLocaleBrandingEntity_issuerBranding_locale"`)
    await queryRunner.query(`DROP INDEX "IDX_BaseLocaleBranding_type"`)
    await queryRunner.query(
      `CREATE TABLE "temporary_BaseLocaleBranding" ("id" varchar PRIMARY KEY NOT NULL, "alias" varchar(255), "locale" varchar(255) NOT NULL, "description" varchar(255), "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "credentialBrandingId" varchar, "issuerBrandingId" varchar, "type" varchar NOT NULL, "logoId" varchar, "backgroundId" varchar, "textId" varchar, CONSTRAINT "UQ_logoId" UNIQUE ("logoId"), CONSTRAINT "UQ_backgroundId" UNIQUE ("backgroundId"), CONSTRAINT "UQ_textId" UNIQUE ("textId"), CONSTRAINT "FK_BaseLocaleBranding_logoId" FOREIGN KEY ("logoId") REFERENCES "ImageAttributes" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_BaseLocaleBranding_backgroundId" FOREIGN KEY ("backgroundId") REFERENCES "BackgroundAttributes" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_BaseLocaleBranding_textId" FOREIGN KEY ("textId") REFERENCES "TextAttributes" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_BaseLocaleBranding_credentialBrandingId" FOREIGN KEY ("credentialBrandingId") REFERENCES "CredentialBranding" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_BaseLocaleBranding_issuerBrandingId" FOREIGN KEY ("issuerBrandingId") REFERENCES "IssuerBranding" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    )
    await queryRunner.query(
      `INSERT INTO "temporary_BaseLocaleBranding"("id", "alias", "locale", "description", "created_at", "last_updated_at", "credentialBrandingId", "issuerBrandingId", "type", "logoId", "backgroundId", "textId") SELECT "id", "alias", "locale", "description", "created_at", "last_updated_at", "credentialBrandingId", "issuerBrandingId", "type", "logoId", "backgroundId", "textId" FROM "BaseLocaleBranding"`,
    )
    await queryRunner.query(`DROP TABLE "BaseLocaleBranding"`)
    await queryRunner.query(`ALTER TABLE "temporary_BaseLocaleBranding" RENAME TO "BaseLocaleBranding"`)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_CredentialLocaleBrandingEntity_credentialBranding_locale" ON "BaseLocaleBranding" ("credentialBrandingId", "locale")`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_IssuerLocaleBrandingEntity_issuerBranding_locale" ON "BaseLocaleBranding" ("issuerBrandingId", "locale")`,
    )
    await queryRunner.query(`CREATE INDEX "IDX_BaseLocaleBranding_type" ON "BaseLocaleBranding" ("type")`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_BaseLocaleBranding_type"`)
    await queryRunner.query(`DROP INDEX "IDX_IssuerLocaleBrandingEntity_issuerBranding_locale"`)
    await queryRunner.query(`DROP INDEX "IDX_CredentialLocaleBrandingEntity_credentialBranding_locale"`)
    await queryRunner.query(`ALTER TABLE "BaseLocaleBranding" RENAME TO "temporary_BaseLocaleBranding"`)
    await queryRunner.query(
      `CREATE TABLE "BaseLocaleBranding" ("id" varchar PRIMARY KEY NOT NULL, "alias" varchar(255), "locale" varchar(255) NOT NULL, "description" varchar(255), "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "credentialBrandingId" varchar, "issuerBrandingId" varchar, "type" varchar NOT NULL, "logoId" varchar, "backgroundId" varchar, "textId" varchar, CONSTRAINT "UQ_logoId" UNIQUE ("logoId"), CONSTRAINT "UQ_backgroundId" UNIQUE ("backgroundId"), CONSTRAINT "UQ_textId" UNIQUE ("textId"))`,
    )
    await queryRunner.query(
      `INSERT INTO "BaseLocaleBranding"("id", "alias", "locale", "description", "created_at", "last_updated_at", "credentialBrandingId", "issuerBrandingId", "type", "logoId", "backgroundId", "textId") SELECT "id", "alias", "locale", "description", "created_at", "last_updated_at", "credentialBrandingId", "issuerBrandingId", "type", "logoId", "backgroundId", "textId" FROM "BaseLocaleBranding"`,
    )
    await queryRunner.query(`DROP TABLE "temporary_BaseLocaleBranding"`)
    await queryRunner.query(`CREATE INDEX "IDX_BaseLocaleBranding_type" ON "BaseLocaleBranding" ("type")`)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_IssuerLocaleBrandingEntity_issuerBranding_locale" ON "BaseLocaleBranding" ("issuerBrandingId", "locale")`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_CredentialLocaleBrandingEntity_credentialBranding_locale" ON "BaseLocaleBranding" ("credentialBrandingId", "locale")`,
    )
    await queryRunner.query(`ALTER TABLE "BackgroundAttributes" RENAME TO "temporary_BackgroundAttributes"`)
    await queryRunner.query(
      `CREATE TABLE "BackgroundAttributes" ("id" varchar PRIMARY KEY NOT NULL, "color" varchar(255), "imageId" varchar, CONSTRAINT "UQ_imageId" UNIQUE ("imageId"))`,
    )
    await queryRunner.query(
      `INSERT INTO "BackgroundAttributes"("id", "color", "imageId") SELECT "id", "color", "imageId" FROM "BackgroundAttributes"`,
    )
    await queryRunner.query(`DROP TABLE "temporary_BackgroundAttributes"`)
    await queryRunner.query(`ALTER TABLE "ImageAttributes" RENAME TO "temporary_ImageAttributes"`)
    await queryRunner.query(
      `CREATE TABLE "ImageAttributes" ("id" varchar PRIMARY KEY NOT NULL, "uri" varchar, "dataUri" varchar, "mediaType" varchar(255), "alt" varchar(255), "dimensionsId" varchar, CONSTRAINT "UQ_dimensionsId" UNIQUE ("dimensionsId"))`,
    )
    await queryRunner.query(
      `INSERT INTO "ImageAttributes"("id", "uri", "dataUri", "mediaType", "alt", "dimensionsId") SELECT "id", "uri", "dataUri", "mediaType", "alt", "dimensionsId" FROM "ImageAttributes"`,
    )
    await queryRunner.query(`DROP TABLE "temporary_ImageAttributes"`)
    await queryRunner.query(`DROP INDEX "IDX_IssuerBrandingEntity_issuerCorrelationId"`)
    await queryRunner.query(`DROP TABLE "IssuerBranding"`)
    await queryRunner.query(`DROP INDEX "IDX_CredentialBrandingEntity_vcHash"`)
    await queryRunner.query(`DROP INDEX "IDX_CredentialBrandingEntity_issuerCorrelationId"`)
    await queryRunner.query(`DROP TABLE "CredentialBranding"`)
    await queryRunner.query(`DROP INDEX "IDX_BaseLocaleBranding_type"`)
    await queryRunner.query(`DROP INDEX "IDX_IssuerLocaleBrandingEntity_issuerBranding_locale"`)
    await queryRunner.query(`DROP INDEX "IDX_CredentialLocaleBrandingEntity_credentialBranding_locale"`)
    await queryRunner.query(`DROP TABLE "BaseLocaleBranding"`)
    await queryRunner.query(`DROP TABLE "TextAttributes"`)
    await queryRunner.query(`DROP TABLE "BackgroundAttributes"`)
    await queryRunner.query(`DROP TABLE "ImageAttributes"`)
    await queryRunner.query(`DROP TABLE "ImageDimensions"`)
  }
}
