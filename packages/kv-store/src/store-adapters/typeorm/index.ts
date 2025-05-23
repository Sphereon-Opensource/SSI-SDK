import { EventEmitter } from 'events'
import { OrPromise } from '@veramo/utils'
import { DataSource, In, Like } from 'typeorm'
import { KeyValueStoreEntity } from './entities/keyValueStoreEntity'
import { KeyValueTypeORMOptions, Options_ } from './types'
import { KeyvStore, KeyvStoredData } from '../../keyv/keyv-types'
import { IKeyValueStoreAdapter } from '../../key-value-types'
import JSONB from 'json-buffer'
export { KeyValueStoreEntity } from './entities/keyValueStoreEntity'
export { kvStoreMigrations } from './migrations/index'

/**
 * TypeORM based key value store adapter
 * @beta
 */
export class KeyValueTypeORMStoreAdapter extends EventEmitter implements KeyvStore<string>, IKeyValueStoreAdapter<string> {
  private readonly dbConnection: OrPromise<DataSource>
  readonly namespace: string
  opts: Options_<string>

  constructor(options: KeyValueTypeORMOptions) {
    super()
    this.dbConnection = options.dbConnection
    this.namespace = options.namespace || 'keyv'
    this.opts = {
      validator: () => true,
      dialect: 'typeorm',
      serialize: JSONB.stringify,
      deserialize: JSONB.parse,
      ...options,
    }
  }

  async get(key: string | string[], options?: { raw?: boolean }): Promise<KeyvStoredData<string> | Array<KeyvStoredData<string>>> {
    if (Array.isArray(key)) {
      return this.getMany(key, options)
    }
    const connection = await _getConnectedDb(this.dbConnection)
    const result = await connection.getRepository(KeyValueStoreEntity).findOneBy({
      key,
    })
    return options?.raw !== true || !result ? result?.data : { value: result?.data, expires: result?.expires }
  }

  async getMany(keys: string[], options?: { raw?: boolean }): Promise<Array<KeyvStoredData<string>>> {
    const connection = await _getConnectedDb(this.dbConnection)
    const results = await connection.getRepository(KeyValueStoreEntity).findBy({
      key: In(keys),
    })
    const values = keys.map(async (key) => {
      const result = results.find((result) => result.key === key)
      return options?.raw !== true || !result
        ? (result?.data as KeyvStoredData<string>)
        : ({
            value: result?.data ? (await this.opts.deserialize(result.data))?.value : undefined,
            expires: result?.expires,
          } as KeyvStoredData<string>)
    })

    return Promise.all(values)
  }

  async set(key: string, value: string, ttl?: number): Promise<KeyvStoredData<string>> {
    const connection = await _getConnectedDb(this.dbConnection)
    const entity = new KeyValueStoreEntity()
    entity.key = key
    entity.data = value
    entity.expires = ttl
    await connection.getRepository(KeyValueStoreEntity).save(entity)
    return { value: value, expires: ttl }
  }

  async delete(key: string | string[]): Promise<boolean> {
    if (Array.isArray(key)) {
      return this.deleteMany(key)
    }
    const connection = await _getConnectedDb(this.dbConnection)
    const result = await connection.getRepository(KeyValueStoreEntity).delete({ key })
    return result.affected === 1
  }

  async deleteMany(keys: string[]): Promise<boolean> {
    const connection = await _getConnectedDb(this.dbConnection)
    const results = await connection.getRepository(KeyValueStoreEntity).delete({
      key: In(keys),
    })
    return !!results.affected && results.affected >= 1
  }

  async clear(): Promise<void> {
    const connection = await _getConnectedDb(this.dbConnection)
    await connection.getRepository(KeyValueStoreEntity).delete({
      key: Like(`${this.namespace}:%`),
    })
  }

  async has(key: string): Promise<boolean> {
    const connection = await _getConnectedDb(this.dbConnection)
    const result = await connection.getRepository(KeyValueStoreEntity).countBy({
      key,
    })
    return result === 1
  }

  async disconnect(): Promise<void> {
    const connection = await _getConnectedDb(this.dbConnection)
    await connection.destroy()
  }
}

/**
 *  Ensures that the provided DataSource is connected.
 *
 * @param dbConnection - a TypeORM DataSource or a Promise that resolves to a DataSource
 * @internal
 */
export async function _getConnectedDb(dbConnection: OrPromise<DataSource>): Promise<DataSource> {
  if (dbConnection instanceof Promise) {
    return await dbConnection
  } else if (!dbConnection.isInitialized) {
    return await (<DataSource>dbConnection).initialize()
  } else {
    return dbConnection
  }
}
