import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreatePresentationDefinitions1716475165344 implements MigrationInterface {
  name = 'CreatePresentationDefinitions1716475165344'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "PresentationDefinitionItem" (
    "id" varchar PRIMARY KEY NOT NULL, 
    "tenant_id" varchar,
    "definition_id" varchar NOT NULL,
    "name" varchar,
    "version" varchar NOT NULL,
    "purpose" varchar,
    "definition_payload" varchar NOT NULL,
    "created_at" datetime NOT NULL DEFAULT (datetime('now')),
    "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')))`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "PresentationDefinitionItem"`)
  }
}
