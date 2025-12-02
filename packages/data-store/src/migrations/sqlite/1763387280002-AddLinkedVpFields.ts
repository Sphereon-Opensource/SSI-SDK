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

    await queryRunner.query(`
      ALTER TABLE "DigitalCredential" 
      ADD COLUMN "linked_vp_until" datetime
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "DigitalCredential" 
      DROP COLUMN "linked_vp_from"
    `)

    await queryRunner.query(`
      ALTER TABLE "DigitalCredential" 
      DROP COLUMN "linked_vp_until"
    `)

    await queryRunner.query(`
      ALTER TABLE "DigitalCredential" 
      DROP COLUMN "linked_vp_id"
    `)
  }
}
