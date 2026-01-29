import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCredentialClaimOrderPostgres1768000000000 implements MigrationInterface {
  name = 'AddCredentialClaimOrder1768000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "CredentialClaims" ADD "order" integer`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "CredentialClaims" DROP COLUMN "order"`)
  }
}
