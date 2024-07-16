import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateDigitalCredential1708525189002 implements MigrationInterface {
  name = 'CreateDigitalCredential1708525189002'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "DigitalCredential" (
                "id" varchar PRIMARY KEY NOT NULL,
                "document_type" varchar CHECK( "document_type" IN ('VC', 'VP', 'C', 'P') ) NOT NULL,
                "document_format" varchar CHECK( "document_format" IN ('JSON_LD', 'JWT', 'SD_JWT', 'MDOC') ) NOT NULL,
                "credential_role" varchar CHECK( "credential_role" IN ('ISSUER', 'VERIFIER', 'HOLDER') ) NOT NULL,
                "raw_document" text NOT NULL,
                "uniform_document" text NOT NULL,
                "credential_id" text,
                "hash" text NOT NULL UNIQUE,
                "issuer_correlation_type" varchar CHECK( "issuer_correlation_type" IN ('DID') ) NOT NULL,
                "subject_correlation_type" varchar CHECK( "subject_correlation_type" IN ('DID') ),
                "issuer_correlation_id" text NOT NULL,
                "subject_correlation_id" text,
                "verified_state" varchar CHECK( "verified_state" IN ('REVOKED', 'VERIFIED', 'EXPIRED') ),
                "tenant_id" text,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "valid_from" datetime,
                "valid_until" datetime,
                "verified_at" datetime,
                "revoked_at" datetime
            )
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "DigitalCredential"`)
  }
}
