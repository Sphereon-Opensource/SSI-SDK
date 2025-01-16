// noinspection SqlPostgresDialect SqlNoDataSourceInspection
import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateStatusList1693866470001 implements MigrationInterface {
  name = 'CreateStatusList1693866470001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "StatusList_type_enum" AS ENUM('StatusList2021', 'OAuthStatusList')`)
    await queryRunner.query(`CREATE TYPE "StatusList_drivertype_enum" AS ENUM('agent_typeorm', 'agent_kv_store', 'github', 'agent_filesystem')`)
    await queryRunner.query(`CREATE TYPE "StatusList_credentialidmode_enum" AS ENUM('ISSUANCE', 'PERSISTENCE', 'NEVER')`)

    await queryRunner.query(
      `CREATE TABLE "StatusList"
             (
                 "id"                   varchar                            NOT NULL,
                 "correlationId"        varchar                            NOT NULL,
                 "length"               integer                            NOT NULL,
                 "issuer"               text                               NOT NULL,
                 "type"                 "StatusList_type_enum"             NOT NULL DEFAULT 'StatusList2021',
                 "driverType"           "StatusList_drivertype_enum"       NOT NULL DEFAULT 'agent_typeorm',
                 "credentialIdMode"     "StatusList_credentialidmode_enum" NOT NULL DEFAULT 'ISSUANCE',
                 "proofFormat"          varchar                            NOT NULL DEFAULT 'lds',
                 "statusListCredential" text,
                 "indexingDirection"    varchar,
                 "statusPurpose"        varchar,
                 "bitsPerStatus"        integer,
                 "expiresAt"            varchar,
                 CONSTRAINT "UQ_correlationId" UNIQUE ("correlationId"),
                 CONSTRAINT "PK_StatusList_Id" PRIMARY KEY ("id")
             )`,
    )

    await queryRunner.query(
      `CREATE TABLE "StatusListEntry"
             (
                 "statusListId"    varchar NOT NULL,
                 "statusListIndex" integer NOT NULL,
                 "credentialId"    varchar,
                 "credentialHash"  varchar(128),
                 "correlationId"   varchar(255),
                 "value"           varchar(50),
                 CONSTRAINT "PK_68704d2d13857360c6b44a3d1d0" PRIMARY KEY ("statusListId", "statusListIndex")
             )`,
    )

    await queryRunner.query(
      `ALTER TABLE "StatusListEntry"
                ADD CONSTRAINT "FK_statusListEntry_statusListId" FOREIGN KEY ("statusListId") REFERENCES "StatusList" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "StatusListEntry"
            DROP CONSTRAINT "FK_statusListEntry_statusListId"`)
    await queryRunner.query(`DROP TABLE "StatusListEntry"`)
    await queryRunner.query(`DROP TABLE "StatusList"`)
    await queryRunner.query(`DROP TYPE "StatusList_credentialidmode_enum"`)
    await queryRunner.query(`DROP TYPE "StatusList_drivertype_enum"`)
    await queryRunner.query(`DROP TYPE "StatusList_type_enum"`)
  }
}
