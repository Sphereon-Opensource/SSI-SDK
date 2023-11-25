export const flattenArray = <T>(args: { items: Array<T | Array<T>> }): Array<T> => args.items.flat() as Array<T>

export const flattenMigrations = <T>(args: { migrations: Array<T | Array<T>> }): Array<T> => args.migrations.flat() as Array<T>

/**
 * It should accept queryRunner from the typeorm
 */
export const enablePostgresUuidExtension = async (queryRunner: any) => {
  if (!queryRunner.query) {
    throw new Error("You should pass a QueryRunner object to this function.")
  }
  try {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
  } catch (error) {
    console.log(
      `Please enable the uuid-ossp.control extension in your PostgreSQL installation. It enables generating V4 UUID and can be found in the postgresql-contrib package`
    );
    throw error;
  }
}
