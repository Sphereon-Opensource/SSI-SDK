import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateUniformCredential1708525189001 implements MigrationInterface {
  name = 'CreateUniformCredential1708525189001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "uniform_credential_credential_type_enum" AS ENUM('vc', 'vp')`)
    await queryRunner.query(`CREATE TYPE "uniform_credential_document_format_enum" AS ENUM('JSON-LD', 'JWT', 'SD-JWT', 'MDOC')`)
    await queryRunner.query(`CREATE TYPE "uniform_credential_correlation_type_enum" AS ENUM('did')`)
    await queryRunner.query(`CREATE TYPE "uniform_credential_state_type_enum" AS ENUM('revoked', 'verified', 'expired')`)

    await queryRunner.query(`
      CREATE TABLE "UniformCredential" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "credential_type" "uniform_credential_credential_type_enum" NOT NULL,
        "document_format" "uniform_credential_document_format_enum" NOT NULL,
        "raw" text NOT NULL,
        "uniform_document" text NOT NULL,
        "hash" text NOT NULL UNIQUE,
        "issuer_correlation_type" "uniform_credential_correlation_type_enum" NOT NULL,
        "subject_correlation_type" "uniform_credential_correlation_type_enum",
        "issuer_correlation_id" text NOT NULL,
        "subject_correlation_id" text,
        "last_verified_state" "uniform_credential_state_type_enum",
        "tenant_id" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "last_updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "expires_at" DATE,
        "verification_date" DATE,
        "revocation_date" DATE,
        PRIMARY KEY ("id")
      )
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "UniformCredential"`)
    await queryRunner.query(`DROP TYPE "uniform_credential_state_type_enum"`)
    await queryRunner.query(`DROP TYPE "uniform_credential_correlation_type_enum"`)
    await queryRunner.query(`DROP TYPE "uniform_credential_document_format_enum"`)
    await queryRunner.query(`DROP TYPE "uniform_credential_credential_type_enum"`)
  }
}
