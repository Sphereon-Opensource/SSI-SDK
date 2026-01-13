import Debug, { Debugger } from 'debug'
import { MigrationInterface, QueryRunner } from 'typeorm'

const debug: Debugger = Debug('sphereon:ssi-sdk:migrations')

export class AddServiceMetadata1764000000001 implements MigrationInterface {
  name = 'AddServiceMetadata1764000000001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the service table exists (created by Veramo migrations)
    const table = await queryRunner.getTable('service')
    if (!table) {
      // Service table doesn't exist - Veramo DID Manager is not in use
      // Skip this migration as there's no service table to modify
      debug(
        'AddServiceMetadata: Skipping migration - service table does not exist. ' +
        'This is expected if Veramo DID Manager is not being used. ' +
        'If you need service metadata support, ensure Veramo migrations run before SSI-SDK migrations.'
      )
      console.warn(
        '[SSI-SDK Migration] AddServiceMetadata: Skipping - service table does not exist (Veramo DID Manager not in use)'
      )
      return
    }

    await queryRunner.query(`
      ALTER TABLE "service"
      ADD COLUMN IF NOT EXISTS "metadata" jsonb
    `)
    debug('AddServiceMetadata: Added metadata column to service table')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('service')
    if (!table) {
      return
    }
    
    await queryRunner.query(`
      ALTER TABLE "service"
      DROP COLUMN IF EXISTS "metadata"
    `)
  }
}
