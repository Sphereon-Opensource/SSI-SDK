import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateContacts1710438363001 implements MigrationInterface {
  name = 'CreateContacts1710438363001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."IdentityOrigin_type" AS ENUM('internal', 'external')`)

    await queryRunner.query(`ALTER TABLE "Party" ADD COLUMN "owner_id" text`)
    await queryRunner.query(`ALTER TABLE "Party" ADD COLUMN "tenant_id" text`)

    await queryRunner.query(`ALTER TABLE "Identity" ADD COLUMN "owner_id" text`)
    await queryRunner.query(`ALTER TABLE "Identity" ADD COLUMN "tenant_id" text`)
    await queryRunner.query(`ALTER TABLE "Identity" ADD COLUMN "origin" "public"."IdentityOrigin_type" NOT NULL`)

    await queryRunner.query(`ALTER TABLE "CorrelationIdentifier" ADD COLUMN "owner_id" text`)
    await queryRunner.query(`ALTER TABLE "CorrelationIdentifier" ADD COLUMN "tenant_id" text`)

    await queryRunner.query(`ALTER TABLE "Connection" ADD COLUMN "owner_id" text`)
    await queryRunner.query(`ALTER TABLE "Connection" ADD COLUMN "tenant_id" text`)

    await queryRunner.query(`ALTER TABLE "BaseConfig" ADD COLUMN "owner_id" text`)
    await queryRunner.query(`ALTER TABLE "BaseConfig" ADD COLUMN "tenant_id" text`)

    await queryRunner.query(`ALTER TABLE "BaseContact" ADD COLUMN "owner_id" text`)
    await queryRunner.query(`ALTER TABLE "BaseContact" ADD COLUMN "tenant_id" text`)
    await queryRunner.query(`ALTER TABLE "BaseContact" ADD COLUMN "grade" text`)
    await queryRunner.query(`ALTER TABLE "BaseContact" ADD COLUMN "date_of_birth" TIMESTAMP`)

    await queryRunner.query(`ALTER TABLE "PartyRelationship" ADD COLUMN "owner_id" text`)
    await queryRunner.query(`ALTER TABLE "PartyRelationship" ADD COLUMN "tenant_id" text`)

    await queryRunner.query(`ALTER TABLE "ElectronicAddress" ADD COLUMN "owner_id" text`)
    await queryRunner.query(`ALTER TABLE "ElectronicAddress" ADD COLUMN "tenant_id" text`)

    await queryRunner.query(`ALTER TABLE "PhysicalAddress" ADD COLUMN "owner_id" text`)
    await queryRunner.query(`ALTER TABLE "PhysicalAddress" ADD COLUMN "tenant_id" text`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // TODO DPP-27 implement downgrade
    return Promise.reject(Error(`Downgrade is not yet implemented for ${this.name}`))
  }
}
