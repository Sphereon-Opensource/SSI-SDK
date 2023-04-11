import EventEmitter from 'events'
import { In, Like } from 'typeorm'
import { KeyValueStoreEntity } from './entities/keyValueStoreEntity.js'
import JSONB from 'json-buffer'
export class KeyValueTypeORMStoreAdapter extends EventEmitter {
  dbConnection
  namespace
  opts
  constructor(options) {
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
  async get(key, options) {
    if (Array.isArray(key)) {
      return this.getMany(key, options)
    }
    const connection = await getConnectedDb(this.dbConnection)
    const result = await connection.getRepository(KeyValueStoreEntity).findOneBy({
      key,
    })
    return options?.raw !== true || !result ? result?.data : { value: result?.data, expires: result?.expires }
  }
  async getMany(keys, options) {
    const connection = await getConnectedDb(this.dbConnection)
    const results = await connection.getRepository(KeyValueStoreEntity).findBy({
      key: In(keys),
    })
    const values = keys.map(async (key) => {
      const result = results.find((result) => result.key === key)
      return options?.raw !== true || !result
        ? result?.data
        : {
            value: result?.data ? (await this.opts.deserialize(result.data))?.value : undefined,
            expires: result?.expires,
          }
    })
    return Promise.all(values)
  }
  async set(key, value, ttl) {
    const connection = await getConnectedDb(this.dbConnection)
    const entity = new KeyValueStoreEntity()
    entity.key = key
    entity.data = value
    entity.expires = ttl
    await connection.getRepository(KeyValueStoreEntity).save(entity)
    return { value: value, expires: ttl }
  }
  async delete(key) {
    if (Array.isArray(key)) {
      return this.deleteMany(key)
    }
    const connection = await getConnectedDb(this.dbConnection)
    const result = await connection.getRepository(KeyValueStoreEntity).delete({ key })
    return result.affected === 1
  }
  async deleteMany(keys) {
    const connection = await getConnectedDb(this.dbConnection)
    const results = await connection.getRepository(KeyValueStoreEntity).delete({
      key: In(keys),
    })
    return !!results.affected && results.affected >= 1
  }
  async clear() {
    const connection = await getConnectedDb(this.dbConnection)
    await connection.getRepository(KeyValueStoreEntity).delete({
      key: Like(`${this.namespace}:%`),
    })
  }
  async has(key) {
    const connection = await getConnectedDb(this.dbConnection)
    const result = await connection.getRepository(KeyValueStoreEntity).countBy({
      key,
    })
    return result === 1
  }
  async disconnect() {
    const connection = await getConnectedDb(this.dbConnection)
    connection.destroy()
  }
}
/**
 *  Ensures that the provided DataSource is connected.
 *
 * @param dbConnection - a TypeORM DataSource or a Promise that resolves to a DataSource
 */
export async function getConnectedDb(dbConnection) {
  if (dbConnection instanceof Promise) {
    return await dbConnection
  } else if (!dbConnection.isInitialized) {
    return await dbConnection.initialize()
  } else {
    return dbConnection
  }
}
//# sourceMappingURL=index.js.map
