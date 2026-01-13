import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddServiceMetadata1764000000002 implements MigrationInterface {
  name = 'AddServiceMetadata1764000000002'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if column exists before adding
    const table = await queryRunner.getTable('service')
    const hasMetadataColumn = table?.columns.some((col) => col.name === 'metadata')

    if (!hasMetadataColumn) {
      await queryRunner.query(`
        ALTER TABLE "service"
        ADD COLUMN "metadata" text
      `)
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // SQLite doesn't support DROP COLUMN directly, but we can leave the column
    // or recreate the table without it if needed
    // For simplicity, we'll skip the down migration for SQLite
  }
}
