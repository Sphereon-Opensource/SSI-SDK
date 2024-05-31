import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateContacts1710438363001 implements MigrationInterface {
  name = 'CreateContacts1710438363001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Party" ADD COLUMN "owner_id" uuid`)
    await queryRunner.query(`ALTER TABLE "Party" ADD COLUMN "tenant_id" uuid`)

    await queryRunner.query(`ALTER TABLE "Identity" ADD COLUMN "owner_id" uuid`)
    await queryRunner.query(`ALTER TABLE "Identity" ADD COLUMN "tenant_id" uuid`)

    await queryRunner.query(`ALTER TABLE "CorrelationIdentifier" ADD COLUMN "owner_id" uuid`)
    await queryRunner.query(`ALTER TABLE "CorrelationIdentifier" ADD COLUMN "tenant_id" uuid`)

    await queryRunner.query(`ALTER TABLE "Connection" ADD COLUMN "owner_id" uuid`)
    await queryRunner.query(`ALTER TABLE "Connection" ADD COLUMN "tenant_id" uuid`)

    await queryRunner.query(`ALTER TABLE "BaseConfig" ADD COLUMN "owner_id" uuid`)
    await queryRunner.query(`ALTER TABLE "BaseConfig" ADD COLUMN "tenant_id" uuid`)

    await queryRunner.query(`ALTER TABLE "BaseContact" ADD COLUMN "owner_id" uuid`)
    await queryRunner.query(`ALTER TABLE "BaseContact" ADD COLUMN "tenant_id" uuid`)

    await queryRunner.query(`ALTER TABLE "PartyRelationship" ADD COLUMN "owner_id" uuid`)
    await queryRunner.query(`ALTER TABLE "PartyRelationship" ADD COLUMN "tenant_id" uuid`)

    await queryRunner.query(`ALTER TABLE "ElectronicAddress" ADD COLUMN "owner_id" uuid`)
    await queryRunner.query(`ALTER TABLE "ElectronicAddress" ADD COLUMN "tenant_id" uuid`)

    await queryRunner.query(`ALTER TABLE "PhysicalAddress" ADD COLUMN "owner_id" uuid`)
    await queryRunner.query(`ALTER TABLE "PhysicalAddress" ADD COLUMN "tenant_id" uuid`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "PhysicalAddress" DROP COLUMN "tenant_id"`)
    await queryRunner.query(`ALTER TABLE "PhysicalAddress" DROP COLUMN "owner_id"`)

    await queryRunner.query(`ALTER TABLE "ElectronicAddress" DROP COLUMN "tenant_id"`)
    await queryRunner.query(`ALTER TABLE "ElectronicAddress" DROP COLUMN "owner_id"`)

    await queryRunner.query(`ALTER TABLE "PartyRelationship" DROP COLUMN "tenant_id"`)
    await queryRunner.query(`ALTER TABLE "PartyRelationship" DROP COLUMN "owner_id"`)

    await queryRunner.query(`ALTER TABLE "BaseContact" DROP COLUMN "tenant_id"`)
    await queryRunner.query(`ALTER TABLE "BaseContact" DROP COLUMN "owner_id"`)

    await queryRunner.query(`ALTER TABLE "BaseConfig" DROP COLUMN "tenant_id"`)
    await queryRunner.query(`ALTER TABLE "BaseConfig" DROP COLUMN "owner_id"`)

    await queryRunner.query(`ALTER TABLE "Connection" DROP COLUMN "tenant_id"`)
    await queryRunner.query(`ALTER TABLE "Connection" DROP COLUMN "owner_id"`)

    await queryRunner.query(`ALTER TABLE "CorrelationIdentifier" DROP COLUMN "tenant_id"`)
    await queryRunner.query(`ALTER TABLE "CorrelationIdentifier" DROP COLUMN "owner_id"`)

    await queryRunner.query(`ALTER TABLE "Identity" DROP COLUMN "tenant_id"`)
    await queryRunner.query(`ALTER TABLE "Identity" DROP COLUMN "owner_id"`)

    await queryRunner.query(`ALTER TABLE "Party" DROP COLUMN "tenant_id"`)
    await queryRunner.query(`ALTER TABLE "Party" DROP COLUMN "owner_id"`)
  }
}
