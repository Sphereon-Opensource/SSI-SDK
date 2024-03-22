import Debug from 'debug'
import { DataSource } from 'typeorm'
import { BaseDataSourceOptions } from 'typeorm/data-source/BaseDataSourceOptions'
import { DataSourceOptions } from 'typeorm/data-source/DataSourceOptions'

const debug = Debug(`demo:databaseService`)

export class DataSources {
  private dataSources = new Map<string, DataSource>()
  private configs

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
    this.configs = configs ?? new Map<string, BaseDataSourceOptions>()
  }

  addConfig(dbName: string, config: DataSourceOptions): this {
    this.configs.set(dbName, config)
    return this
  }

  deleteConfig(dbName: string): this {
    this.configs.delete(dbName)
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
