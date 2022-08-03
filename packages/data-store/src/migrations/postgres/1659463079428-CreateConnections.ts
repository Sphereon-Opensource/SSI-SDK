import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateConnections1659463079428 implements MigrationInterface {
  name = 'CreateConnections1659463079428'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."BaseConfigEntity_type_enum" AS ENUM('OpenIdConfig', 'DidAuthConfig')`)
    await queryRunner.query(
      `CREATE TABLE "BaseConfigEntity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "last_updated_at" TIMESTAMP NOT NULL DEFAULT now(), "client_id" character varying(255), "client_secret" character varying(255), "scopes" text, "issuer" text, "redirect_url" text, "dangerously_allow_insecure_http_requests" boolean, "client_auth_method" text, "identifier" text, "session_id" character varying(255), "type" "public"."BaseConfigEntity_type_enum" NOT NULL, CONSTRAINT "PK_f4f093a5148e5be75324145a58b" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(`CREATE INDEX "IDX_228953a09ee91bbac6e28b7345" ON "BaseConfigEntity" ("type") `)
    await queryRunner.query(`CREATE TYPE "public"."ConnectionIdentifier_connection_identifier_enum" AS ENUM('did', 'url')`)
    await queryRunner.query(
      `CREATE TABLE "ConnectionIdentifier" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "connection_identifier" "public"."ConnectionIdentifier_connection_identifier_enum" NOT NULL, "correlation_id" text NOT NULL, CONSTRAINT "PK_402720c2bc286daafb8a0b09dd3" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "ConnectionMetadata" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "label" character varying(255) NOT NULL, "value" character varying(255) NOT NULL, "connectionId" uuid, CONSTRAINT "PK_0c3d592dcee11e1d8e0aac9ab99" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "Party" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, CONSTRAINT "UQ_66eac665e95dbed6abd544940f6" UNIQUE ("name"), CONSTRAINT "PK_1d61626792eccfcb50ff6f7cda2" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(`CREATE TYPE "public"."Connection_connection_type_enum" AS ENUM('openid', 'didauth', 'siopv2+oidc4vp')`)
    await queryRunner.query(
      `CREATE TABLE "Connection" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "connection_type" "public"."Connection_connection_type_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "last_updated_at" TIMESTAMP NOT NULL DEFAULT now(), "identifierId" uuid, "configId" uuid, "partyId" uuid, CONSTRAINT "REL_aa9063e7f7fb511f53fd7ed514" UNIQUE ("identifierId"), CONSTRAINT "REL_258311da5ac24ef56f9a67e97a" UNIQUE ("configId"), CONSTRAINT "PK_5ca08c4ea0f5a8756deca92bdee" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `ALTER TABLE "ConnectionMetadata" ADD CONSTRAINT "FK_6ad4b3aef7fa22859724a7daefb" FOREIGN KEY ("connectionId") REFERENCES "Connection"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "Connection" ADD CONSTRAINT "FK_aa9063e7f7fb511f53fd7ed514c" FOREIGN KEY ("identifierId") REFERENCES "ConnectionIdentifier"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "Connection" ADD CONSTRAINT "FK_258311da5ac24ef56f9a67e97a0" FOREIGN KEY ("configId") REFERENCES "BaseConfigEntity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "Connection" ADD CONSTRAINT "FK_7d1cc49940483073cdc4cea2284" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Connection" DROP CONSTRAINT "FK_7d1cc49940483073cdc4cea2284"`)
    await queryRunner.query(`ALTER TABLE "Connection" DROP CONSTRAINT "FK_258311da5ac24ef56f9a67e97a0"`)
    await queryRunner.query(`ALTER TABLE "Connection" DROP CONSTRAINT "FK_aa9063e7f7fb511f53fd7ed514c"`)
    await queryRunner.query(`ALTER TABLE "ConnectionMetadata" DROP CONSTRAINT "FK_6ad4b3aef7fa22859724a7daefb"`)
    await queryRunner.query(`DROP TABLE "Connection"`)
    await queryRunner.query(`DROP TYPE "public"."Connection_connection_type_enum"`)
    await queryRunner.query(`DROP TABLE "Party"`)
    await queryRunner.query(`DROP TABLE "ConnectionMetadata"`)
    await queryRunner.query(`DROP TABLE "ConnectionIdentifier"`)
    await queryRunner.query(`DROP TYPE "public"."ConnectionIdentifier_connection_identifier_enum"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_228953a09ee91bbac6e28b7345"`)
    await queryRunner.query(`DROP TABLE "BaseConfigEntity"`)
    await queryRunner.query(`DROP TYPE "public"."BaseConfigEntity_type_enum"`)
  }
}
