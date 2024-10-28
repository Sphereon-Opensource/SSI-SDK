import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateWellknownDidIssuer1661161799000 implements MigrationInterface {
  name = 'CreateWellknownDidIssuer1661161799000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "DidConfigurationResource" ("origin" varchar PRIMARY KEY NOT NULL, "context" varchar NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')))`,
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
