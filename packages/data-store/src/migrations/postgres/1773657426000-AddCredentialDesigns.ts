import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCredentialDesignsPostgres1773657426000 implements MigrationInterface {
  name = 'AddCredentialDesignsPostgres1773657426000'

  public async up(queryRunner: QueryRunner): Promise<void> {

    await queryRunner.query(`
      CREATE TYPE IF NOT EXISTS "value_type" AS ENUM ('Text', 'Number', 'Boolean', 'Date');
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "meta_data_set"
      (
        "id"        uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid,
        "name"      text NOT NULL,
        CONSTRAINT "meta_data_set_pkey" PRIMARY KEY ("id")
      )
    `)

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "meta_data_set_unique_tenant" ON "meta_data_set" ("name", "tenant_id")
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "meta_data_keys"
      (
        "id"         uuid       NOT NULL DEFAULT gen_random_uuid(),
        "set_id"     uuid       NOT NULL,
        "key"        text       NOT NULL,
        "value_type" value_type NOT NULL,
        CONSTRAINT "meta_data_keys_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "fk_meta_data_set" FOREIGN KEY ("set_id")
          REFERENCES "meta_data_set" ("id")
      )
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "meta_data_values"
      (
        "id"              uuid NOT NULL DEFAULT gen_random_uuid(),
        "key_id"          uuid NOT NULL,
        "index"           numeric,
        "text_value"      text,
        "number_value"    numeric,
        "boolean_value"   boolean,
        "timestamp_value" timestamp without time zone,
        CONSTRAINT "meta_data_values_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "fk_meta_data_keys" FOREIGN KEY ("key_id")
          REFERENCES "meta_data_keys" ("id")
      )
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "form_step"
      (
        "id"        uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid,
        "form_id"   text,
        "step_nr"   numeric,
        "order"     numeric,
        CONSTRAINT "formstep_pkey" PRIMARY KEY ("id")
      )
    `)

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "formstep_unique_step" ON "form_step" ("step_nr", "form_id", "order")
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "schema_definition"
      (
        "id"                uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id"         uuid,
        "extends_id"        uuid,
        "correlation_id"    text,
        "schema_type"       text,
        "entity_type"       text,
        "schema"            text NOT NULL,
        "meta_data_set_id"  uuid,
        CONSTRAINT "schemadef_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "fk_schemadef_metadata"
          FOREIGN KEY ("meta_data_set_id")
            REFERENCES "meta_data_set" ("id")
      )
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "form_step_to_schema_definition"
      (
        "form_step_id"         uuid NOT NULL,
        "schema_definition_id" uuid NOT NULL,
        CONSTRAINT "pk_form_step_to_schema_definition" PRIMARY KEY ("form_step_id", "schema_definition_id"),
        CONSTRAINT "fk_form_step"
          FOREIGN KEY ("form_step_id")
            REFERENCES "form_step" ("id"),
        CONSTRAINT "fk_schema_definition"
          FOREIGN KEY ("schema_definition_id")
            REFERENCES "schema_definition" ("id")
      )
    `)

    // ── Credential design branding table ────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "credential_design_branding"
      (
        "id"                uuid NOT NULL DEFAULT gen_random_uuid(),
        "logo"              uuid,
        "background_image"  uuid,
        "text_color"        text,
        "background_color"  text,
        "meta_data_set_id"  uuid,
        CONSTRAINT "credentialdesignbranding_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "fk_credentialdesignbranding_metadata" FOREIGN KEY ("meta_data_set_id") REFERENCES "meta_data_set" ("id") ON DELETE CASCADE,
        CONSTRAINT "unique_meta_data_set_id" UNIQUE ("meta_data_set_id"),
        CONSTRAINT "fk_branding_logo" FOREIGN KEY ("logo") REFERENCES "ImageAttributes" ("id"),
        CONSTRAINT "fk_branding_background_image" FOREIGN KEY ("background_image") REFERENCES "ImageAttributes" ("id")
      );
    `)

    // ── Cascade FK updates ──────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE meta_data_keys DROP CONSTRAINT IF EXISTS fk_meta_data_set
    `)
    await queryRunner.query(`
      ALTER TABLE meta_data_keys ADD CONSTRAINT fk_meta_data_set FOREIGN KEY (set_id) REFERENCES meta_data_set(id) ON DELETE CASCADE
    `)

    await queryRunner.query(`
      ALTER TABLE schema_definition DROP CONSTRAINT IF EXISTS fk_schemadef_metadata
    `)
    await queryRunner.query(`
      ALTER TABLE schema_definition ADD CONSTRAINT fk_schemadef_metadata FOREIGN KEY (meta_data_set_id) REFERENCES meta_data_set(id) ON DELETE CASCADE
    `)

    await queryRunner.query(`
      ALTER TABLE meta_data_values DROP CONSTRAINT IF EXISTS fk_meta_data_keys
    `)
    await queryRunner.query(`
      ALTER TABLE meta_data_values ADD CONSTRAINT fk_meta_data_keys FOREIGN KEY (key_id) REFERENCES meta_data_keys(id) ON DELETE CASCADE
    `)

    await queryRunner.query(`
      ALTER TABLE form_step_to_schema_definition DROP CONSTRAINT IF EXISTS form_step_to_schema_definition_schema_definition_id_fkey;
    `)
    await queryRunner.query(`
      ALTER TABLE form_step_to_schema_definition ADD CONSTRAINT form_step_to_schema_definition_schema_definition_id_fkey FOREIGN KEY (schema_definition_id) REFERENCES schema_definition(id) ON DELETE CASCADE;
    `)

    await queryRunner.query(`
      ALTER TABLE form_step_to_schema_definition DROP CONSTRAINT IF EXISTS fk_schema_definition;
    `)
    await queryRunner.query(`
      ALTER TABLE form_step_to_schema_definition ADD CONSTRAINT fk_schema_definition FOREIGN KEY (schema_definition_id) REFERENCES schema_definition(id) ON DELETE CASCADE;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore non-cascade FKs
    await queryRunner.query(`
      ALTER TABLE form_step_to_schema_definition DROP CONSTRAINT IF EXISTS fk_schema_definition;
    `)
    await queryRunner.query(`
      ALTER TABLE form_step_to_schema_definition ADD CONSTRAINT fk_schema_definition FOREIGN KEY (schema_definition_id) REFERENCES schema_definition(id);
    `)

    await queryRunner.query(`
      ALTER TABLE form_step_to_schema_definition DROP CONSTRAINT IF EXISTS form_step_to_schema_definition_schema_definition_id_fkey;
    `)
    await queryRunner.query(`
      ALTER TABLE form_step_to_schema_definition ADD CONSTRAINT form_step_to_schema_definition_schema_definition_id_fkey FOREIGN KEY (schema_definition_id) REFERENCES schema_definition(id);
    `)

    await queryRunner.query(`
      ALTER TABLE meta_data_values DROP CONSTRAINT IF EXISTS fk_meta_data_keys;
    `)
    await queryRunner.query(`
      ALTER TABLE meta_data_values ADD CONSTRAINT fk_meta_data_keys FOREIGN KEY (key_id) REFERENCES meta_data_keys(id);
    `)

    await queryRunner.query(`
      ALTER TABLE schema_definition DROP CONSTRAINT IF EXISTS fk_schemadef_metadata;
    `)
    await queryRunner.query(`
      ALTER TABLE schema_definition ADD CONSTRAINT fk_schemadef_metadata FOREIGN KEY (meta_data_set_id) REFERENCES meta_data_set(id);
    `)

    await queryRunner.query(`
      ALTER TABLE meta_data_keys DROP CONSTRAINT IF EXISTS fk_meta_data_set;
    `)
    await queryRunner.query(`
      ALTER TABLE meta_data_keys ADD CONSTRAINT fk_meta_data_set FOREIGN KEY (set_id) REFERENCES meta_data_set(id);
    `)

    // Drop functions and tables
    await queryRunner.query(`DROP TABLE IF EXISTS "credential_design_branding"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "form_step_to_schema_definition"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "schema_definition"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "formstep_unique_step"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "form_step"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "meta_data_values"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "meta_data_keys"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "meta_data_set_unique_tenant"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "meta_data_set"`)
    await queryRunner.query(`DROP TYPE IF EXISTS "value_type"`)
  }
}
