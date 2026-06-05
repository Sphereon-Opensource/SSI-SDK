import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Widens the DigitalCredential "verified_state" CHECK constraint to include 'SUSPENDED'
 * and adds a "status_last_checked_at" column. SQLite cannot ALTER a CHECK constraint in
 * place, so the table is rebuilt. This migration must run AFTER AddLinkedVpFields
 * (1763387280000), so the rebuilt schema includes the linked_vp_* columns.
 */
export class AddCredentialStatusFields1780000000002 implements MigrationInterface {
  name = 'AddCredentialStatusFields1780000000002'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "DigitalCredential_new" (
        "id" varchar PRIMARY KEY NOT NULL,
        "parent_id" text,
        "document_type" varchar CHECK( "document_type" IN ('VC', 'VP', 'C', 'P') ) NOT NULL,
        "regulation_type" varchar CHECK( "regulation_type" IN ('PID', 'QEAA', 'EAA', 'NON_REGULATED') ) NOT NULL DEFAULT 'NON_REGULATED',
        "document_format" varchar CHECK( "document_format" IN ('JSON_LD', 'JWT', 'SD_JWT', 'MSO_MDOC') ) NOT NULL,
        "credential_role" varchar CHECK( "credential_role" IN ('ISSUER', 'VERIFIER', 'HOLDER', 'FEDERATION_TRUST_ANCHOR') ) NOT NULL,
        "raw_document" text NOT NULL,
        "uniform_document" text NOT NULL,
        "credential_id" text,
        "hash" text NOT NULL,
        "kms_key_ref" text,
        "identifier_method" text,
        "issuer_correlation_type" varchar CHECK( "issuer_correlation_type" IN ('DID', 'KID', 'URL', 'X509_SAN') ) NOT NULL,
        "subject_correlation_type" varchar CHECK( "subject_correlation_type" IN ('DID', 'KID', 'URL', 'X509_SAN') ),
        "issuer_correlation_id" text NOT NULL,
        "subject_correlation_id" text,
        "issuer_signed" boolean,
        "rp_correlation_id" text,
        "rp_correlation_type" varchar CHECK( "issuer_correlation_type" IN ('DID', 'KID', 'URL', 'X509_SAN') ),
        "verified_state" varchar CHECK( "verified_state" IN ('REVOKED', 'VERIFIED', 'EXPIRED', 'SUSPENDED') ),
        "tenant_id" text,
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')),
        "presented_at" datetime,
        "valid_from" datetime,
        "valid_until" datetime,
        "verified_at" datetime,
        "revoked_at" datetime,
        "linked_vp_id" text,
        "linked_vp_from" datetime,
        "linked_vp_until" datetime,
        "status_last_checked_at" datetime,
        UNIQUE ("hash", "credential_role")
      )
    `)

    await queryRunner.query(`
      INSERT INTO "DigitalCredential_new" (
        "id","parent_id","document_type","regulation_type","document_format","credential_role",
        "raw_document","uniform_document","credential_id","hash","kms_key_ref","identifier_method",
        "issuer_correlation_type","subject_correlation_type","issuer_correlation_id","subject_correlation_id",
        "issuer_signed","rp_correlation_id","rp_correlation_type","verified_state","tenant_id",
        "created_at","last_updated_at","presented_at","valid_from","valid_until","verified_at","revoked_at",
        "linked_vp_id","linked_vp_from","linked_vp_until"
      )
      SELECT
        "id","parent_id","document_type","regulation_type","document_format","credential_role",
        "raw_document","uniform_document","credential_id","hash","kms_key_ref","identifier_method",
        "issuer_correlation_type","subject_correlation_type","issuer_correlation_id","subject_correlation_id",
        "issuer_signed","rp_correlation_id","rp_correlation_type","verified_state","tenant_id",
        "created_at","last_updated_at","presented_at","valid_from","valid_until","verified_at","revoked_at",
        "linked_vp_id","linked_vp_from","linked_vp_until"
      FROM "DigitalCredential"
    `)

    await queryRunner.query(`DROP TABLE "DigitalCredential"`)
    await queryRunner.query(`ALTER TABLE "DigitalCredential_new" RENAME TO "DigitalCredential"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Collapse SUSPENDED to NULL so the narrowed CHECK does not reject existing rows
    await queryRunner.query(`UPDATE "DigitalCredential" SET "verified_state" = NULL WHERE "verified_state" = 'SUSPENDED'`)

