import { MigrationInterface, QueryRunner } from 'typeorm'

export class UpdatePresentationDefinitionItemNullablePG1741895824000 implements MigrationInterface {
  name = 'UpdatePresentationDefinitionItemNullable1741895824000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make definition_payload nullable
    await queryRunner.query(`ALTER TABLE "PresentationDefinitionItem" ALTER COLUMN "definition_payload" DROP NOT NULL`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Make definition_payload NOT NULL again
    await queryRunner.query(`ALTER TABLE "PresentationDefinitionItem" ALTER COLUMN "definition_payload" SET NOT NULL`)
  }
}
