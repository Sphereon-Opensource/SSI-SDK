import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateContacts1710438363002 implements MigrationInterface {
  name = 'CreateContacts1710438363002'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Party" ADD COLUMN "owner_id" text`)
    await queryRunner.query(`ALTER TABLE "Party" ADD COLUMN "tenant_id" text`)

    // Add owner_id, tenant_id & origin
    await queryRunner.query(
      `CREATE TABLE "temporary_Identity" (
                                             "id" varchar PRIMARY KEY NOT NULL,
                                             "alias" varchar(255) NOT NULL,
                                             "roles" text NOT NULL,
                                             "origin" text NOT NULL,
                                             "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                                             "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                                             "partyId" varchar,
                                             "owner_id" text,
                                             "tenant_id" text,
                                             CONSTRAINT "UQ_Identity_alias" UNIQUE ("alias"),
                                             CONSTRAINT "FK_Identity_partyId" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
         )`,
    )
    await queryRunner.query(
      `INSERT INTO "temporary_Identity"("id", "alias", "roles", "created_at", "last_updated_at", "partyId", "owner_id", "tenant_id", "origin")
         SELECT "id", "alias", "roles", 'EXTERNAL' as "origin", "created_at", "last_updated_at", "partyId", NULL as "owner_id", NULL as "tenant_id" FROM "Identity"`,
    )
    await queryRunner.query(`DROP TABLE "Identity"`)
    await queryRunner.query(`ALTER TABLE "temporary_Identity" RENAME TO "Identity"`)

    await queryRunner.query(`ALTER TABLE "CorrelationIdentifier" ADD COLUMN "owner_id" text`)
    await queryRunner.query(`ALTER TABLE "CorrelationIdentifier" ADD COLUMN "tenant_id" text`)

    await queryRunner.query(`ALTER TABLE "Connection" ADD COLUMN "owner_id" text`)
    await queryRunner.query(`ALTER TABLE "Connection" ADD COLUMN "tenant_id" text`)

    await queryRunner.query(`ALTER TABLE "BaseConfig" ADD COLUMN "owner_id" text`)
    await queryRunner.query(`ALTER TABLE "BaseConfig" ADD COLUMN "tenant_id" text`)

    await queryRunner.query(`ALTER TABLE "BaseContact" ADD COLUMN "owner_id" text`)
    await queryRunner.query(`ALTER TABLE "BaseContact" ADD COLUMN "tenant_id" text`)

    await queryRunner.query(`ALTER TABLE "PartyRelationship" ADD COLUMN "owner_id" text`)
    await queryRunner.query(`ALTER TABLE "PartyRelationship" ADD COLUMN "tenant_id" text`)

    await queryRunner.query(`ALTER TABLE "ElectronicAddress" ADD COLUMN "owner_id" text`)
    await queryRunner.query(`ALTER TABLE "ElectronicAddress" ADD COLUMN "tenant_id" text`)

    await queryRunner.query(`ALTER TABLE "PhysicalAddress" ADD COLUMN "owner_id" text`)
    await queryRunner.query(`ALTER TABLE "PhysicalAddress" ADD COLUMN "tenant_id" text`)
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
