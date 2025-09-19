import { MigrationInterface, QueryRunner } from 'typeorm'

export class UpdatePresentationDefinitionItemNullableSqlite1756975340000 implements MigrationInterface {
  name = 'UpdatePresentationDefinitionItemNullable1756975340000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create temporary table with updated schema (definition_payload nullable)
    await queryRunner.query(`
      CREATE TABLE "temporary_PresentationDefinitionItem" (
                                                            "id" varchar PRIMARY KEY NOT NULL,
                                                            "definition_id" varchar(255) NOT NULL,
                                                            "version" varchar(255) NOT NULL,
                                                            "tenant_id" varchar(255),
                                                            "purpose" varchar(255),
                                                            "name" varchar(255),
                                                            "definition_payload" text,
                                                            "dcql_payload" text,
                                                            "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                                                            "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                                                            CONSTRAINT "UQ_PresentationDefinitionItem_definition_id_version" UNIQUE ("definition_id", "version")
      )
    `)

    // Copy data from old table
    await queryRunner.query(`
      INSERT INTO "temporary_PresentationDefinitionItem"(
        "id", "definition_id", "version", "tenant_id", "purpose", "name",
        "definition_payload", "dcql_payload", "created_at", "last_updated_at"
      )
      SELECT
        "id", "definition_id", "version", "tenant_id", "purpose", "name",
        "definition_payload", "dcql_payload", "created_at", "last_updated_at"
      FROM "PresentationDefinitionItem"
    `)

    // Drop old table and rename
    await queryRunner.query(`DROP TABLE "PresentationDefinitionItem"`)
    await queryRunner.query(`ALTER TABLE "temporary_PresentationDefinitionItem" RENAME TO "PresentationDefinitionItem"`)

    // Recreate index
    await queryRunner.query(`CREATE INDEX "IDX_PresentationDefinitionItem_version" ON "PresentationDefinitionItem" ("version")`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to original schema (definition_payload NOT NULL, dcql_payload nullable)
    await queryRunner.query(`
      CREATE TABLE "temporary_PresentationDefinitionItem" (
                                                            "id" varchar PRIMARY KEY NOT NULL,
                                                            "definition_id" varchar(255) NOT NULL,
                                                            "version" varchar(255) NOT NULL,
                                                            "tenant_id" varchar(255),
                                                            "purpose" varchar(255),
                                                            "name" varchar(255),
                                                            "definition_payload" text NOT NULL,
                                                            "dcql_payload" text,
                                                            "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                                                            "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                                                            CONSTRAINT "UQ_PresentationDefinitionItem_definition_id_version" UNIQUE ("definition_id", "version")
      )
    `)

    await queryRunner.query(`
      INSERT INTO "temporary_PresentationDefinitionItem"(
        "id", "definition_id", "version", "tenant_id", "purpose", "name",
        "definition_payload", "dcql_payload", "created_at", "last_updated_at"
      )
      SELECT
        "id", "definition_id", "version", "tenant_id", "purpose", "name",
        "definition_payload", "dcql_payload", "created_at", "last_updated_at"
      FROM "PresentationDefinitionItem"
    `)

    await queryRunner.query(`DROP TABLE "PresentationDefinitionItem"`)
    await queryRunner.query(`ALTER TABLE "temporary_PresentationDefinitionItem" RENAME TO "PresentationDefinitionItem"`)
    await queryRunner.query(`CREATE INDEX "IDX_PresentationDefinitionItem_version" ON "PresentationDefinitionItem" ("version")`)
  }
}
