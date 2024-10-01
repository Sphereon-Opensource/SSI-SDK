import { DataSources, DateTimeType, DateType, SupportedDatabaseType } from './dataSources'

export const getDbType = (opts?: { defaultType: SupportedDatabaseType }): SupportedDatabaseType => {
  const type = (typeof process === 'object' ? process?.env?.DB_TYPE : undefined) ?? DataSources.singleInstance().defaultDbType ?? opts?.defaultType
  if (!type) {
    throw Error(`Could not determine DB type. Please set the DB_TYPE global variable or env var to one of 'postgres' or 'sqlite'`)
  }
  return type as SupportedDatabaseType
}

export const typeOrmDateTime = (opts?: { defaultType: SupportedDatabaseType }): DateTimeType => {
  switch (getDbType(opts)) {
    case 'postgres':
      return 'timestamp'
    case 'sqlite':
    case 'react-native':
      return 'datetime'
    default:
      throw Error(`DB type ${getDbType(opts)} not supported. Right now only sqlite, react-native and postgresql are supported`)
  }
}

export const typeormDate = (opts?: { defaultType: SupportedDatabaseType }): DateType => {
  // The same for both DBs
  return 'date'
}
