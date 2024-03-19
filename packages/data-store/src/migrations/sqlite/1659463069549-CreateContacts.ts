import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateContacts1659463069549 implements MigrationInterface {
  name = 'CreateContacts1659463069549'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "BaseConfigEntity" ("id" varchar PRIMARY KEY NOT NULL, "client_id" varchar(255), "client_secret" varchar(255), "scopes" text, "issuer" varchar(255), "redirect_url" text, "dangerously_allow_insecure_http_requests" boolean, "client_auth_method" text, "identifier" varchar(255), "session_id" varchar(255), "type" varchar NOT NULL, "connectionId" varchar, CONSTRAINT "REL_BaseConfig_connectionId" UNIQUE ("connectionId"))`,
    )
    await queryRunner.query(`CREATE INDEX "IDX_BaseConfigEntity_type" ON "BaseConfigEntity" ("type")`)
    await queryRunner.query(
      `CREATE TABLE "CorrelationIdentifier" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar CHECK( "type" IN ('did','url') ) NOT NULL, "correlation_id" text NOT NULL, "identityId" varchar, CONSTRAINT "UQ_Correlation_id" UNIQUE ("correlation_id"), CONSTRAINT "REL_CorrelationIdentifier_identityId" UNIQUE ("identityId"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "Contact" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar(255) NOT NULL, "alias" varchar(255) NOT NULL, "uri" varchar(255) NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_Name" UNIQUE ("name"), CONSTRAINT "UQ_Alias" UNIQUE ("alias"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "IdentityMetadata" ("id" varchar PRIMARY KEY NOT NULL, "label" varchar(255) NOT NULL, "value" varchar(255) NOT NULL, "identityId" varchar)`,
    )
    await queryRunner.query(
      `CREATE TABLE "Identity" ("id" varchar PRIMARY KEY NOT NULL, "alias" varchar(255) NOT NULL, "roles" text, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "contactId" varchar, CONSTRAINT "UQ_Alias" UNIQUE ("alias"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "Connection" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar CHECK( "type" IN ('OIDC','SIOPv2','SIOPv2+OpenID4VP') ) NOT NULL, "identityId" varchar, CONSTRAINT "REL_Connection_identityId" UNIQUE ("identityId"))`,
    )
    await queryRunner.query(`DROP INDEX "IDX_BaseConfigEntity_type"`)
    await queryRunner.query(
      `CREATE TABLE "temporary_BaseConfigEntity" ("id" varchar PRIMARY KEY NOT NULL, "client_id" varchar(255), "client_secret" varchar(255), "scopes" text, "issuer" varchar(255), "redirect_url" text, "dangerously_allow_insecure_http_requests" boolean, "client_auth_method" text, "identifier" varchar(255), "session_id" varchar(255), "type" varchar NOT NULL, "connectionId" varchar, CONSTRAINT "REL_BaseConfig_connectionId" UNIQUE ("connectionId"), CONSTRAINT "FK_BaseConfig_connectionId" FOREIGN KEY ("connectionId") REFERENCES "Connection" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    )
    await queryRunner.query(
      `INSERT INTO "temporary_BaseConfigEntity"("id", "client_id", "client_secret", "scopes", "issuer", "redirect_url", "dangerously_allow_insecure_http_requests", "client_auth_method", "identifier", "session_id", "type", "connectionId") SELECT "id", "client_id", "client_secret", "scopes", "issuer", "redirect_url", "dangerously_allow_insecure_http_requests", "client_auth_method", "identifier", "session_id", "type", "connectionId" FROM "BaseConfigEntity"`,
    )
    await queryRunner.query(`DROP TABLE "BaseConfigEntity"`)
    await queryRunner.query(`ALTER TABLE "temporary_BaseConfigEntity" RENAME TO "BaseConfigEntity"`)
    await queryRunner.query(`CREATE INDEX "IDX_BaseConfigEntity_type" ON "BaseConfigEntity" ("type")`)
    await queryRunner.query(
      `CREATE TABLE "temporary_CorrelationIdentifier" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar CHECK( "type" IN ('did','url') ) NOT NULL, "correlation_id" text NOT NULL, "identityId" varchar, CONSTRAINT "UQ_Correlation_id" UNIQUE ("correlation_id"), CONSTRAINT "REL_CorrelationIdentifier_identityId" UNIQUE ("identityId"), CONSTRAINT "FK_CorrelationIdentifier_identityId" FOREIGN KEY ("identityId") REFERENCES "Identity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    )
    await queryRunner.query(
      `INSERT INTO "temporary_CorrelationIdentifier"("id", "type", "correlation_id", "identityId") SELECT "id", "type", "correlation_id", "identityId" FROM "CorrelationIdentifier"`,
    )
    await queryRunner.query(`DROP TABLE "CorrelationIdentifier"`)
    await queryRunner.query(`ALTER TABLE "temporary_CorrelationIdentifier" RENAME TO "CorrelationIdentifier"`)
    await queryRunner.query(
      `CREATE TABLE "temporary_IdentityMetadata" ("id" varchar PRIMARY KEY NOT NULL, "label" varchar(255) NOT NULL, "value" varchar(255) NOT NULL, "identityId" varchar, CONSTRAINT "FK_IdentityMetadata_identityId" FOREIGN KEY ("identityId") REFERENCES "Identity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    )
    await queryRunner.query(
      `INSERT INTO "temporary_IdentityMetadata"("id", "label", "value", "identityId") SELECT "id", "label", "value", "identityId" FROM "IdentityMetadata"`,
    )
    await queryRunner.query(`DROP TABLE "IdentityMetadata"`)
    await queryRunner.query(`ALTER TABLE "temporary_IdentityMetadata" RENAME TO "IdentityMetadata"`)
    await queryRunner.query(
      `CREATE TABLE "temporary_Identity" ("id" varchar PRIMARY KEY NOT NULL, "alias" varchar(255) NOT NULL, "roles" text, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "contactId" varchar, CONSTRAINT "UQ_Alias" UNIQUE ("alias"), CONSTRAINT "FK_Identity_contactId" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    )
    await queryRunner.query(
      `INSERT INTO "temporary_Identity"("id", "alias", "roles", "created_at", "last_updated_at", "contactId") SELECT "id", "alias", "roles", "created_at", "last_updated_at", "contactId" FROM "Identity"`,
    )
    await queryRunner.query(`DROP TABLE "Identity"`)
    await queryRunner.query(`ALTER TABLE "temporary_Identity" RENAME TO "Identity"`)
    await queryRunner.query(
      `CREATE TABLE "temporary_Connection" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar CHECK( "type" IN ('OIDC','SIOPv2','SIOPv2+OpenID4VP') ) NOT NULL, "identityId" varchar, CONSTRAINT "REL_Connection_identityId" UNIQUE ("identityId"), CONSTRAINT "FK_Connection_identityId" FOREIGN KEY ("identityId") REFERENCES "Identity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    )
    await queryRunner.query(`INSERT INTO "temporary_Connection"("id", "type", "identityId") SELECT "id", "type", "identityId" FROM "Connection"`)
    await queryRunner.query(`DROP TABLE "Connection"`)
    await queryRunner.query(`ALTER TABLE "temporary_Connection" RENAME TO "Connection"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Connection" RENAME TO "temporary_Connection"`)
    await queryRunner.query(
      `CREATE TABLE "Connection" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar CHECK( "type" IN ('OIDC','SIOPv2','SIOPv2+OpenID4VP') ) NOT NULL, "identityId" varchar, CONSTRAINT "REL_Connection_identityId" UNIQUE ("identityId"))`,
    )
    await queryRunner.query(`INSERT INTO "Connection"("id", "type", "identityId") SELECT "id", "type", "identityId" FROM "Connection"`)
    await queryRunner.query(`DROP TABLE "temporary_Connection"`)

    await queryRunner.query(`ALTER TABLE "Identity" RENAME TO "temporary_Identity"`)
    await queryRunner.query(
      `CREATE TABLE "Identity" ("id" varchar PRIMARY KEY NOT NULL, "alias" varchar(255) NOT NULL, "roles" text, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "contactId" varchar, CONSTRAINT "UQ_Alias" UNIQUE ("alias"))`,
    )
    await queryRunner.query(
      `INSERT INTO "Identity"("id", "alias", "roles","created_at", "last_updated_at", "contactId") SELECT "id", "alias", "roles","created_at", "last_updated_at", "contactId" FROM "Identity"`,
    )
    await queryRunner.query(`DROP TABLE "temporary_Identity"`)

    await queryRunner.query(`ALTER TABLE "IdentityMetadata" RENAME TO "temporary_IdentityMetadata"`)
    await queryRunner.query(
      `CREATE TABLE "IdentityMetadata" ("id" varchar PRIMARY KEY NOT NULL, "label" varchar(255) NOT NULL, "value" varchar(255) NOT NULL, "identityId" varchar)`,
    )
    await queryRunner.query(
      `INSERT INTO "IdentityMetadata"("id", "label", "value", "identityId") SELECT "id", "label", "value", "identityId" FROM "IdentityMetadata"`,
    )
    await queryRunner.query(`DROP TABLE "temporary_IdentityMetadata"`)

    await queryRunner.query(`ALTER TABLE "CorrelationIdentifier" RENAME TO "temporary_CorrelationIdentifier"`)
    await queryRunner.query(
      `CREATE TABLE "CorrelationIdentifier" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar CHECK( "type" IN ('did','url') ) NOT NULL, "correlation_id" text NOT NULL, "identityId" varchar, CONSTRAINT "UQ_Correlation_id" UNIQUE ("correlation_id"), CONSTRAINT "REL_CorrelationIdentifier_identityId" UNIQUE ("identityId"))`,
    )
    await queryRunner.query(
      `INSERT INTO "CorrelationIdentifier"("id", "type", "correlation_id", "identityId") SELECT "id", "type", "correlation_id", "identityId" FROM "CorrelationIdentifier"`,
    )
    await queryRunner.query(`DROP TABLE "temporary_CorrelationIdentifier"`)
    await queryRunner.query(`DROP TABLE "Connection"`)
    await queryRunner.query(`DROP TABLE "Identity"`)
    await queryRunner.query(`DROP TABLE "IdentityMetadata"`)
    await queryRunner.query(`DROP TABLE "Contact"`)
    await queryRunner.query(`DROP TABLE "CorrelationIdentifier"`)
    await queryRunner.query(`DROP INDEX "IDX_BaseConfigEntity_type"`)
    await queryRunner.query(`DROP TABLE "BaseConfigEntity"`)
  }
}
