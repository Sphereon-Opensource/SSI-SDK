import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateConnections1659463079428 implements MigrationInterface {
  name = 'CreateConnections1659463079428'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "BaseConfigEntity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "last_updated_at" TIMESTAMP NOT NULL DEFAULT now(), "client_id" character varying(255), "client_secret" character varying(255), "scopes" text, "issuer" text, "redirect_url" text, "dangerously_allow_insecure_http_requests" boolean, "client_auth_method" text, "identifier" text, "session_id" character varying(255), "type" character varying NOT NULL, CONSTRAINT "PK_BaseConfigEntity_id" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(`CREATE INDEX "IDX_BaseConfigEntity_type" ON "BaseConfigEntity" ("type") `)
    await queryRunner.query(`CREATE TYPE "public"."ConnectionIdentifier_type_enum" AS ENUM('did', 'url')`)
    await queryRunner.query(
      `CREATE TABLE "ConnectionIdentifier" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."ConnectionIdentifier_type_enum" NOT NULL, "correlation_id" text NOT NULL, CONSTRAINT "PK_ConnectionIdentifier_id" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "ConnectionMetadata" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "label" character varying(255) NOT NULL, "value" character varying(255) NOT NULL, "connectionId" uuid, CONSTRAINT "PK_ConnectionMetadata_id" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "Party" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, CONSTRAINT "UQ_Party_name" UNIQUE ("name"), CONSTRAINT "PK_Party_id" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(`CREATE TYPE "public"."Connection_type_enum" AS ENUM('openid', 'didauth', 'siopv2+oidc4vp')`)
    await queryRunner.query(
      `CREATE TABLE "Connection" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."Connection_type_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "last_updated_at" TIMESTAMP NOT NULL DEFAULT now(), "identifierId" uuid, "configId" uuid, "partyId" uuid, CONSTRAINT "REL_Connection_identifierId" UNIQUE ("identifierId"), CONSTRAINT "REL_Connection_configId" UNIQUE ("configId"), CONSTRAINT "PK_Connection_id" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `ALTER TABLE "ConnectionMetadata" ADD CONSTRAINT "FK_ConnectionMetadata_connectionId" FOREIGN KEY ("connectionId") REFERENCES "Connection"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "Connection" ADD CONSTRAINT "FK_Connection_identifierId" FOREIGN KEY ("identifierId") REFERENCES "ConnectionIdentifier"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "Connection" ADD CONSTRAINT "FK_Connection_configId" FOREIGN KEY ("configId") REFERENCES "BaseConfigEntity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "Connection" ADD CONSTRAINT "FK_Connection_partyId" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Connection" DROP CONSTRAINT "FK_Connection_partyId"`)
    await queryRunner.query(`ALTER TABLE "Connection" DROP CONSTRAINT "FK_Connection_configId"`)
    await queryRunner.query(`ALTER TABLE "Connection" DROP CONSTRAINT "FK_Connection_identifierId"`)
    await queryRunner.query(`ALTER TABLE "ConnectionMetadata" DROP CONSTRAINT "FK_ConnectionMetadata_connectionId"`)
    await queryRunner.query(`DROP TABLE "Connection"`)
    await queryRunner.query(`DROP TYPE "public"."Connection_type_enum"`)
    await queryRunner.query(`DROP TABLE "Party"`)
    await queryRunner.query(`DROP TABLE "ConnectionMetadata"`)
    await queryRunner.query(`DROP TABLE "ConnectionIdentifier"`)
    await queryRunner.query(`DROP TYPE "public"."ConnectionIdentifier_type_enum"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_BaseConfigEntity_type"`)
    await queryRunner.query(`DROP TABLE "BaseConfigEntity"`)
  }
}
