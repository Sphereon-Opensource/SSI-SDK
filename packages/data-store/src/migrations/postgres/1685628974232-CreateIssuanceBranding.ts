import { MigrationInterface, QueryRunner } from 'typeorm'
import { enablePostgresUuidExtension } from '@sphereon/ssi-sdk.core'

export class CreateIssuanceBranding1685628974232 implements MigrationInterface {
  name = 'CreateIssuanceBranding1685628974232'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await enablePostgresUuidExtension(queryRunner)
    await queryRunner.query(
      `CREATE TABLE "ImageDimensions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "width" integer NOT NULL, "height" integer NOT NULL, CONSTRAINT "PK_ImageDimensions_id" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "ImageAttributes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uri" character varying, "dataUri" character varying, "mediaType" character varying(255), "alt" character varying(255), "dimensionsId" uuid, CONSTRAINT "UQ_dimensionsId" UNIQUE ("dimensionsId"), CONSTRAINT "PK_ImageAttributes_id" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "BackgroundAttributes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "color" character varying(255), "imageId" uuid, CONSTRAINT "UQ_imageId" UNIQUE ("imageId"), CONSTRAINT "PK_BackgroundAttributes_id" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "TextAttributes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "color" character varying(255), CONSTRAINT "PK_TextAttributes_id" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "BaseLocaleBranding" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "alias" character varying(255), "locale" character varying(255) NOT NULL, "description" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "last_updated_at" TIMESTAMP NOT NULL DEFAULT now(), "credentialBrandingId" uuid, "issuerBrandingId" uuid, "type" character varying NOT NULL, "logoId" uuid, "backgroundId" uuid, "textId" uuid, CONSTRAINT "UQ_logoId" UNIQUE ("logoId"), CONSTRAINT "UQ_backgroundId" UNIQUE ("backgroundId"), CONSTRAINT "UQ_textId" UNIQUE ("textId"), CONSTRAINT "PK_BaseLocaleBranding_id" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_CredentialLocaleBrandingEntity_credentialBranding_locale" ON "BaseLocaleBranding" ("credentialBrandingId", "locale")`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_IssuerLocaleBrandingEntity_issuerBranding_locale" ON "BaseLocaleBranding" ("issuerBrandingId", "locale")`,
    )
    await queryRunner.query(`CREATE INDEX "IDX_BaseLocaleBranding_type" ON "BaseLocaleBranding" ("type")`)
    await queryRunner.query(
      `CREATE TABLE "CredentialBranding" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "vcHash" character varying(255) NOT NULL, "issuerCorrelationId" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "last_updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_vcHash" UNIQUE ("vcHash"), CONSTRAINT "PK_CredentialBranding_id" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(`CREATE INDEX "IDX_CredentialBrandingEntity_issuerCorrelationId" ON "CredentialBranding" ("issuerCorrelationId")`)
    await queryRunner.query(`CREATE INDEX "IDX_CredentialBrandingEntity_vcHash" ON "CredentialBranding" ("vcHash")`)
    await queryRunner.query(
      `CREATE TABLE "IssuerBranding" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "issuerCorrelationId" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "last_updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_issuerCorrelationId" UNIQUE ("issuerCorrelationId"), CONSTRAINT "PK_IssuerBranding_id" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(`CREATE INDEX "IDX_IssuerBrandingEntity_issuerCorrelationId" ON "IssuerBranding" ("issuerCorrelationId")`)
    await queryRunner.query(
      `ALTER TABLE "ImageAttributes" ADD CONSTRAINT "FK_ImageAttributes_dimensionsId" FOREIGN KEY ("dimensionsId") REFERENCES "ImageDimensions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "BackgroundAttributes" ADD CONSTRAINT "FK_BackgroundAttributes_imageId" FOREIGN KEY ("imageId") REFERENCES "ImageAttributes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "BaseLocaleBranding" ADD CONSTRAINT "FK_BaseLocaleBranding_logoId" FOREIGN KEY ("logoId") REFERENCES "ImageAttributes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "BaseLocaleBranding" ADD CONSTRAINT "FK_BaseLocaleBranding_backgroundId" FOREIGN KEY ("backgroundId") REFERENCES "BackgroundAttributes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "BaseLocaleBranding" ADD CONSTRAINT "FK_BaseLocaleBranding_textId" FOREIGN KEY ("textId") REFERENCES "TextAttributes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "BaseLocaleBranding" ADD CONSTRAINT "FK_BaseLocaleBranding_credentialBrandingId" FOREIGN KEY ("credentialBrandingId") REFERENCES "CredentialBranding"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "BaseLocaleBranding" ADD CONSTRAINT "FK_BaseLocaleBranding_issuerBrandingId" FOREIGN KEY ("issuerBrandingId") REFERENCES "IssuerBranding"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "BaseLocaleBranding" DROP CONSTRAINT "FK_BaseLocaleBranding_issuerBrandingId"`)
    await queryRunner.query(`ALTER TABLE "BaseLocaleBranding" DROP CONSTRAINT "FK_BaseLocaleBranding_credentialBrandingId"`)
    await queryRunner.query(`ALTER TABLE "BaseLocaleBranding" DROP CONSTRAINT "FK_BaseLocaleBranding_textId"`)
    await queryRunner.query(`ALTER TABLE "BaseLocaleBranding" DROP CONSTRAINT "FK_BaseLocaleBranding_backgroundId"`)
    await queryRunner.query(`ALTER TABLE "BaseLocaleBranding" DROP CONSTRAINT "FK_BaseLocaleBranding_logoId"`)
    await queryRunner.query(`ALTER TABLE "BaseLocaleBranding" DROP CONSTRAINT "FK_BackgroundAttributes_imageId"`)
    await queryRunner.query(`ALTER TABLE "BaseLocaleBranding" DROP CONSTRAINT "FK_ImageAttributes_dimensionsId"`)
    await queryRunner.query(`ALTER TABLE "IssuerBranding" DROP INDEX "IDX_IssuerBrandingEntity_issuerCorrelationId"`)
    await queryRunner.query(`DROP TABLE "IssuerBranding"`)
    await queryRunner.query(`ALTER TABLE "CredentialBranding" DROP INDEX "IDX_CredentialBrandingEntity_vcHash"`)
    await queryRunner.query(`ALTER TABLE "CredentialBranding" DROP INDEX "IDX_CredentialBrandingEntity_issuerCorrelationId"`)
    await queryRunner.query(`DROP TABLE "CredentialBranding"`)
    await queryRunner.query(`ALTER TABLE "BaseLocaleBranding" DROP INDEX "IDX_BaseLocaleBranding_type"`)
    await queryRunner.query(`ALTER TABLE "BaseLocaleBranding" DROP INDEX "IDX_IssuerLocaleBrandingEntity_issuerBranding_locale"`)
    await queryRunner.query(`ALTER TABLE "BaseLocaleBranding" DROP INDEX "IDX_CredentialLocaleBrandingEntity_credentialBranding_locale"`)
    await queryRunner.query(`DROP TABLE "BaseLocaleBranding"`)
    await queryRunner.query(`DROP TABLE "TextAttributes"`)
    await queryRunner.query(`DROP TABLE "BackgroundAttributes"`)
    await queryRunner.query(`DROP TABLE "ImageAttributes"`)
    await queryRunner.query(`DROP TABLE "ImageDimensions"`)
  }
}
