import { MigrationInterface, QueryRunner } from 'typeorm'
import { enablePostgresUuidExtension } from '@sphereon/ssi-sdk.core'

export class CreateContacts1690925872592 implements MigrationInterface {
  name = 'CreateContacts1690925872592'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await enablePostgresUuidExtension(queryRunner)
    await queryRunner.query(`ALTER TABLE "CorrelationIdentifier" DROP CONSTRAINT "FK_CorrelationIdentifier_identityId"`)
    await queryRunner.query(`ALTER TABLE "IdentityMetadata" DROP CONSTRAINT "FK_IdentityMetadata_identityId"`)
    await queryRunner.query(`ALTER TABLE "Identity" DROP CONSTRAINT "FK_Identity_contactId"`)
    await queryRunner.query(`ALTER TABLE "Connection" DROP CONSTRAINT "FK_Connection_identityId"`)
    await queryRunner.query(`ALTER TABLE "CorrelationIdentifier" RENAME COLUMN "identityId" TO "identity_id"`)
    await queryRunner.query(`ALTER TABLE "Connection" RENAME COLUMN "identityId" TO "identity_id"`)
    await queryRunner.query(`CREATE TYPE "public"."PartyType_type_enum" AS ENUM('naturalPerson', 'organization')`)
    await queryRunner.query(`CREATE TYPE "public"."PartyOrigin_type_enum" AS ENUM('INTERNAL', 'EXTERNAL')`)
    await queryRunner.query(
      `CREATE TABLE "PartyType" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."PartyType_type_enum" NOT NULL, "origin" "public"."PartyOrigin_type_enum" NOT NULL DEFAULT 'EXTERNAL', "name" character varying(255) NOT NULL, "description" character varying(255), "tenant_id" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "last_updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_PartyType_name" UNIQUE ("name"), CONSTRAINT "PK_PartyType_id" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_PartyType_type_tenant_id" ON "PartyType" ("type", "tenant_id")`)
    await queryRunner.query(
      `CREATE TABLE "BaseContact" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "last_updated_at" TIMESTAMP NOT NULL DEFAULT now(), "legal_name" character varying(255), "display_name" character varying(255), "first_name" character varying(255), "middle_name" character varying(255), "last_name" character varying(255), "type" character varying NOT NULL, "party_id" uuid, CONSTRAINT "UQ_BaseContact_legal_name" UNIQUE ("legal_name"), CONSTRAINT "REL_BaseContact_party_id" UNIQUE ("party_id"), CONSTRAINT "PK_BaseContact_id" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(`CREATE INDEX "IDX_BaseContact_type" ON "BaseContact" ("type")`)
    await queryRunner.query(
      `CREATE TABLE "PartyRelationship" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "left_id" uuid NOT NULL, "right_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "last_updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_PartyRelationship_id" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_PartyRelationship_left_right" ON "PartyRelationship" ("left_id", "right_id")`)
    await queryRunner.query(
      `CREATE TABLE "ElectronicAddress" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying(255) NOT NULL, "electronic_address" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "last_updated_at" TIMESTAMP NOT NULL DEFAULT now(), "partyId" uuid, CONSTRAINT "PK_ElectronicAddress_id" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "PhysicalAddress" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying(255) NOT NULL, "street_name" character varying(255) NOT NULL, "street_number" character varying(255) NOT NULL, "postal_code" character varying(255) NOT NULL, "city_name" character varying(255) NOT NULL, "province_name" character varying(255) NOT NULL, "country_code" character varying(2) NOT NULL, "building_name" character varying(255), "partyId" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "last_updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_PhysicalAddress_id" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "Party" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uri" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "last_updated_at" TIMESTAMP NOT NULL DEFAULT now(), "party_type_id" uuid NOT NULL, CONSTRAINT "PK_Party_id" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "BaseConfig" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "identifier" character varying(255), "redirect_url" character varying(255), "session_id" character varying(255), "client_id" character varying(255), "client_secret" character varying(255), "scopes" text, "issuer" character varying(255), "dangerously_allow_insecure_http_requests" boolean, "client_auth_method" text, "type" character varying NOT NULL, "connection_id" uuid, CONSTRAINT "REL_BaseConfig_connection_id" UNIQUE ("connection_id"), CONSTRAINT "PK_BaseConfig_id" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(`CREATE INDEX "IDX_BaseConfig_type" ON "BaseConfig" ("type")`)
    await queryRunner.query(`ALTER TABLE "Identity" RENAME COLUMN "contactId" TO "partyId"`)
    await queryRunner.query(`ALTER TABLE "Identity" ALTER COLUMN "roles" SET NOT NULL`)
    await queryRunner.query(
      `ALTER TABLE "CorrelationIdentifier" ADD CONSTRAINT "FK_CorrelationIdentifier_identity_id" FOREIGN KEY ("identity_id") REFERENCES "Identity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "IdentityMetadata" ADD CONSTRAINT "FK_IdentityMetadata_identityId" FOREIGN KEY ("identityId") REFERENCES "Identity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "BaseContact" ADD CONSTRAINT "FK_BaseContact_party_id" FOREIGN KEY ("party_id") REFERENCES "Party"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "PartyRelationship" ADD CONSTRAINT "FK_PartyRelationship_left_id" FOREIGN KEY ("left_id") REFERENCES "Party"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "PartyRelationship" ADD CONSTRAINT "FK_PartyRelationship_right_id" FOREIGN KEY ("right_id") REFERENCES "Party"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "ElectronicAddress" ADD CONSTRAINT "FK_ElectronicAddress_partyId" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "PhysicalAddress" ADD CONSTRAINT "FK_PhysicalAddress_partyId" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "Party" ADD CONSTRAINT "FK_Party_party_type_id" FOREIGN KEY ("party_type_id") REFERENCES "PartyType"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "Identity" ADD CONSTRAINT "FK_Identity_partyId" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "Connection" ADD CONSTRAINT "FK_Connection_identity_id" FOREIGN KEY ("identity_id") REFERENCES "Identity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "BaseConfig" ADD CONSTRAINT "FK_BaseConfig_connection_id" FOREIGN KEY ("connection_id") REFERENCES "Connection"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )

    // migrate existing data
    await queryRunner.query(`ALTER TABLE "CorrelationIdentifier" RENAME CONSTRAINT "UQ_Correlation_id" TO "UQ_CorrelationIdentifier_correlation_id"`)
    await queryRunner.query(`ALTER TABLE "Identity" RENAME CONSTRAINT "UQ_Identity_Alias" TO "UQ_Identity_alias"`)
    await queryRunner.query(
      `INSERT INTO "BaseConfig"("id", "identifier", "redirect_url", "session_id", "client_id", "client_secret", "scopes", "issuer", "dangerously_allow_insecure_http_requests", "client_auth_method", "type", "connection_id") SELECT "id", "identifier", "redirect_url", "session_id", "client_id", "client_secret", "scopes", "issuer", "dangerously_allow_insecure_http_requests", "client_auth_method", "type", "connectionId" FROM "BaseConfigEntity"`,
    )
    await queryRunner.query(`DROP TABLE "BaseConfigEntity"`)
    await queryRunner.query(
      `INSERT INTO "PartyType"(id, type, origin, name, description, tenant_id, created_at, last_updated_at) VALUES ('3875c12e-fdaa-4ef6-a340-c936e054b627', 'organization', 'INTERNAL' 'Sphereon_default_organization_type', 'sphereon_default_organization', '95e09cfc-c974-4174-86aa-7bf1d5251fb4', now(), now())`,
    )
    await queryRunner.query(
      `INSERT INTO "PartyType"(id, type, origin, name, description, tenant_id, created_at, last_updated_at) VALUES ('7d248798-41ca-4fc1-a130-9934b43d532e', 'naturalPerson', 'INTERNAL', 'Sphereon_default_natural_person_type', 'sphereon_default_natural_person', '95e09cfc-c974-4174-86aa-7bf1d5251fb4', now(), now())`,
    )
    await queryRunner.query(
      `INSERT INTO "Party"(id, uri, created_at, last_updated_at, party_type_id) SELECT id, uri, created_at, last_updated_at, '3875c12e-fdaa-4ef6-a340-c936e054b627' FROM "Contact"`,
    )
    await queryRunner.query(
      `INSERT INTO "BaseContact"(id, legal_name, display_name, party_id, created_at, last_updated_at, type) SELECT id, name, alias, id, created_at, last_updated_at, 'Organization' FROM "Contact"`,
    )
    await queryRunner.query(`DROP TABLE "Contact"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // TODO DPP-27 implement downgrade
    return Promise.reject(Error(`Downgrade is not yet implemented for ${this.name}`))
  }
}
