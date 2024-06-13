import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreatePresentationDefinitions1716475165345 implements MigrationInterface {
  name = 'CreatePresentationDefinitions1716475165345'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
CREATE TABLE "PresentationDefinitionItem" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
    "tenant_id" TEXT, 
    "definition_id" TEXT NOT NULL,
    "name" TEXT,
    "version" TEXT NOT NULL, 
    "purpose" TEXT, 
    "definition_payload" TEXT NOT NULL, 
    "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
    "last_updated_at" TIMESTAMP NOT NULL DEFAULT now(), 
    CONSTRAINT "PK_PresentationDefinitionItem_id" PRIMARY KEY ("id"))
                                          `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "PresentationDefinitionItem"`)
  }
}
