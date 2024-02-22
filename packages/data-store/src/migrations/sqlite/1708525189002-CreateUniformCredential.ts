import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUniformCredential1708525189002 implements MigrationInterface {
  name = 'CreateUniformCredential1708525189002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "UniformCredential" (
                "id" varchar PRIMARY KEY NOT NULL,
                "credential_type" varchar CHECK( "credential_type" IN ('vc', 'vp') ) NOT NULL,
                "document_format" varchar CHECK( "document_format" IN ('JSON-LD', 'JWT', 'SD-JWT', 'MDOC') ) NOT NULL,
                "raw" text NOT NULL,
                "uniform_document" text NOT NULL,
                "hash" text NOT NULL UNIQUE,
                "issuer_correlation_type" varchar CHECK( "issuer_correlation_type" IN ('did') ) NOT NULL,
                "subject_correlation_type" varchar CHECK( "subject_correlation_type" IN ('did') ),
                "issuer_correlation_id" text NOT NULL,
                "subject_correlation_id" text,
                "last_verified_state" varchar CHECK( "last_verified_state" IN ('revoked', 'verified', 'expired') ),
                "tenant_id" text,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "expires_at" datetime,
                "verification_date" datetime,
                "revocation_date" datetime
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "UniformCredential"`);
  }
}
