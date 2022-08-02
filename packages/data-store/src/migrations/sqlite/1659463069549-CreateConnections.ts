import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateConnections1659463069549 implements MigrationInterface {
    name = 'CreateConnections1659463069549'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "BaseConfigEntity" ("id" varchar PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "client_id" text, "client_secret" text, "scopes" text, "issuer" text, "redirect_url" text, "dangerously_allow_insecure_http_requests" boolean, "client_auth_method" text, "identifier" text, "session_id" text, "type" varchar NOT NULL)`);
        await queryRunner.query(`CREATE INDEX "IDX_228953a09ee91bbac6e28b7345" ON "BaseConfigEntity" ("type") `);
        await queryRunner.query(`CREATE TABLE "ConnectionIdentifier" ("id" varchar PRIMARY KEY NOT NULL, "connectionType" varchar CHECK( "connectionType" IN ('did','url') ) NOT NULL, "correlation_id" text NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "ConnectionMetadata" ("id" varchar PRIMARY KEY NOT NULL, "label" text NOT NULL, "value" text NOT NULL, "connectionId" varchar)`);
        await queryRunner.query(`CREATE TABLE "Party" ("id" varchar PRIMARY KEY NOT NULL, "name" text NOT NULL)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_66eac665e95dbed6abd544940f" ON "Party" ("name") `);
        await queryRunner.query(`CREATE TABLE "Connection" ("id" varchar PRIMARY KEY NOT NULL, "connection_type" varchar CHECK( "connection_type" IN ('openid','didauth','siopv2+oidc4vp') ) NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "identifierId" varchar, "configId" varchar, "partyId" varchar, CONSTRAINT "REL_aa9063e7f7fb511f53fd7ed514" UNIQUE ("identifierId"), CONSTRAINT "REL_258311da5ac24ef56f9a67e97a" UNIQUE ("configId"))`);
        await queryRunner.query(`CREATE TABLE "temporary_ConnectionMetadata" ("id" varchar PRIMARY KEY NOT NULL, "label" text NOT NULL, "value" text NOT NULL, "connectionId" varchar, CONSTRAINT "FK_6ad4b3aef7fa22859724a7daefb" FOREIGN KEY ("connectionId") REFERENCES "Connection" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_ConnectionMetadata"("id", "label", "value", "connectionId") SELECT "id", "label", "value", "connectionId" FROM "ConnectionMetadata"`);
        await queryRunner.query(`DROP TABLE "ConnectionMetadata"`);
        await queryRunner.query(`ALTER TABLE "temporary_ConnectionMetadata" RENAME TO "ConnectionMetadata"`);
        await queryRunner.query(`CREATE TABLE "temporary_Connection" ("id" varchar PRIMARY KEY NOT NULL, "connection_type" varchar CHECK( "connection_type" IN ('openid','didauth','siopv2+oidc4vp') ) NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "identifierId" varchar, "configId" varchar, "partyId" varchar, CONSTRAINT "REL_aa9063e7f7fb511f53fd7ed514" UNIQUE ("identifierId"), CONSTRAINT "REL_258311da5ac24ef56f9a67e97a" UNIQUE ("configId"), CONSTRAINT "FK_aa9063e7f7fb511f53fd7ed514c" FOREIGN KEY ("identifierId") REFERENCES "ConnectionIdentifier" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_258311da5ac24ef56f9a67e97a0" FOREIGN KEY ("configId") REFERENCES "BaseConfigEntity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_7d1cc49940483073cdc4cea2284" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_Connection"("id", "connection_type", "created_at", "last_updated_at", "identifierId", "configId", "partyId") SELECT "id", "connection_type", "created_at", "last_updated_at", "identifierId", "configId", "partyId" FROM "Connection"`);
        await queryRunner.query(`DROP TABLE "Connection"`);
        await queryRunner.query(`ALTER TABLE "temporary_Connection" RENAME TO "Connection"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Connection" RENAME TO "temporary_Connection"`);
        await queryRunner.query(`CREATE TABLE "Connection" ("id" varchar PRIMARY KEY NOT NULL, "connection_type" varchar CHECK( "connection_type" IN ('openid','didauth','siopv2+oidc4vp') ) NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), "identifierId" varchar, "configId" varchar, "partyId" varchar, CONSTRAINT "REL_aa9063e7f7fb511f53fd7ed514" UNIQUE ("identifierId"), CONSTRAINT "REL_258311da5ac24ef56f9a67e97a" UNIQUE ("configId"))`);
        await queryRunner.query(`INSERT INTO "Connection"("id", "connection_type", "created_at", "last_updated_at", "identifierId", "configId", "partyId") SELECT "id", "connection_type", "created_at", "last_updated_at", "identifierId", "configId", "partyId" FROM "temporary_Connection"`);
        await queryRunner.query(`DROP TABLE "temporary_Connection"`);
        await queryRunner.query(`ALTER TABLE "ConnectionMetadata" RENAME TO "temporary_ConnectionMetadata"`);
        await queryRunner.query(`CREATE TABLE "ConnectionMetadata" ("id" varchar PRIMARY KEY NOT NULL, "label" text NOT NULL, "value" text NOT NULL, "connectionId" varchar)`);
        await queryRunner.query(`INSERT INTO "ConnectionMetadata"("id", "label", "value", "connectionId") SELECT "id", "label", "value", "connectionId" FROM "temporary_ConnectionMetadata"`);
        await queryRunner.query(`DROP TABLE "temporary_ConnectionMetadata"`);
        await queryRunner.query(`DROP TABLE "Connection"`);
        await queryRunner.query(`DROP INDEX "IDX_66eac665e95dbed6abd544940f"`);
        await queryRunner.query(`DROP TABLE "Party"`);
        await queryRunner.query(`DROP TABLE "ConnectionMetadata"`);
        await queryRunner.query(`DROP TABLE "ConnectionIdentifier"`);
        await queryRunner.query(`DROP INDEX "IDX_228953a09ee91bbac6e28b7345"`);
        await queryRunner.query(`DROP TABLE "BaseConfigEntity"`);
    }

}
