import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateContacts1710941197348 implements MigrationInterface {
  name = 'CreateContacts1710941197348'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "PartyType" ADD COLUMN "origin" varchar CHECK( "origin" IN ('internal', 'external') )`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // TODO DPP-27 implement downgrade
    return Promise.reject(Error(`Downgrade is not yet implemented for ${this.name}`))
  }
}
