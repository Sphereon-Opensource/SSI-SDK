import { MigrationInterface, QueryRunner } from 'typeorm'
import { enablePostgresUuidExtension } from '@sphereon/ssi-sdk.core'

export class CreateContacts1659463079428 implements MigrationInterface {
  name = 'CreateContacts1659463079428'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await enablePostgresUuidExtension(queryRunner)
    await queryRunner.query(
      `CREATE TABLE "BaseConfigEntity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "client_id" character varying(255), "client_secret" character varying(255), "scopes" text, "issuer" character varying(255), "redirect_url" text, "dangerously_allow_insecure_http_requests" boolean, "client_auth_method" text, "identifier" character varying(255), "session_id" character varying(255), "type" character varying NOT NULL, "connectionId" uuid, CONSTRAINT "REL_BaseConfig_connectionId" UNIQUE ("connectionId"), CONSTRAINT "PK_BaseConfigEntity_id" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(`CREATE INDEX "IDX_BaseConfigEntity_type" ON "BaseConfigEntity" ("type")`)
    await queryRunner.query(`CREATE TYPE "public"."CorrelationIdentifier_type_enum" AS ENUM('did', 'url')`)
    await queryRunner.query(
      `CREATE TABLE "CorrelationIdentifier" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."CorrelationIdentifier_type_enum" NOT NULL, "correlation_id" text NOT NULL, "identityId" uuid, CONSTRAINT "UQ_Correlation_id" UNIQUE ("correlation_id"), CONSTRAINT "REL_CorrelationIdentifier_identityId" UNIQUE ("identityId"), CONSTRAINT "PK_CorrelationIdentifier_id" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "Contact" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "alias" character varying(255) NOT NULL, "uri" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "last_updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_Name" UNIQUE ("name"), CONSTRAINT "UQ_Contact_Alias" UNIQUE ("alias"), CONSTRAINT "PK_Contact_id" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "IdentityMetadata" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "label" character varying(255) NOT NULL, "value" character varying(255) NOT NULL, "identityId" uuid, CONSTRAINT "PK_IdentityMetadata_id" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "Identity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "alias" character varying(255) NOT NULL, "roles" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "last_updated_at" TIMESTAMP NOT NULL DEFAULT now(), "contactId" uuid, CONSTRAINT "UQ_Identity_Alias" UNIQUE ("alias"), CONSTRAINT "PK_Identity_id" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(`CREATE TYPE "public"."Connection_type_enum" AS ENUM('OIDC', 'SIOPv2', 'SIOPv2+OpenID4VP')`)
    await queryRunner.query(
      `CREATE TABLE "Connection" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."Connection_type_enum" NOT NULL, "identityId" uuid, CONSTRAINT "REL_Connection_identityId" UNIQUE ("identityId"), CONSTRAINT "PK_Connection_id" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "BaseConfigEntity" ADD CONSTRAINT "FK_BaseConfig_connectionId" FOREIGN KEY ("connectionId") REFERENCES "Connection"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "CorrelationIdentifier" ADD CONSTRAINT "FK_CorrelationIdentifier_identityId" FOREIGN KEY ("identityId") REFERENCES "Identity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "IdentityMetadata" ADD CONSTRAINT "FK_IdentityMetadata_identityId" FOREIGN KEY ("identityId") REFERENCES "Identity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "Identity" ADD CONSTRAINT "FK_Identity_contactId" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "Connection" ADD CONSTRAINT "FK_Connection_identityId" FOREIGN KEY ("identityId") REFERENCES "Identity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Connection" DROP CONSTRAINT "FK_Connection_identityId"`)
    await queryRunner.query(`ALTER TABLE "Identity" DROP CONSTRAINT "FK_Identity_contactId"`)
    await queryRunner.query(`ALTER TABLE "IdentityMetadata" DROP CONSTRAINT "FK_IdentityMetadata_identityId"`)
    await queryRunner.query(`ALTER TABLE "CorrelationIdentifier" DROP CONSTRAINT "FK_CorrelationIdentifier_identityId"`)
    await queryRunner.query(`ALTER TABLE "BaseConfigEntity" DROP CONSTRAINT "FK_BaseConfig_connectionId"`)
    await queryRunner.query(`DROP TABLE "Connection"`)
    await queryRunner.query(`DROP TYPE "public"."Connection_type_enum"`)
    await queryRunner.query(`DROP TABLE "Identity"`)
    await queryRunner.query(`DROP TABLE "IdentityMetadata"`)
    await queryRunner.query(`DROP TABLE "Contact"`)
    await queryRunner.query(`DROP TABLE "CorrelationIdentifier"`)
    await queryRunner.query(`DROP TYPE "public"."CorrelationIdentifier_type_enum"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_BaseConfigEntity_type"`)
    await queryRunner.query(`DROP TABLE "BaseConfigEntity"`)
  }
}
