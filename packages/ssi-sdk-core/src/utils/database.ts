export const flattenArray = <T>(args: { items: Array<T | Array<T>> }): Array<T> => args.items.flat() as Array<T>

export const flattenMigrations = <T>(args: { migrations: Array<T | Array<T>> }): Array<T> => args.migrations.flat() as Array<T>

export type WithTypeOrmQuery =
  ((query: string, parameters?: any[]) => Promise<any>) |
  ((query: string, parameters?: any[], useStructuredResult?: boolean) => Promise<any>)


export const enablePostgresUuidExtension = async (query: WithTypeOrmQuery) => {
  try {
    await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
  } catch (error) {
    console.log(
      `Please enable the uuid-ossp.control extension in your PostgreSQL installation. It enables generating V4 UUID and can be found in the postgresql-contrib package`
    );
    throw error;
  }
}
