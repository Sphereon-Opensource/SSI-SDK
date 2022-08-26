import { MigrationInterface } from 'typeorm'

export const flattenEntities = (args: { entities: Array<unknown | Array<unknown>> }): Array<unknown> => args.entities.flat()

export const flattenMigrations = (args: { migrations: Array<MigrationInterface | Array<MigrationInterface>> }): Array<MigrationInterface> =>
  args.migrations.flat()
