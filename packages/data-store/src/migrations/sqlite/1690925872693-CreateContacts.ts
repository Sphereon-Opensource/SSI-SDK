import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateContacts1690925872693 implements MigrationInterface {
  name = 'CreateContacts1690925872693'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "temporary_CorrelationIdentifier" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar CHECK( "type" IN ('did','url') ) NOT NULL, "correlation_id" text NOT NULL, "identityId" varchar, CONSTRAINT "REL_CorrelationIdentifier_identityId" UNIQUE ("identityId"), CONSTRAINT "UQ_CorrelationIdentifier_correlation_id" UNIQUE ("correlation_id"))`,
    )
    await queryRunner.query(
      `INSERT INTO "temporary_CorrelationIdentifier"("id", "type", "correlation_id", "identityId") SELECT "id", "type", "correlation_id", "identityId" FROM "CorrelationIdentifier"`,
    )
    await queryRunner.query(`DROP TABLE "CorrelationIdentifier"`)
    await queryRunner.query(`ALTER TABLE "temporary_CorrelationIdentifier" RENAME TO "CorrelationIdentifier"`)
    await queryRunner.query(
      `CREATE TABLE "temporary_Identity" ("id" varchar PRIMARY KEY NOT NULL, "alias" varchar(255) NOT NULL, "roles" text NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "contactId" varchar, CONSTRAINT "UQ_Identity_alias" UNIQUE ("alias"))`,
    )
    await queryRunner.query(
      `INSERT INTO "temporary_Identity"("id", "alias", "roles", "created_at", "last_updated_at", "contactId") SELECT "id", "alias", "roles", "created_at", "last_updated_at", "contactId" FROM "Identity"`,
    )
    await queryRunner.query(`DROP TABLE "Identity"`)
    await queryRunner.query(`ALTER TABLE "temporary_Identity" RENAME TO "Identity"`)
    await queryRunner.query(
      `CREATE TABLE "temporary_Connection" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar CHECK( "type" IN ('OIDC','SIOPv2','SIOPv2+OpenID4VP') ) NOT NULL, "identityId" varchar, CONSTRAINT "REL_Connection_identityId" UNIQUE ("identityId"))`,
    )
    await queryRunner.query(`INSERT INTO "temporary_Connection"("id", "type", "identityId") SELECT "id", "type", "identityId" FROM "Connection"`)
    await queryRunner.query(`DROP TABLE "Connection"`)
    await queryRunner.query(`ALTER TABLE "temporary_Connection" RENAME TO "Connection"`)
    await queryRunner.query(
      `CREATE TABLE "temporary_CorrelationIdentifier" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar CHECK( "type" IN ('did','url') ) NOT NULL, "correlation_id" text NOT NULL, "identity_id" varchar, CONSTRAINT "REL_CorrelationIdentifier_identityId" UNIQUE ("identity_id"), CONSTRAINT "UQ_CorrelationIdentifier_correlation_id" UNIQUE ("correlation_id"))`,
    )
    await queryRunner.query(
      `INSERT INTO "temporary_CorrelationIdentifier"("id", "type", "correlation_id", "identity_id") SELECT "id", "type", "correlation_id", "identityId" FROM "CorrelationIdentifier"`,
    )
    await queryRunner.query(`DROP TABLE "CorrelationIdentifier"`)
    await queryRunner.query(`ALTER TABLE "temporary_CorrelationIdentifier" RENAME TO "CorrelationIdentifier"`)
    await queryRunner.query(
      `CREATE TABLE "temporary_Identity" ("id" varchar PRIMARY KEY NOT NULL, "alias" varchar(255) NOT NULL, "roles" text NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "partyId" varchar, CONSTRAINT "UQ_Identity_alias" UNIQUE ("alias"))`,
    )
    await queryRunner.query(
      `INSERT INTO "temporary_Identity"("id", "alias", "roles", "created_at", "last_updated_at", "partyId") SELECT "id", "alias", "roles", "created_at", "last_updated_at", "contactId" FROM "Identity"`,
    )
    await queryRunner.query(`DROP TABLE "Identity"`)
    await queryRunner.query(`ALTER TABLE "temporary_Identity" RENAME TO "Identity"`)
    await queryRunner.query(
      `CREATE TABLE "temporary_Connection" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar CHECK( "type" IN ('OIDC','SIOPv2','SIOPv2+OpenID4VP') ) NOT NULL, "identity_id" varchar, CONSTRAINT "REL_Connection_identityId" UNIQUE ("identity_id"))`,
    )
    await queryRunner.query(`INSERT INTO "temporary_Connection"("id", "type", "identity_id") SELECT "id", "type", "identityId" FROM "Connection"`)
    await queryRunner.query(`DROP TABLE "Connection"`)
    await queryRunner.query(`ALTER TABLE "temporary_Connection" RENAME TO "Connection"`)
    await queryRunner.query(
      `CREATE TABLE "PartyType" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar CHECK( "type" IN ('naturalPerson','organization') ) NOT NULL, "origin" varchar CHECK( "origin" IN ('INTERNAL', 'EXTERNAL') ) NOT NULL DEFAULT 'EXTERNAL', "name" varchar(255) NOT NULL, "description" varchar(255), "tenant_id" varchar(255) NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_PartyType_name" UNIQUE ("name"))`,
    )
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_PartyType_type_tenant_id" ON "PartyType" ("type", "tenant_id")`)
    await queryRunner.query(
      `CREATE TABLE "BaseContact" ("id" varchar PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "legal_name" varchar(255), "display_name" varchar(255), "first_name" varchar(255), "middle_name" varchar(255), "last_name" varchar(255), "type" varchar NOT NULL, "party_id" varchar, CONSTRAINT "UQ_BaseContact_legal_name" UNIQUE ("legal_name"), CONSTRAINT "REL_BaseContact_party_id" UNIQUE ("party_id"))`,
    )
    await queryRunner.query(`CREATE INDEX "IDX_BaseContact_type" ON "BaseContact" ("type")`)
    await queryRunner.query(
      `CREATE TABLE "PartyRelationship" ("id" varchar PRIMARY KEY NOT NULL, "left_id" varchar NOT NULL, "right_id" varchar NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')))`,
    )
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_PartyRelationship_left_right" ON "PartyRelationship" ("left_id", "right_id")`)
    await queryRunner.query(
      `CREATE TABLE "Party" ("id" varchar PRIMARY KEY NOT NULL, "uri" varchar(255) NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "party_type_id" varchar NOT NULL)`,
    )
    await queryRunner.query(
      `CREATE TABLE "BaseConfig" ("id" varchar PRIMARY KEY NOT NULL, "identifier" varchar(255), "redirect_url" varchar(255), "session_id" varchar(255), "client_id" varchar(255), "client_secret" varchar(255), "scopes" text, "issuer" varchar(255), "dangerously_allow_insecure_http_requests" boolean, "client_auth_method" text, "type" varchar NOT NULL, "connection_id" varchar, CONSTRAINT "REL_BaseConfig_connection_id" UNIQUE ("connection_id"))`,
    )
    await queryRunner.query(`CREATE INDEX "IDX_BaseConfig_type" ON "BaseConfig" ("type")`)
    await queryRunner.query(
      `CREATE TABLE "temporary_CorrelationIdentifier" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar CHECK( "type" IN ('did','url') ) NOT NULL, "correlation_id" text NOT NULL, "identity_id" varchar, CONSTRAINT "REL_CorrelationIdentifier_identity_id" UNIQUE ("identity_id"), CONSTRAINT "UQ_CorrelationIdentifier_correlation_id" UNIQUE ("correlation_id"), CONSTRAINT "FK_CorrelationIdentifier_identity_id" FOREIGN KEY ("identity_id") REFERENCES "Identity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    )
    await queryRunner.query(
      `INSERT INTO "temporary_CorrelationIdentifier"("id", "type", "correlation_id", "identity_id") SELECT "id", "type", "correlation_id", "identity_id" FROM "CorrelationIdentifier"`,
    )
    await queryRunner.query(`DROP TABLE "CorrelationIdentifier"`)
    await queryRunner.query(`ALTER TABLE "temporary_CorrelationIdentifier" RENAME TO "CorrelationIdentifier"`)
    await queryRunner.query(`DROP INDEX "IDX_BaseContact_type"`)
    await queryRunner.query(
      `CREATE TABLE "temporary_BaseContact" ("id" varchar PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "legal_name" varchar(255), "display_name" varchar(255), "first_name" varchar(255), "middle_name" varchar(255), "last_name" varchar(255), "type" varchar NOT NULL, "party_id" varchar, CONSTRAINT "UQ_BaseContact_legal_name" UNIQUE ("legal_name"), CONSTRAINT "REL_BaseContact_party_id" UNIQUE ("party_id"), CONSTRAINT "FK_BaseContact_party_id" FOREIGN KEY ("party_id") REFERENCES "Party" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    )
    await queryRunner.query(
      `INSERT INTO "temporary_BaseContact"("id", "created_at", "last_updated_at", "legal_name", "display_name", "first_name", "middle_name", "last_name", "type", "party_id") SELECT "id", "created_at", "last_updated_at", "legal_name", "display_name", "first_name", "middle_name", "last_name", "type", "party_id" FROM "BaseContact"`,
    )
    await queryRunner.query(`DROP TABLE "BaseContact"`)
    await queryRunner.query(`ALTER TABLE "temporary_BaseContact" RENAME TO "BaseContact"`)
    await queryRunner.query(`CREATE INDEX "IDX_BaseContact_type" ON "BaseContact" ("type")`)
    await queryRunner.query(`DROP INDEX "IDX_PartyRelationship_left_right"`)
    await queryRunner.query(
      `CREATE TABLE "temporary_PartyRelationship" ("id" varchar PRIMARY KEY NOT NULL, "left_id" varchar NOT NULL, "right_id" varchar NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_PartyRelationship_left_id" FOREIGN KEY ("left_id") REFERENCES "Party" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_PartyRelationship_right_id" FOREIGN KEY ("right_id") REFERENCES "Party" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    )
    await queryRunner.query(
      `INSERT INTO "temporary_PartyRelationship"("id", "left_id", "right_id", "created_at", "last_updated_at") SELECT "id", "left_id", "right_id", "created_at", "last_updated_at" FROM "PartyRelationship"`,
    )
    await queryRunner.query(`DROP TABLE "PartyRelationship"`)
    await queryRunner.query(`ALTER TABLE "temporary_PartyRelationship" RENAME TO "PartyRelationship"`)
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_PartyRelationship_left_right" ON "PartyRelationship" ("left_id", "right_id")`)
    await queryRunner.query(
      `CREATE TABLE "ElectronicAddress" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar(255) NOT NULL, "electronic_address" varchar(255) NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "partyId" varchar, CONSTRAINT "FK_ElectronicAddress_partyId" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    )
    await queryRunner.query(
      `CREATE TABLE "PhysicalAddress" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar(255) NOT NULL, "street_name" varchar(255) NOT NULL, "street_number" varchar(255) NOT NULL, "postal_code" varchar(255) NOT NULL, "city_name" varchar(255) NOT NULL, "province_name" varchar(255) NOT NULL, "country_code" varchar(2) NOT NULL, "building_name" varchar(255), "partyId" varchar, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_PhysicalAddressEntity_partyId" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    )
    await queryRunner.query(
      `CREATE TABLE "temporary_Party" ("id" varchar PRIMARY KEY NOT NULL, "uri" varchar(255), "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "party_type_id" varchar NOT NULL, CONSTRAINT "FK_Party_party_type_id" FOREIGN KEY ("party_type_id") REFERENCES "PartyType" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    )
    await queryRunner.query(
      `INSERT INTO "temporary_Party"("id", "uri", "created_at", "last_updated_at", "party_type_id") SELECT "id", "uri", "created_at", "last_updated_at", "party_type_id" FROM "Party"`,
    )
    await queryRunner.query(`DROP TABLE "Party"`)
    await queryRunner.query(`ALTER TABLE "temporary_Party" RENAME TO "Party"`)
    await queryRunner.query(
      `CREATE TABLE "temporary_Identity" ("id" varchar PRIMARY KEY NOT NULL, "alias" varchar(255) NOT NULL, "roles" text NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "partyId" varchar, CONSTRAINT "UQ_Identity_alias" UNIQUE ("alias"), CONSTRAINT "FK_Identity_partyId" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    )
    await queryRunner.query(
      `INSERT INTO "temporary_Identity"("id", "alias", "roles", "created_at", "last_updated_at", "partyId") SELECT "id", "alias", "roles", "created_at", "last_updated_at", "partyId" FROM "Identity"`,
    )
    await queryRunner.query(`DROP TABLE "Identity"`)
    await queryRunner.query(`ALTER TABLE "temporary_Identity" RENAME TO "Identity"`)
    await queryRunner.query(
      `CREATE TABLE "temporary_Connection" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar CHECK( "type" IN ('OIDC','SIOPv2','SIOPv2+OpenID4VP') ) NOT NULL, "identity_id" varchar, CONSTRAINT "REL_Connection_identity_id" UNIQUE ("identity_id"), CONSTRAINT "FK_Connection_identity_id" FOREIGN KEY ("identity_id") REFERENCES "Identity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    )
    await queryRunner.query(`INSERT INTO "temporary_Connection"("id", "type", "identity_id") SELECT "id", "type", "identity_id" FROM "Connection"`)
    await queryRunner.query(`DROP TABLE "Connection"`)
    await queryRunner.query(`ALTER TABLE "temporary_Connection" RENAME TO "Connection"`)
    await queryRunner.query(`DROP INDEX "IDX_BaseConfig_type"`)
    await queryRunner.query(
      `CREATE TABLE "temporary_BaseConfig" ("id" varchar PRIMARY KEY NOT NULL, "identifier" varchar(255), "redirect_url" varchar(255), "session_id" varchar(255), "client_id" varchar(255), "client_secret" varchar(255), "scopes" text, "issuer" varchar(255), "dangerously_allow_insecure_http_requests" boolean, "client_auth_method" text, "type" varchar NOT NULL, "connection_id" varchar, CONSTRAINT "REL_BaseConfig_connection_id" UNIQUE ("connection_id"), CONSTRAINT "FK_BaseConfig_connection_id" FOREIGN KEY ("connection_id") REFERENCES "Connection" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    )
    await queryRunner.query(
      `INSERT INTO "temporary_BaseConfig"("id", "identifier", "redirect_url", "session_id", "client_id", "client_secret", "scopes", "issuer", "dangerously_allow_insecure_http_requests", "client_auth_method", "type", "connection_id") SELECT "id", "identifier", "redirect_url", "session_id", "client_id", "client_secret", "scopes", "issuer", "dangerously_allow_insecure_http_requests", "client_auth_method", "type", "connection_id" FROM "BaseConfig"`,
    )
    await queryRunner.query(`DROP TABLE "BaseConfig"`)
    await queryRunner.query(`ALTER TABLE "temporary_BaseConfig" RENAME TO "BaseConfig"`)
    await queryRunner.query(`CREATE INDEX "IDX_BaseConfig_type" ON "BaseConfig" ("type")`)

    // migrate existing data
    await queryRunner.query(
      `INSERT INTO "BaseConfig"("id", "identifier", "redirect_url", "session_id", "client_id", "client_secret", "scopes", "issuer", "dangerously_allow_insecure_http_requests", "client_auth_method", "type", "connection_id") SELECT "id", "identifier", "redirect_url", "session_id", "client_id", "client_secret", "scopes", "issuer", "dangerously_allow_insecure_http_requests", "client_auth_method", "type", "connectionId" FROM "BaseConfigEntity"`,
    )
    await queryRunner.query(`DROP TABLE "BaseConfigEntity"`)
    await queryRunner.query(
      `INSERT INTO "PartyType"(id, type, origin, name, description, tenant_id, created_at, last_updated_at) VALUES ('3875c12e-fdaa-4ef6-a340-c936e054b627', 'organization', 'INTERNAL', 'Sphereon_default_organization_type', 'sphereon_default_organization', '95e09cfc-c974-4174-86aa-7bf1d5251fb4', datetime('now'), datetime('now'))`,
    )
    await queryRunner.query(
      `INSERT INTO "PartyType"(id, type, origin, name, description, tenant_id, created_at, last_updated_at) VALUES ('7d248798-41ca-4fc1-a130-9934b43d532e', 'naturalPerson', 'INTERNAL', 'Sphereon_default_natural_person_type', 'sphereon_default_natural_person', '95e09cfc-c974-4174-86aa-7bf1d5251fb4', datetime('now'), datetime('now'))`,
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
