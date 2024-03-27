import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateContacts1710438363002 implements MigrationInterface {
  name = 'CreateContacts1710438363002'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Party" ADD COLUMN "owner_id" text`);
    await queryRunner.query(`ALTER TABLE "Party" ADD COLUMN "tenant_id" text`);

    await queryRunner.query(`ALTER TABLE "Identity" ADD COLUMN "owner_id" text`);
    await queryRunner.query(`ALTER TABLE "Identity" ADD COLUMN "tenant_id" text`);
    await queryRunner.query(`ALTER TABLE "Identity" ADD COLUMN "origin" varchar CHECK( "origin" IN ('internal', 'external') )`);

    await queryRunner.query(`ALTER TABLE "CorrelationIdentifier" ADD COLUMN "owner_id" text`);
    await queryRunner.query(`ALTER TABLE "CorrelationIdentifier" ADD COLUMN "tenant_id" text`);

    await queryRunner.query(`ALTER TABLE "Connection" ADD COLUMN "owner_id" text`);
    await queryRunner.query(`ALTER TABLE "Connection" ADD COLUMN "tenant_id" text`);

    await queryRunner.query(`ALTER TABLE "BaseConfig" ADD COLUMN "owner_id" text`);
    await queryRunner.query(`ALTER TABLE "BaseConfig" ADD COLUMN "tenant_id" text`);

    await queryRunner.query(`ALTER TABLE "BaseContact" ADD COLUMN "owner_id" text`);
    await queryRunner.query(`ALTER TABLE "BaseContact" ADD COLUMN "tenant_id" text`);
    await queryRunner.query(`ALTER TABLE "BaseContact" ADD COLUMN "grade" text`);
    await queryRunner.query(`ALTER TABLE "BaseContact" ADD COLUMN "date_of_birth" DATETIME`);

    await queryRunner.query(`ALTER TABLE "PartyRelationship" ADD COLUMN "owner_id" text`);
    await queryRunner.query(`ALTER TABLE "PartyRelationship" ADD COLUMN "tenant_id" text`);

    await queryRunner.query(`ALTER TABLE "ElectronicAddress" ADD COLUMN "owner_id" text`);
    await queryRunner.query(`ALTER TABLE "ElectronicAddress" ADD COLUMN "tenant_id" text`);

    await queryRunner.query(`ALTER TABLE "PhysicalAddress" ADD COLUMN "owner_id" text`);
    await queryRunner.query(`ALTER TABLE "PhysicalAddress" ADD COLUMN "tenant_id" text`);

    await queryRunner.query(
        `CREATE TABLE "PartyType_new" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar CHECK( "type" IN ('naturalPerson','organization','student') ) NOT NULL, "name" varchar(255) NOT NULL, "description" varchar(255), "tenant_id" varchar(255) NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_PartyType_name" UNIQUE ("name"))`,
    )
    await queryRunner.query(`INSERT INTO "PartyType_new" SELECT * FROM "PartyType"`)
    await queryRunner.query(`DROP TABLE "PartyType"`)
    await queryRunner.query(`ALTER TABLE "PartyType_new" RENAME TO "PartyType"`)
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_PartyType_type_tenant_id" ON "PartyType" ("type", "tenant_id")`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // TODO DPP-27 implement downgrade
    return Promise.reject(Error(`Downgrade is not yet implemented for ${this.name}`))
  }
}
