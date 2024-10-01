import Debug from 'debug'
import { DataSource } from 'typeorm'
import { BaseDataSourceOptions } from 'typeorm/data-source/BaseDataSourceOptions'

import { DataSourceOptions } from 'typeorm/data-source/DataSourceOptions'

const debug = Debug(`sphereon:ssi-sdk:database`)

export class DataSources {
  get defaultDbType(): SupportedDatabaseType {
    return this._defaultDbType
  }

  set defaultDbType(value: SupportedDatabaseType) {
    this._defaultDbType = value
  }
  private dataSources = new Map<string, DataSource>()
  private configs = new Map<string, DataSourceOptions>()
  private _defaultDbType: SupportedDatabaseType = 'sqlite'

  private static singleton: DataSources

  public static singleInstance() {
    if (!DataSources.singleton) {
      DataSources.singleton = new DataSources()
    }
    return DataSources.singleton
  }

  public static newInstance(configs?: Map<string, DataSourceOptions>) {
    return new DataSources(configs)
  }

  private constructor(configs?: Map<string, DataSourceOptions>) {
    ;(configs ?? new Map<string, DataSourceOptions>()).forEach((config, name) => this.addConfig(name, config))
  }

  addConfig(dbName: string, config: DataSourceOptions): this {
    this.configs.set(dbName, config)
    // yes we are aware last one wins
    this._defaultDbType = config.type as SupportedDatabaseType
    return this
  }

  deleteConfig(dbName: string): this {
    this.configs.delete(dbName)
    return this
  }
  has(dbName: string) {
    return this.configs.has(dbName) && this.dataSources.has(dbName)
  }

  delete(dbName: string): this {
    this.deleteConfig(dbName)
    this.dataSources.delete(dbName)
    return this
  }

  getConfig(dbName: string): BaseDataSourceOptions {
    const config = this.configs.get(dbName)
    if (!config) {
      throw Error(`No DB config found for ${dbName}`)
    }
    return config
  }

  public getDbNames(): string[] {
    return [...this.configs.keys()]
  }

  async getDbConnection(dbName: string): Promise<DataSource> {
    const config = this.getConfig(dbName)
    if (!this._defaultDbType) {
      this._defaultDbType = config.type as SupportedDatabaseType
    }
    /*if (config.synchronize) {
                return Promise.reject(
                    `WARNING: Automatic migrations need to be disabled in this app! Adjust the database configuration and set synchronize to false`
                )
            }*/

    let dataSource = this.dataSources.get(dbName)
    if (dataSource) {
      return dataSource
    }

    dataSource = await new DataSource({ ...(config as DataSourceOptions), name: dbName }).initialize()
    this.dataSources.set(dbName, dataSource)
    if (config.synchronize) {
      debug(`WARNING: Automatic migrations need to be disabled in this app! Adjust the database configuration and set synchronize to false`)
    } else if (config.migrationsRun) {
      debug(
        `Migrations are currently managed from config. Please set migrationsRun and synchronize to false to get consistent behaviour. We run migrations from code explicitly`,
      )
    } else {
      debug(`Running ${dataSource.migrations.length} migration(s) from code if needed...`)
      await dataSource.runMigrations()
      debug(`${dataSource.migrations.length} migration(s) from code were inspected and applied`)
    }
    return dataSource
  }
}

export type SupportedDatabaseType = 'postgres' | 'sqlite' | 'react-native'
export type DateTimeType = 'timestamp' | 'datetime'

export type DateType = 'date'

/**
 * Gets the database connection.
 *
 * Also makes sure that migrations are run (versioning for DB schema's), so we can properly update over time
 *
 * @param connectionName The database name
 * @param opts
 */
export const getDbConnection = async (
  connectionName: string,
  opts?: {
    config: BaseDataSourceOptions | any
  },
): Promise<DataSource> => {
  if (!DataSources.singleInstance().has(connectionName) && opts?.config) {
    DataSources.singleInstance().addConfig(connectionName, opts?.config)
  }
  return DataSources.singleInstance().getDbConnection(connectionName)
}

export const dropDatabase = async (dbName: string): Promise<void> => {
  if (!DataSources.singleInstance().has(dbName)) {
    return Promise.reject(Error(`No database present with name: ${dbName}`))
  }

  const connection: DataSource = await getDbConnection(dbName)
  await connection.dropDatabase()
  DataSources.singleInstance().delete(dbName)
}

/**
 * Runs a migration down (drops DB schema)
 * @param dataSource
 */
export const revertMigration = async (dataSource: DataSource): Promise<void> => {
  if (dataSource.isInitialized) {
    await dataSource.undoLastMigration()
  } else {
    console.error('DataSource is not initialized')
  }
}
export const resetDatabase = async (dbName: string): Promise<void> => {
  await dropDatabase(dbName)
  await getDbConnection(dbName)
}
