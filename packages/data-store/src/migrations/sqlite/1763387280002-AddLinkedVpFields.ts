import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddLinkedVpFields1763387280002 implements MigrationInterface {
  name = 'AddLinkedVpFields1763387280002'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "DigitalCredential" 
      ADD COLUMN "linked_vp_id" text
    `)

    await queryRunner.query(`
      ALTER TABLE "DigitalCredential" 
      ADD COLUMN "linked_vp_from" datetime
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // SQLite doesn't support DROP COLUMN in older versions
    // For production, you may need to recreate the table
    // For now, we'll try the direct approach which works in SQLite 3.35.0+
    await queryRunner.query(`
      ALTER TABLE "DigitalCredential" 
      DROP COLUMN "linked_vp_from"
    `)

    await queryRunner.query(`
      ALTER TABLE "DigitalCredential" 
      DROP COLUMN "linked_vp_id"
    `)
  }
}
