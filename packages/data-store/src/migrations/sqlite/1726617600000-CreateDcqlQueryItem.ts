import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateDcqlQueryItemSQlite1726617600000 implements MigrationInterface {
  name = 'CreateDcqlQueryItemSQlite1726617600000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "DcqlQueryItem" (
                                      "id" varchar PRIMARY KEY NOT NULL,
                                      "tenant_id" varchar,
                                      "query_id" varchar NOT NULL,
                                      "name" varchar,
                                      "version" varchar NOT NULL,
                                      "purpose" varchar,
                                      "query" varchar NOT NULL,
                                      "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                                      "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')))`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "DcqlQueryItem"`)
  }
}
