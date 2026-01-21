import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddBrandingStatePostgres1766000000000 implements MigrationInterface {
  name = 'AddBrandingState1766000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "CredentialBranding" ADD "state" character varying(255) NOT NULL DEFAULT ''`)
    await queryRunner.query(`ALTER TABLE "BaseLocaleBranding" ADD "state" character varying(255) NOT NULL DEFAULT ''`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "BaseLocaleBranding" DROP COLUMN "state"`)
    await queryRunner.query(`ALTER TABLE "CredentialBranding" DROP COLUMN "state"`)
  }
}
