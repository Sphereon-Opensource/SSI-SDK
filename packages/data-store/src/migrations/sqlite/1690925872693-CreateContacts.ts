import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateContacts1690925872693 implements MigrationInterface {
  name = 'CreateContacts1690925872693'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "temporary_CorrelationIdentifier" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar CHECK( "type" IN ('did','url') ) NOT NULL, "correlation_id" text NOT NULL, "identityId" varchar, CONSTRAINT "REL_28945c1d57c5feee1d5d1f5451" UNIQUE ("identityId"), CONSTRAINT "UQ_775cbf83c248bc73c42aef55664" UNIQUE ("correlation_id"))`)
    await queryRunner.query(`INSERT INTO "temporary_CorrelationIdentifier"("id", "type", "correlation_id", "identityId") SELECT "id", "type", "correlation_id", "identityId" FROM "CorrelationIdentifier"`)
    await queryRunner.query(`DROP TABLE "CorrelationIdentifier"`)
    await queryRunner.query(`ALTER TABLE "temporary_CorrelationIdentifier" RENAME TO "CorrelationIdentifier"`)
    await queryRunner.query(`CREATE TABLE "temporary_Identity" ("id" varchar PRIMARY KEY NOT NULL, "alias" varchar(255) NOT NULL, "roles" text NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "contactId" varchar, CONSTRAINT "UQ_cbeaf6b68b6dbc9eb8dc3503499" UNIQUE ("alias"))`)
    await queryRunner.query(`INSERT INTO "temporary_Identity"("id", "alias", "roles", "created_at", "last_updated_at", "contactId") SELECT "id", "alias", "roles", "created_at", "last_updated_at", "contactId" FROM "Identity"`)
    await queryRunner.query(`DROP TABLE "Identity"`)
    await queryRunner.query(`ALTER TABLE "temporary_Identity" RENAME TO "Identity"`)
    await queryRunner.query(`CREATE TABLE "temporary_Connection" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar CHECK( "type" IN ('OIDC','SIOPv2','SIOPv2+OpenID4VP') ) NOT NULL, "identityId" varchar, CONSTRAINT "REL_fff3668c112a6863bb8c37519a" UNIQUE ("identityId"))`)
    await queryRunner.query(`INSERT INTO "temporary_Connection"("id", "type", "identityId") SELECT "id", "type", "identityId" FROM "Connection"`)
    await queryRunner.query(`DROP TABLE "Connection"`)
    await queryRunner.query(`ALTER TABLE "temporary_Connection" RENAME TO "Connection"`)
    await queryRunner.query(`CREATE TABLE "temporary_CorrelationIdentifier" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar CHECK( "type" IN ('did','url') ) NOT NULL, "correlation_id" text NOT NULL, "identity_id" varchar, CONSTRAINT "REL_28945c1d57c5feee1d5d1f5451" UNIQUE ("identity_id"), CONSTRAINT "UQ_775cbf83c248bc73c42aef55664" UNIQUE ("correlation_id"))`)
    await queryRunner.query(`INSERT INTO "temporary_CorrelationIdentifier"("id", "type", "correlation_id", "identity_id") SELECT "id", "type", "correlation_id", "identityId" FROM "CorrelationIdentifier"`)
    await queryRunner.query(`DROP TABLE "CorrelationIdentifier"`)
    await queryRunner.query(`ALTER TABLE "temporary_CorrelationIdentifier" RENAME TO "CorrelationIdentifier"`)
    await queryRunner.query(`CREATE TABLE "temporary_Identity" ("id" varchar PRIMARY KEY NOT NULL, "alias" varchar(255) NOT NULL, "roles" text NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "partyId" varchar, CONSTRAINT "UQ_cbeaf6b68b6dbc9eb8dc3503499" UNIQUE ("alias"))`)
    await queryRunner.query(`INSERT INTO "temporary_Identity"("id", "alias", "roles", "created_at", "last_updated_at", "partyId") SELECT "id", "alias", "roles", "created_at", "last_updated_at", "contactId" FROM "Identity"`)
    await queryRunner.query(`DROP TABLE "Identity"`)
    await queryRunner.query(`ALTER TABLE "temporary_Identity" RENAME TO "Identity"`)
    await queryRunner.query(`CREATE TABLE "temporary_Connection" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar CHECK( "type" IN ('OIDC','SIOPv2','SIOPv2+OpenID4VP') ) NOT NULL, "identity_id" varchar, CONSTRAINT "REL_fff3668c112a6863bb8c37519a" UNIQUE ("identity_id"))`)
    await queryRunner.query(`INSERT INTO "temporary_Connection"("id", "type", "identity_id") SELECT "id", "type", "identityId" FROM "Connection"`)
    await queryRunner.query(`DROP TABLE "Connection"`)
    await queryRunner.query(`ALTER TABLE "temporary_Connection" RENAME TO "Connection"`)
    await queryRunner.query(`CREATE TABLE "PartyType" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar CHECK( "type" IN ('naturalPerson','organization') ) NOT NULL, "name" varchar(255) NOT NULL, "description" varchar(255), "tenant_id" varchar(255) NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_06658931a9c40b5c1f7371210a7" UNIQUE ("name"))`)
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_PartyTypeEntity_type_tenantId" ON "PartyType" ("type", "tenant_id")`)
    await queryRunner.query(`CREATE TABLE "BaseContact" ("id" varchar PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "legal_name" varchar(255), "display_name" varchar(255), "first_name" varchar(255), "middle_name" varchar(255), "last_name" varchar(255), "type" varchar NOT NULL, "party_id" varchar, CONSTRAINT "UQ_b8c8005251433839dfc2babf9f8" UNIQUE ("legal_name"), CONSTRAINT "REL_be0b2a601d6a71b07e2a8a5b61" UNIQUE ("party_id"))`)
    await queryRunner.query(`CREATE INDEX "IDX_d265e69d45aa55a9e197f5e626" ON "BaseContact" ("type")`)
    await queryRunner.query(`CREATE TABLE "PartyRelationship" ("id" varchar PRIMARY KEY NOT NULL, "left_id" varchar NOT NULL, "right_id" varchar NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')))`)
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_PartyRelationshipEntity_left_right" ON "PartyRelationship" ("left_id", "right_id")`)
    await queryRunner.query(`CREATE TABLE "ElectronicAddress" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar(255) NOT NULL, "electronic_address" varchar(255) NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "partyId" varchar)`)
    await queryRunner.query(`CREATE TABLE "Party" ("id" varchar PRIMARY KEY NOT NULL, "uri" varchar(255) NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "party_type_id" varchar NOT NULL)`)
    await queryRunner.query(`CREATE TABLE "BaseConfig" ("id" varchar PRIMARY KEY NOT NULL, "identifier" varchar(255), "redirect_url" varchar(255), "session_id" varchar(255), "client_id" varchar(255), "client_secret" varchar(255), "scopes" text, "issuer" varchar(255), "dangerously_allow_insecure_http_requests" boolean, "client_auth_method" text, "type" varchar NOT NULL, "connection_id" varchar, CONSTRAINT "REL_4b10e0398e0bc003b479a21f53" UNIQUE ("connection_id"))`)
    await queryRunner.query(`CREATE INDEX "IDX_5624e2253276217cf609b044b1" ON "BaseConfig" ("type")`)
    await queryRunner.query(`CREATE TABLE "temporary_CorrelationIdentifier" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar CHECK( "type" IN ('did','url') ) NOT NULL, "correlation_id" text NOT NULL, "identity_id" varchar, CONSTRAINT "REL_28945c1d57c5feee1d5d1f5451" UNIQUE ("identity_id"), CONSTRAINT "UQ_775cbf83c248bc73c42aef55664" UNIQUE ("correlation_id"), CONSTRAINT "FK_d98b8f355649e9d090ee2a915ca" FOREIGN KEY ("identity_id") REFERENCES "Identity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`)
    await queryRunner.query(`INSERT INTO "temporary_CorrelationIdentifier"("id", "type", "correlation_id", "identity_id") SELECT "id", "type", "correlation_id", "identity_id" FROM "CorrelationIdentifier"`)
    await queryRunner.query(`DROP TABLE "CorrelationIdentifier"`)
    await queryRunner.query(`ALTER TABLE "temporary_CorrelationIdentifier" RENAME TO "CorrelationIdentifier"`)
    await queryRunner.query(`DROP INDEX "IDX_d265e69d45aa55a9e197f5e626"`)
    await queryRunner.query(`CREATE TABLE "temporary_BaseContact" ("id" varchar PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "legal_name" varchar(255), "display_name" varchar(255), "first_name" varchar(255), "middle_name" varchar(255), "last_name" varchar(255), "type" varchar NOT NULL, "party_id" varchar, CONSTRAINT "UQ_b8c8005251433839dfc2babf9f8" UNIQUE ("legal_name"), CONSTRAINT "REL_be0b2a601d6a71b07e2a8a5b61" UNIQUE ("party_id"), CONSTRAINT "FK_be0b2a601d6a71b07e2a8a5b61e" FOREIGN KEY ("party_id") REFERENCES "Party" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`)
    await queryRunner.query(`INSERT INTO "temporary_BaseContact"("id", "created_at", "last_updated_at", "legal_name", "display_name", "first_name", "middle_name", "last_name", "type", "party_id") SELECT "id", "created_at", "last_updated_at", "legal_name", "display_name", "first_name", "middle_name", "last_name", "type", "party_id" FROM "BaseContact"`)
    await queryRunner.query(`DROP TABLE "BaseContact"`)
    await queryRunner.query(`ALTER TABLE "temporary_BaseContact" RENAME TO "BaseContact"`)
    await queryRunner.query(`CREATE INDEX "IDX_d265e69d45aa55a9e197f5e626" ON "BaseContact" ("type")`)
    await queryRunner.query(`DROP INDEX "IDX_PartyRelationshipEntity_left_right"`)
    await queryRunner.query(`CREATE TABLE "temporary_PartyRelationship" ("id" varchar PRIMARY KEY NOT NULL, "left_id" varchar NOT NULL, "right_id" varchar NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_c3db1bd42ed96c5164b2e6276bf" FOREIGN KEY ("left_id") REFERENCES "Party" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_f366006d2ad5adbe3632277f1c0" FOREIGN KEY ("right_id") REFERENCES "Party" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`)
    await queryRunner.query(`INSERT INTO "temporary_PartyRelationship"("id", "left_id", "right_id", "created_at", "last_updated_at") SELECT "id", "left_id", "right_id", "created_at", "last_updated_at" FROM "PartyRelationship"`)
    await queryRunner.query(`DROP TABLE "PartyRelationship"`)
    await queryRunner.query(`ALTER TABLE "temporary_PartyRelationship" RENAME TO "PartyRelationship"`)
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_PartyRelationshipEntity_left_right" ON "PartyRelationship" ("left_id", "right_id")`)
    await queryRunner.query(`CREATE TABLE "temporary_ElectronicAddress" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar(255) NOT NULL, "electronic_address" varchar(255) NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "partyId" varchar, CONSTRAINT "FK_672ac311680d9c366405bb5737c" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`)
    await queryRunner.query(`INSERT INTO "temporary_ElectronicAddress"("id", "type", "electronic_address", "created_at", "last_updated_at", "partyId") SELECT "id", "type", "electronic_address", "created_at", "last_updated_at", "partyId" FROM "ElectronicAddress"`)
    await queryRunner.query(`DROP TABLE "ElectronicAddress"`)
    await queryRunner.query(`ALTER TABLE "temporary_ElectronicAddress" RENAME TO "ElectronicAddress"`)
    await queryRunner.query(`CREATE TABLE "temporary_Party" ("id" varchar PRIMARY KEY NOT NULL, "uri" varchar(255) NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "party_type_id" varchar NOT NULL, CONSTRAINT "FK_d6b87c0830068c6d396a501e3d1" FOREIGN KEY ("party_type_id") REFERENCES "PartyType" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`)
    await queryRunner.query(`INSERT INTO "temporary_Party"("id", "uri", "created_at", "last_updated_at", "party_type_id") SELECT "id", "uri", "created_at", "last_updated_at", "party_type_id" FROM "Party"`)
    await queryRunner.query(`DROP TABLE "Party"`)
    await queryRunner.query(`ALTER TABLE "temporary_Party" RENAME TO "Party"`)
    await queryRunner.query(`CREATE TABLE "temporary_Identity" ("id" varchar PRIMARY KEY NOT NULL, "alias" varchar(255) NOT NULL, "roles" text NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "partyId" varchar, CONSTRAINT "UQ_cbeaf6b68b6dbc9eb8dc3503499" UNIQUE ("alias"), CONSTRAINT "FK_916e4ef6ee2f24c5c88bdc9dfbb" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`)
    await queryRunner.query(`INSERT INTO "temporary_Identity"("id", "alias", "roles", "created_at", "last_updated_at", "partyId") SELECT "id", "alias", "roles", "created_at", "last_updated_at", "partyId" FROM "Identity"`)
    await queryRunner.query(`DROP TABLE "Identity"`)
    await queryRunner.query(`ALTER TABLE "temporary_Identity" RENAME TO "Identity"`)
    await queryRunner.query(`CREATE TABLE "temporary_Connection" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar CHECK( "type" IN ('OIDC','SIOPv2','SIOPv2+OpenID4VP') ) NOT NULL, "identity_id" varchar, CONSTRAINT "REL_fff3668c112a6863bb8c37519a" UNIQUE ("identity_id"), CONSTRAINT "FK_360ccf2d714878339680a197d26" FOREIGN KEY ("identity_id") REFERENCES "Identity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`)
    await queryRunner.query(`INSERT INTO "temporary_Connection"("id", "type", "identity_id") SELECT "id", "type", "identity_id" FROM "Connection"`)
    await queryRunner.query(`DROP TABLE "Connection"`)
    await queryRunner.query(`ALTER TABLE "temporary_Connection" RENAME TO "Connection"`)
    await queryRunner.query(`DROP INDEX "IDX_5624e2253276217cf609b044b1"`)
    await queryRunner.query(`CREATE TABLE "temporary_BaseConfig" ("id" varchar PRIMARY KEY NOT NULL, "identifier" varchar(255), "redirect_url" varchar(255), "session_id" varchar(255), "client_id" varchar(255), "client_secret" varchar(255), "scopes" text, "issuer" varchar(255), "dangerously_allow_insecure_http_requests" boolean, "client_auth_method" text, "type" varchar NOT NULL, "connection_id" varchar, CONSTRAINT "REL_4b10e0398e0bc003b479a21f53" UNIQUE ("connection_id"), CONSTRAINT "FK_4b10e0398e0bc003b479a21f53e" FOREIGN KEY ("connection_id") REFERENCES "Connection" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`)
    await queryRunner.query(`INSERT INTO "temporary_BaseConfig"("id", "identifier", "redirect_url", "session_id", "client_id", "client_secret", "scopes", "issuer", "dangerously_allow_insecure_http_requests", "client_auth_method", "type", "connection_id") SELECT "id", "identifier", "redirect_url", "session_id", "client_id", "client_secret", "scopes", "issuer", "dangerously_allow_insecure_http_requests", "client_auth_method", "type", "connection_id" FROM "BaseConfig"`)
    await queryRunner.query(`DROP TABLE "BaseConfig"`)
    await queryRunner.query(`ALTER TABLE "temporary_BaseConfig" RENAME TO "BaseConfig"`)
    await queryRunner.query(`CREATE INDEX "IDX_5624e2253276217cf609b044b1" ON "BaseConfig" ("type")`)

    // migrate existing data
    await queryRunner.query(`INSERT INTO "BaseConfig"("id", "identifier", "redirect_url", "session_id", "client_id", "client_secret", "scopes", "issuer", "dangerously_allow_insecure_http_requests", "client_auth_method", "type", "connection_id") SELECT "id", "identifier", "redirect_url", "session_id", "client_id", "client_secret", "scopes", "issuer", "dangerously_allow_insecure_http_requests", "client_auth_method", "type", "connection_id" FROM "BaseConfigEntity"`)
    await queryRunner.query(`DROP TABLE "BaseConfigEntity"`)
    await queryRunner.query(`INSERT INTO "PartyType"(id, type, name, description, tenant_id, created_at, last_updated_at) VALUES ('3875c12e-fdaa-4ef6-a340-c936e054b627', 'organization', 'Sphereon_default_type', 'sphereon_default_organization', '95e09cfc-c974-4174-86aa-7bf1d5251fb4', datetime('now'), datetime('now'))`)
    await queryRunner.query(`INSERT INTO "Party"(id, uri, created_at, last_updated_at, party_type_id) SELECT id, uri, created_at, last_updated_at, '3875c12e-fdaa-4ef6-a340-c936e054b627' FROM "Contact"`)
    await queryRunner.query(`INSERT INTO "BaseContact"(id, legal_name, display_name, party_id, created_at, last_updated_at, type) SELECT id, name, alias, id, created_at, last_updated_at, 'Organization' FROM "Contact"`)
    await queryRunner.query(`DROP TABLE "Contact"`)




    // await queryRunner.query(`DROP INDEX "IDX_BaseConfigEntity_type"`)
    // await queryRunner.query(
    //   `CREATE TABLE "temporary_BaseConfigEntity" ("id" varchar PRIMARY KEY NOT NULL, "client_id" varchar(255), "client_secret" varchar(255), "scopes" text, "issuer" varchar(255), "redirect_url" text, "dangerously_allow_insecure_http_requests" boolean, "client_auth_method" text, "identifier" varchar(255), "session_id" varchar(255), "type" varchar NOT NULL, "connectionId" varchar, CONSTRAINT "REL_BaseConfig_connectionId" UNIQUE ("connectionId"))`
    // )
    // await queryRunner.query(
    //   `INSERT INTO "temporary_BaseConfigEntity"("id", "client_id", "client_secret", "scopes", "issuer", "redirect_url", "dangerously_allow_insecure_http_requests", "client_auth_method", "identifier", "session_id", "type", "connectionId") SELECT "id", "client_id", "client_secret", "scopes", "issuer", "redirect_url", "dangerously_allow_insecure_http_requests", "client_auth_method", "identifier", "session_id", "type", "connectionId" FROM "BaseConfigEntity"`
    // )
    // await queryRunner.query(`DROP TABLE "BaseConfigEntity"`)
    // await queryRunner.query(`ALTER TABLE "temporary_BaseConfigEntity" RENAME TO "BaseConfigEntity"`)
    // await queryRunner.query(`CREATE INDEX "IDX_BaseConfigEntity_type" ON "BaseConfigEntity" ("type")`)
    // await queryRunner.query(
    //   `CREATE TABLE "temporary_CorrelationIdentifier" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar CHECK( "type" IN ('did','url') ) NOT NULL, "correlation_id" text NOT NULL, "identityId" varchar, CONSTRAINT "REL_CorrelationIdentifier_identityId" UNIQUE ("identityId"), CONSTRAINT "UQ_Correlation_id" UNIQUE ("correlation_id"))`
    // )
    // await queryRunner.query(
    //   `INSERT INTO "temporary_CorrelationIdentifier"("id", "type", "correlation_id", "identityId") SELECT "id", "type", "correlation_id", "identityId" FROM "CorrelationIdentifier"`
    // )
    // await queryRunner.query(`DROP TABLE "CorrelationIdentifier"`)
    // await queryRunner.query(`ALTER TABLE "temporary_CorrelationIdentifier" RENAME TO "CorrelationIdentifier"`)
    // await queryRunner.query(
    //   `CREATE TABLE "temporary_IdentityMetadata" ("id" varchar PRIMARY KEY NOT NULL, "label" varchar(255) NOT NULL, "value" varchar(255) NOT NULL, "identityId" varchar)`
    // )
    // await queryRunner.query(
    //   `INSERT INTO "temporary_IdentityMetadata"("id", "label", "value", "identityId") SELECT "id", "label", "value", "identityId" FROM "IdentityMetadata"`
    // )
    // await queryRunner.query(`DROP TABLE "IdentityMetadata"`)
    // await queryRunner.query(`ALTER TABLE "temporary_IdentityMetadata" RENAME TO "IdentityMetadata"`)
    // await queryRunner.query(
    //   `CREATE TABLE "temporary_Identity" ("id" varchar PRIMARY KEY NOT NULL, "alias" varchar(255) NOT NULL, "roles" text, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "contactId" varchar, CONSTRAINT "UQ_Alias" UNIQUE ("alias"))`
    // )
    // await queryRunner.query(
    //   `INSERT INTO "temporary_Identity"("id", "alias", "roles", "created_at", "last_updated_at", "contactId") SELECT "id", "alias", "roles", "created_at", "last_updated_at", "contactId" FROM "Identity"`
    // )
    // await queryRunner.query(`DROP TABLE "Identity"`)
    // await queryRunner.query(`ALTER TABLE "temporary_Identity" RENAME TO "Identity"`)
    // await queryRunner.query(
    //   `CREATE TABLE "temporary_Connection" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar CHECK( "type" IN ('OIDC','SIOPv2','SIOPv2+OpenID4VP') ) NOT NULL, "identityId" varchar, CONSTRAINT "REL_Connection_identityId" UNIQUE ("identityId"))`
    // )
    // await queryRunner.query(`INSERT INTO "temporary_Connection"("id", "type", "identityId") SELECT "id", "type", "identityId" FROM "Connection"`)
    // await queryRunner.query(`DROP TABLE "Connection"`)
    // await queryRunner.query(`ALTER TABLE "temporary_Connection" RENAME TO "Connection"`)
    // await queryRunner.query(`DROP INDEX "IDX_BaseConfigEntity_type"`)
    // await queryRunner.query(
    //   `CREATE TABLE "temporary_Identity" ("id" varchar PRIMARY KEY NOT NULL, "alias" varchar(255) NOT NULL, "roles" text, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "contactId" varchar, CONSTRAINT "UQ_Alias" UNIQUE ("alias"))`
    // )
    // await queryRunner.query(
    //   `INSERT INTO "temporary_Identity"("id", "alias", "roles", "created_at", "last_updated_at", "contactId") SELECT "id", "alias", "roles", "created_at", "last_updated_at", "contactId" FROM "Identity"`
    // )
    // await queryRunner.query(`DROP TABLE "Identity"`)
    // await queryRunner.query(`ALTER TABLE "temporary_Identity" RENAME TO "Identity"`)
    // await queryRunner.query(
    //   `CREATE TABLE "ContactType" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar CHECK( "type" IN ('person','organization') ) NOT NULL, "name" varchar(255) NOT NULL, "description" varchar(255), "tenantId" varchar(255) NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_2229e0d8c1e6817efcc982a6dde" UNIQUE ("name"))`
    // )
    // await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1a1fa2aa0a56649427e427a41f" ON "ContactType" ("type", "tenantId")`)
    // await queryRunner.query(
    //   `CREATE TABLE "ContactOwner" ("id" varchar PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "firstName" varchar(255), "middleName" varchar(255), "lastName" varchar(255), "displayName" varchar(255), "legalName" varchar(255), "type" varchar NOT NULL, "contactId" varchar, CONSTRAINT "UQ_9177af8a51a2a0598d3a8c68e1e" UNIQUE ("displayName"), CONSTRAINT "UQ_91bf22d2597ff429ece6ae807aa" UNIQUE ("legalName"), CONSTRAINT "UQ_9177af8a51a2a0598d3a8c68e1e" UNIQUE ("displayName"), CONSTRAINT "REL_26ce21b29da1426fa1198b947e" UNIQUE ("contactId"))`
    // )
    // await queryRunner.query(`CREATE INDEX "IDX_e50c368daf85e7ae54585b0f7b" ON "ContactOwner" ("type")`)
    // await queryRunner.query(
    //   `CREATE TABLE "ContactRelationship" ("id" varchar PRIMARY KEY NOT NULL, "leftId" varchar NOT NULL, "rightId" varchar NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')))`
    // )
    // await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ContactRelationshipEntity_left_right" ON "ContactRelationship" ("leftId", "rightId")`)
    // await queryRunner.query(
    //   `CREATE TABLE "temporary_Contact" ("id" varchar PRIMARY KEY NOT NULL, "uri" varchar(255) NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')))`
    // )
    // await queryRunner.query(
    //   `INSERT INTO "temporary_Contact"("id", "uri", "created_at", "last_updated_at") SELECT "id", "uri", "created_at", "last_updated_at" FROM "Contact"`
    // )
    // await queryRunner.query(`DROP TABLE "Contact"`)
    // await queryRunner.query(`ALTER TABLE "temporary_Contact" RENAME TO "Contact"`)
    // await queryRunner.query(
    //   `CREATE TABLE "temporary_Contact" ("id" varchar PRIMARY KEY NOT NULL, "uri" varchar(255) NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "contactTypeId" varchar NOT NULL)`
    // )
    // await queryRunner.query(
    //   `INSERT INTO "temporary_Contact"("id", "uri", "created_at", "last_updated_at") SELECT "id", "uri", "created_at", "last_updated_at" FROM "Contact"`
    // )
    // await queryRunner.query(`DROP TABLE "Contact"`)
    // await queryRunner.query(`ALTER TABLE "temporary_Contact" RENAME TO "Contact"`)
    // await queryRunner.query(
    //   `CREATE TABLE "temporary_Identity" ("id" varchar PRIMARY KEY NOT NULL, "alias" varchar(255) NOT NULL, "roles" text NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "contactId" varchar, CONSTRAINT "UQ_Alias" UNIQUE ("alias"))`
    // )
    // await queryRunner.query(
    //   `INSERT INTO "temporary_Identity"("id", "alias", "roles", "created_at", "last_updated_at", "contactId") SELECT "id", "alias", "roles", "created_at", "last_updated_at", "contactId" FROM "Identity"`
    // )
    // await queryRunner.query(`DROP TABLE "Identity"`)
    // await queryRunner.query(`ALTER TABLE "temporary_Identity" RENAME TO "Identity"`)
    // await queryRunner.query(`CREATE INDEX "IDX_228953a09ee91bbac6e28b7345" ON "BaseConfigEntity" ("type")`)
    // await queryRunner.query(`DROP INDEX "IDX_228953a09ee91bbac6e28b7345"`)
    // await queryRunner.query(
    //   `CREATE TABLE "temporary_BaseConfigEntity" ("id" varchar PRIMARY KEY NOT NULL, "client_id" varchar(255), "client_secret" varchar(255), "scopes" text, "issuer" varchar(255), "redirect_url" text, "dangerously_allow_insecure_http_requests" boolean, "client_auth_method" text, "identifier" varchar(255), "session_id" varchar(255), "type" varchar NOT NULL, "connectionId" varchar, CONSTRAINT "REL_BaseConfig_connectionId" UNIQUE ("connectionId"), CONSTRAINT "FK_0ab3b33e0a87e1706025e63d8a9" FOREIGN KEY ("connectionId") REFERENCES "Connection" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    // )
    // await queryRunner.query(
    //   `INSERT INTO "temporary_BaseConfigEntity"("id", "client_id", "client_secret", "scopes", "issuer", "redirect_url", "dangerously_allow_insecure_http_requests", "client_auth_method", "identifier", "session_id", "type", "connectionId") SELECT "id", "client_id", "client_secret", "scopes", "issuer", "redirect_url", "dangerously_allow_insecure_http_requests", "client_auth_method", "identifier", "session_id", "type", "connectionId" FROM "BaseConfigEntity"`
    // )
    // await queryRunner.query(`DROP TABLE "BaseConfigEntity"`)
    // await queryRunner.query(`ALTER TABLE "temporary_BaseConfigEntity" RENAME TO "BaseConfigEntity"`)
    // await queryRunner.query(`CREATE INDEX "IDX_228953a09ee91bbac6e28b7345" ON "BaseConfigEntity" ("type")`)
    // await queryRunner.query(
    //   `CREATE TABLE "temporary_CorrelationIdentifier" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar CHECK( "type" IN ('did','url') ) NOT NULL, "correlation_id" text NOT NULL, "identityId" varchar, CONSTRAINT "REL_CorrelationIdentifier_identityId" UNIQUE ("identityId"), CONSTRAINT "UQ_Correlation_id" UNIQUE ("correlation_id"), CONSTRAINT "FK_28945c1d57c5feee1d5d1f54510" FOREIGN KEY ("identityId") REFERENCES "Identity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    // )
    // await queryRunner.query(
    //   `INSERT INTO "temporary_CorrelationIdentifier"("id", "type", "correlation_id", "identityId") SELECT "id", "type", "correlation_id", "identityId" FROM "CorrelationIdentifier"`
    // )
    // await queryRunner.query(`DROP TABLE "CorrelationIdentifier"`)
    // await queryRunner.query(`ALTER TABLE "temporary_CorrelationIdentifier" RENAME TO "CorrelationIdentifier"`)
    // await queryRunner.query(
    //   `CREATE TABLE "temporary_IdentityMetadata" ("id" varchar PRIMARY KEY NOT NULL, "label" varchar(255) NOT NULL, "value" varchar(255) NOT NULL, "identityId" varchar, CONSTRAINT "FK_e22568cc3d201c0131b87186117" FOREIGN KEY ("identityId") REFERENCES "Identity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    // )
    // await queryRunner.query(
    //   `INSERT INTO "temporary_IdentityMetadata"("id", "label", "value", "identityId") SELECT "id", "label", "value", "identityId" FROM "IdentityMetadata"`
    // )
    // await queryRunner.query(`DROP TABLE "IdentityMetadata"`)
    // await queryRunner.query(`ALTER TABLE "temporary_IdentityMetadata" RENAME TO "IdentityMetadata"`)
    // await queryRunner.query(`DROP INDEX "IDX_e50c368daf85e7ae54585b0f7b"`)
    // await queryRunner.query(
    //   `CREATE TABLE "temporary_ContactOwner" ("id" varchar PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "firstName" varchar(255), "middleName" varchar(255), "lastName" varchar(255), "displayName" varchar(255), "legalName" varchar(255), "type" varchar NOT NULL, "contactId" varchar, CONSTRAINT "UQ_9177af8a51a2a0598d3a8c68e1e" UNIQUE ("displayName"), CONSTRAINT "UQ_91bf22d2597ff429ece6ae807aa" UNIQUE ("legalName"), CONSTRAINT "UQ_9177af8a51a2a0598d3a8c68e1e" UNIQUE ("displayName"), CONSTRAINT "REL_26ce21b29da1426fa1198b947e" UNIQUE ("contactId"), CONSTRAINT "FK_26ce21b29da1426fa1198b947e1" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    // )
    // await queryRunner.query(
    //   `INSERT INTO "temporary_ContactOwner"("id", "created_at", "last_updated_at", "firstName", "middleName", "lastName", "displayName", "legalName", "type", "contactId") SELECT "id", "created_at", "last_updated_at", "firstName", "middleName", "lastName", "displayName", "legalName", "type", "contactId" FROM "ContactOwner"`
    // )
    // await queryRunner.query(`DROP TABLE "ContactOwner"`)
    // await queryRunner.query(`ALTER TABLE "temporary_ContactOwner" RENAME TO "ContactOwner"`)
    // await queryRunner.query(`CREATE INDEX "IDX_e50c368daf85e7ae54585b0f7b" ON "ContactOwner" ("type")`)
    // await queryRunner.query(`DROP INDEX "IDX_ContactRelationshipEntity_left_right"`)
    // await queryRunner.query(
    //   `CREATE TABLE "temporary_ContactRelationship" ("id" varchar PRIMARY KEY NOT NULL, "leftId" varchar NOT NULL, "rightId" varchar NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_24a7bc0595cc5da51c91e1bee62" FOREIGN KEY ("leftId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_e673c9f78f3c7670a75c0ea7710" FOREIGN KEY ("rightId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    // )
    // await queryRunner.query(
    //   `INSERT INTO "temporary_ContactRelationship"("id", "leftId", "rightId", "created_at", "last_updated_at") SELECT "id", "leftId", "rightId", "created_at", "last_updated_at" FROM "ContactRelationship"`
    // )
    // await queryRunner.query(`DROP TABLE "ContactRelationship"`)
    // await queryRunner.query(`ALTER TABLE "temporary_ContactRelationship" RENAME TO "ContactRelationship"`)
    // await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ContactRelationshipEntity_left_right" ON "ContactRelationship" ("leftId", "rightId")`)
    // await queryRunner.query(
    //   `CREATE TABLE "temporary_Contact" ("id" varchar PRIMARY KEY NOT NULL, "uri" varchar(255) NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "contactTypeId" varchar NOT NULL, CONSTRAINT "FK_a992c5cdc48d0bc105d0338f982" FOREIGN KEY ("contactTypeId") REFERENCES "ContactType" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`
    // )
    // await queryRunner.query(
    //   `INSERT INTO "temporary_Contact"("id", "uri", "created_at", "last_updated_at", "contactTypeId") SELECT "id", "uri", "created_at", "last_updated_at", "contactTypeId" FROM "Contact"`
    // )
    // await queryRunner.query(`DROP TABLE "Contact"`)
    // await queryRunner.query(`ALTER TABLE "temporary_Contact" RENAME TO "Contact"`)
    // await queryRunner.query(
    //   `CREATE TABLE "temporary_Identity" ("id" varchar PRIMARY KEY NOT NULL, "alias" varchar(255) NOT NULL, "roles" text NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "contactId" varchar, CONSTRAINT "UQ_Alias" UNIQUE ("alias"), CONSTRAINT "FK_70ac2a54e2041b7914613204e3d" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    // )
    // await queryRunner.query(
    //   `INSERT INTO "temporary_Identity"("id", "alias", "roles", "created_at", "last_updated_at", "contactId") SELECT "id", "alias", "roles", "created_at", "last_updated_at", "contactId" FROM "Identity"`
    // )
    // await queryRunner.query(`DROP TABLE "Identity"`)
    // await queryRunner.query(`ALTER TABLE "temporary_Identity" RENAME TO "Identity"`)
    // await queryRunner.query(
    //   `CREATE TABLE "temporary_Connection" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar CHECK( "type" IN ('OIDC','SIOPv2','SIOPv2+OpenID4VP') ) NOT NULL, "identityId" varchar, CONSTRAINT "REL_Connection_identityId" UNIQUE ("identityId"), CONSTRAINT "FK_fff3668c112a6863bb8c37519a0" FOREIGN KEY ("identityId") REFERENCES "Identity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    // )
    // await queryRunner.query(`INSERT INTO "temporary_Connection"("id", "type", "identityId") SELECT "id", "type", "identityId" FROM "Connection"`)
    // await queryRunner.query(`DROP TABLE "Connection"`)
    // await queryRunner.query(`ALTER TABLE "temporary_Connection" RENAME TO "Connection"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
