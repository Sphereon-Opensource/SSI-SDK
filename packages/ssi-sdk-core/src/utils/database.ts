import { MigrationInterface } from 'typeorm'

export const flattenArray = (args: { items: Array<unknown | Array<unknown>> }): Array<unknown> => args.items.flat()

export const flattenMigrations = (args: { migrations: Array<MigrationInterface | Array<MigrationInterface>> }): Array<MigrationInterface> =>
  args.migrations.flat()
