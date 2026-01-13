import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddServiceMetadata1764000000001 implements MigrationInterface {
  name = 'AddServiceMetadata1764000000001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "service"
      ADD COLUMN IF NOT EXISTS "metadata" jsonb
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "service"
      DROP COLUMN IF EXISTS "metadata"
    `)
  }
}
