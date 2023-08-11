export const flattenArray = <T,>(args: { items: Array<T | Array<T>> }): Array<T> => args.items.flat() as Array<T>

export const flattenMigrations = <T,>(args: { migrations: Array<T | Array<T>> }): Array<T> => args.migrations.flat() as Array<T>
