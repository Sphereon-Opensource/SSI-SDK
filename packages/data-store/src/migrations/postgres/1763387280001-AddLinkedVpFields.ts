import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddLinkedVpFields1763387280001 implements MigrationInterface {
  name = 'AddLinkedVpFields1763387280001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "DigitalCredential" 
      ADD COLUMN "linked_vp_id" text
    `)

    await queryRunner.query(`
      ALTER TABLE "DigitalCredential" 
      ADD COLUMN "linked_vp_from" TIMESTAMP
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
