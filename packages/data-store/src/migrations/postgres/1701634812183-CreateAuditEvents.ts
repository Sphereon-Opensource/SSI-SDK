import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateAuditEvents1701634812183 implements MigrationInterface {
  name = 'CreateAuditEvents1701634812183'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."Level_enum" AS ENUM('0', '1', '2', '3')`)
    await queryRunner.query(
      `CREATE TYPE "public"."System_enum" AS ENUM('general', 'kms', 'identity', 'oid4vci', 'credentials', 'web3', 'profile', 'contact')`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."Subsystem_type_enum" AS ENUM('key', 'did_provider', 'did_resolver', 'oid4vp_op', 'oid4vci_client', 'siopv2_op', 'contact_manager', 'vc_issuer', 'vc_verifier', 'vc_persistence', 'transport', 'profile')`
    )
    await queryRunner.query(`CREATE TYPE "public"."Action_type_enum" AS ENUM('create', 'read', 'update', 'delete', 'execute')`)
    await queryRunner.query(`CREATE TYPE "public"."Initiator_type_enum" AS ENUM('user', 'system', 'external')`)
    await queryRunner.query(`CREATE TYPE "public"."System_correlation_id_type_enum" AS ENUM('did', 'email', 'hostname', 'phone', 'user')`)
    await queryRunner.query(`CREATE TYPE "public"."Party_correlation_type_enum" AS ENUM('did', 'email', 'hostname', 'phone')`)
    await queryRunner.query(
      `CREATE TABLE "AuditEvents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "timestamp" TIMESTAMP NOT NULL, "level" "public"."Level_enum" NOT NULL, "correlationId" TEXT NOT NULL, "system" "public"."System_enum" NOT NULL, "subSystemType" "public"."Subsystem_type_enum" NOT NULL, "actionType" "public"."Action_type_enum" NOT NULL, "actionSubType" TEXT NOT NULL, "initiatorType" "public"."Initiator_type_enum" NOT NULL, "systemCorrelationIdType" "public"."System_correlation_id_type_enum", "systemCorrelationId" TEXT, "systemAlias" TEXT, "partyCorrelationType" "public"."Party_correlation_type_enum", "partyCorrelationId" TEXT, "partyAlias" TEXT, "description" TEXT NOT NULL, "data" TEXT, "diagnosticData" TEXT, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "last_updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_AuditEvents_id" PRIMARY KEY ("id"))`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "AuditEvents"`)
    await queryRunner.query(`DROP TYPE "public"."Party_correlation_type_enum"`)
    await queryRunner.query(`DROP TYPE "public"."System_correlation_id_type_enum"`)
    await queryRunner.query(`DROP TYPE "public"."Initiator_type_enum"`)
    await queryRunner.query(`DROP TYPE "public"."Action_type_enum"`)
    await queryRunner.query(`DROP TYPE "public"."Subsystem_type_enum"`)
    await queryRunner.query(`DROP TYPE "public"."System_enum"`)
    await queryRunner.query(`DROP TYPE "public"."Level_enum"`)
  }
}
