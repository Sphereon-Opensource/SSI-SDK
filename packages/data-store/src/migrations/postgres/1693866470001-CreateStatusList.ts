import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateStatusList1693866470001 implements MigrationInterface {
  name = 'CreateStatusList1693866470001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "StatusListEntry" ("statusListId" character varying NOT NULL, "statusListIndex" integer NOT NULL, "credentialId" character varying, "credentialHash" character varying(128), "correlationId" character varying(255), "value" character varying(50), CONSTRAINT "PK_68704d2d13857360c6b44a3d1d0" PRIMARY KEY ("statusListId", "statusListIndex"))`,
    )
    await queryRunner.query(`CREATE TYPE "public"."StatusList_type_enum" AS ENUM('StatusList2021')`)
    await queryRunner.query(
      `CREATE TYPE "public"."StatusList_drivertype_enum" AS ENUM('agent_typeorm', 'agent_kv_store', 'github', 'agent_filesystem')`,
    )
    await queryRunner.query(`CREATE TYPE "public"."StatusList_credentialidmode_enum" AS ENUM('ISSUANCE', 'PERSISTENCE', 'NEVER')`)
    await queryRunner.query(
      `CREATE TABLE "StatusList" ("id" character varying NOT NULL, "correlationId" character varying NOT NULL, "length" integer NOT NULL, "issuer" text NOT NULL, "type" "public"."StatusList_type_enum" NOT NULL DEFAULT 'StatusList2021', "driverType" "public"."StatusList_drivertype_enum" NOT NULL DEFAULT 'agent_typeorm', "credentialIdMode" "public"."StatusList_credentialidmode_enum" NOT NULL DEFAULT 'ISSUANCE', "proofFormat" character varying NOT NULL DEFAULT 'lds', "indexingDirection" character varying NOT NULL DEFAULT 'rightToLeft', "statusPurpose" character varying NOT NULL DEFAULT 'revocation', "statusListCredential" text, CONSTRAINT "UQ_correlationId" UNIQUE ("correlationId"), CONSTRAINT "PK_StatusList_Id" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "StatusListEntry" ADD CONSTRAINT "FK_statusListEntry_statusListId" FOREIGN KEY ("statusListId") REFERENCES "StatusList"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
