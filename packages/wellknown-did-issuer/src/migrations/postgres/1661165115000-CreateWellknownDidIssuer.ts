import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateWellknownDidIssuer1661165115000 implements MigrationInterface {
  name = 'CreateWellknownDidIssuer1661165115000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "DidConfigurationResource" ("origin" varchar NOT NULL, "context" varchar NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "last_updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_Origin" PRIMARY KEY ("origin"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "DidConfigurationResourceCredentials" ("didConfigurationResourceOrigin" varchar NOT NULL, "credentialHash" varchar NOT NULL)`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "DidConfigurationResource"`)
    await queryRunner.query(`DROP TABLE "DidConfigurationResourceCredentials"`)
  }
}