    await queryRunner.query(`
      CREATE TABLE "DigitalCredential_old" (
        "id" varchar PRIMARY KEY NOT NULL,
        "parent_id" text,
        "document_type" varchar CHECK( "document_type" IN ('VC', 'VP', 'C', 'P') ) NOT NULL,
        "regulation_type" varchar CHECK( "regulation_type" IN ('PID', 'QEAA', 'EAA', 'NON_REGULATED') ) NOT NULL DEFAULT 'NON_REGULATED',
        "document_format" varchar CHECK( "document_format" IN ('JSON_LD', 'JWT', 'SD_JWT', 'MSO_MDOC') ) NOT NULL,
        "credential_role" varchar CHECK( "credential_role" IN ('ISSUER', 'VERIFIER', 'HOLDER', 'FEDERATION_TRUST_ANCHOR') ) NOT NULL,
        "raw_document" text NOT NULL,
        "uniform_document" text NOT NULL,
        "credential_id" text,
        "hash" text NOT NULL,
        "kms_key_ref" text,
        "identifier_method" text,
        "issuer_correlation_type" varchar CHECK( "issuer_correlation_type" IN ('DID', 'KID', 'URL', 'X509_SAN') ) NOT NULL,
        "subject_correlation_type" varchar CHECK( "subject_correlation_type" IN ('DID', 'KID', 'URL', 'X509_SAN') ),
        "issuer_correlation_id" text NOT NULL,
        "subject_correlation_id" text,
        "issuer_signed" boolean,
        "rp_correlation_id" text,
        "rp_correlation_type" varchar CHECK( "issuer_correlation_type" IN ('DID', 'KID', 'URL', 'X509_SAN') ),
        "verified_state" varchar CHECK( "verified_state" IN ('REVOKED', 'VERIFIED', 'EXPIRED') ),
        "tenant_id" text,
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')),
        "presented_at" datetime,
        "valid_from" datetime,
        "valid_until" datetime,
        "verified_at" datetime,
        "revoked_at" datetime,
        "linked_vp_id" text,
        "linked_vp_from" datetime,
        "linked_vp_until" datetime,
        UNIQUE ("hash", "credential_role")
      )
    `)

    await queryRunner.query(`
      INSERT INTO "DigitalCredential_old" (
        "id","parent_id","document_type","regulation_type","document_format","credential_role",
        "raw_document","uniform_document","credential_id","hash","kms_key_ref","identifier_method",
        "issuer_correlation_type","subject_correlation_type","issuer_correlation_id","subject_correlation_id",
        "issuer_signed","rp_correlation_id","rp_correlation_type","verified_state","tenant_id",
        "created_at","last_updated_at","presented_at","valid_from","valid_until","verified_at","revoked_at",
        "linked_vp_id","linked_vp_from","linked_vp_until"
      )
      SELECT
        "id","parent_id","document_type","regulation_type","document_format","credential_role",
        "raw_document","uniform_document","credential_id","hash","kms_key_ref","identifier_method",
        "issuer_correlation_type","subject_correlation_type","issuer_correlation_id","subject_correlation_id",
        "issuer_signed","rp_correlation_id","rp_correlation_type","verified_state","tenant_id",
        "created_at","last_updated_at","presented_at","valid_from","valid_until","verified_at","revoked_at",
        "linked_vp_id","linked_vp_from","linked_vp_until"
      FROM "DigitalCredential"
    `)

    await queryRunner.query(`DROP TABLE "DigitalCredential"`)
    await queryRunner.query(`ALTER TABLE "DigitalCredential_old" RENAME TO "DigitalCredential"`)
  }
}
