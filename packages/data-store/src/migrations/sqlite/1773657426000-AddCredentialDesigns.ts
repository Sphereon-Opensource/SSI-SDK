import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCredentialDesignsSqlite1773657426000 implements MigrationInterface {
  name = 'AddCredentialDesignsSqlite1773657426000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "meta_data_set" ("id" varchar PRIMARY KEY NOT NULL, "tenant_id" varchar, "name" text NOT NULL)`,
    )

    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "meta_data_set_unique_tenant" ON "meta_data_set" ("name", "tenant_id")`)

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "meta_data_keys" ("id" varchar PRIMARY KEY NOT NULL, "set_id" varchar NOT NULL, "key" text NOT NULL, "value_type" varchar CHECK( "value_type" IN ('Text','Number','Boolean','Date') ) NOT NULL, CONSTRAINT "fk_meta_data_set" FOREIGN KEY ("set_id") REFERENCES "meta_data_set" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    )

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "meta_data_values" ("id" varchar PRIMARY KEY NOT NULL, "key_id" varchar NOT NULL, "index" integer, "text_value" text, "number_value" real, "boolean_value" boolean, "timestamp_value" datetime, CONSTRAINT "fk_meta_data_keys" FOREIGN KEY ("key_id") REFERENCES "meta_data_keys" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    )

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "form_step" ("id" varchar PRIMARY KEY NOT NULL, "tenant_id" varchar, "form_id" text, "step_nr" integer, "order" integer)`,
    )

    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "formstep_unique_step" ON "form_step" ("step_nr", "form_id", "order")`)

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "schema_definition" ("id" varchar PRIMARY KEY NOT NULL, "tenant_id" varchar, "extends_id" varchar, "correlation_id" text, "schema_type" text, "entity_type" text, "schema" text NOT NULL, "meta_data_set_id" varchar, CONSTRAINT "fk_schemadef_metadata" FOREIGN KEY ("meta_data_set_id") REFERENCES "meta_data_set" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    )

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "form_step_to_schema_definition" ("form_step_id" varchar NOT NULL, "schema_definition_id" varchar NOT NULL, PRIMARY KEY ("form_step_id", "schema_definition_id"), CONSTRAINT "fk_form_step" FOREIGN KEY ("form_step_id") REFERENCES "form_step" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "fk_schema_definition" FOREIGN KEY ("schema_definition_id") REFERENCES "schema_definition" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    )

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "credential_design_branding" ("id" varchar PRIMARY KEY NOT NULL, "logo" varchar, "background_image" varchar, "text_color" text, "background_color" text, "meta_data_set_id" varchar, CONSTRAINT "unique_meta_data_set_id" UNIQUE ("meta_data_set_id"), CONSTRAINT "fk_credentialdesignbranding_metadata" FOREIGN KEY ("meta_data_set_id") REFERENCES "meta_data_set" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "fk_branding_logo" FOREIGN KEY ("logo") REFERENCES "ImageAttributes" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "fk_branding_background_image" FOREIGN KEY ("background_image") REFERENCES "ImageAttributes" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "credential_design_branding"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "form_step_to_schema_definition"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "schema_definition"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "formstep_unique_step"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "form_step"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "meta_data_values"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "meta_data_keys"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "meta_data_set_unique_tenant"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "meta_data_set"`)
  }
}
