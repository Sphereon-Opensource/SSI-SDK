export const flattenArray = <T>(args: { items: Array<T | Array<T>> }): Array<T> => args.items.flat() as Array<T>

export const flattenMigrations = <T>(args: { migrations: Array<T | Array<T>> }): Array<T> => args.migrations.flat() as Array<T>

type QueryRunnerType = {
  query(query: string, parameters: any[] | undefined, useStructuredResult: true): Promise<any>
  query(query: string, parameters?: any[]): Promise<any>
}

/**
 * It should accept the type QueryRunner from the typeorm
 */
export const enablePostgresUuidExtension = async (queryRunner: QueryRunnerType) => {
  try {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`)
  } catch (error) {
    console.error(
      `Please enable the uuid-ossp.control extension in your PostgreSQL installation. It enables generating V4 UUID and can be found in the postgresql-contrib package`,
    )
    throw error
  }
}
