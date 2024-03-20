import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateContacts1710941091795 implements MigrationInterface {
  name = 'CreateContacts1710941091795'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."partyOrigin_type_enum" AS ENUM('INTERNAL', 'EXTERNAL')`)
    await queryRunner.query(`ALTER TABLE "PartyType" ADD COLUMN "origin" "public"."partyOrigin_type_enum" NOT NULL`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // TODO DPP-27 implement downgrade
    return Promise.reject(Error(`Downgrade is not yet implemented for ${this.name}`))
  }
}
