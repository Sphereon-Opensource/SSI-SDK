import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePhysicalAddressTable1712695589134 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "PhysicalAddress" (
                "id" text PRIMARY KEY NOT NULL,
                "type" varchar(255) NOT NULL,
                "street_name" varchar(255) NOT NULL,
                "street_number" varchar(255) NOT NULL,
                "postal_code" varchar(255) NOT NULL,
                "city_name" varchar(255) NOT NULL,
                "province_name" varchar(255) NOT NULL,
                "country_code" varchar(2) NOT NULL,
                "building_name" varchar(255),
                "partyId" uuid,
                "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "last_updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "FK_PhysicalAddressEntity_partyId" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE CASCADE
            );`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "PhysicalAddress"`)
    }

}
