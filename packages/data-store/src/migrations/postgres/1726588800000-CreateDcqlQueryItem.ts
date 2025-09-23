import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateDcqlQueryItemPG1726588800000 implements MigrationInterface {
  name = 'CreateDcqlQueryItemPG1726588800000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "DcqlQueryItem" (
                                     "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                                     "tenant_id" TEXT,
                                     "query_id" TEXT NOT NULL,
                                     "name" TEXT,
                                     "version" TEXT NOT NULL,
                                     "purpose" TEXT,
                                     "query" TEXT NOT NULL,
                                     "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                                     "last_updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                                     CONSTRAINT "PK_DcqlQueryItem_id" PRIMARY KEY ("id"))
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "DcqlQueryItem"`)
  }
}
