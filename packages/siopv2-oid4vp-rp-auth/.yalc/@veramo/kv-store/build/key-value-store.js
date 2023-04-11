import { Keyv } from './keyv/keyv.js'
/**
 * Agent plugin that implements {@link @veramo/core-types#IKeyValueStore} interface
 * @public
 */
export class KeyValueStore {
  /**
   * The main keyv typescript port which delegates to the storage adapters and takes care of some common functionality
   *
   * @private
   */
  keyv
  constructor(options) {
    this.keyv = new Keyv(options.uri, options)
  }
  async get(key) {
    const result = await this.keyv.get(key, { raw: false })
    if (result === null || result === undefined) {
      return undefined
    }
    return result
  }
  async getAsValueData(key) {
    const result = await this.keyv.get(key, { raw: true })
    if (result === null || result === undefined) {
      // We always return a ValueData object for this method
      return { value: undefined, expires: undefined }
    }
    return this.toDeserializedValueData(result)
  }
  async getMany(keys) {
    if (!keys || keys.length === 0) {
      return []
    }
    let result = await this.keyv.getMany(keys, { raw: false })
    // Making sure we return the same array length as the amount of key(s) passed in
    if (result === null || result === undefined || result.length === 0) {
      result = new Array()
      for (const key of keys) {
        result.push(undefined)
      }
    }
    return result.map((v) => (!!v ? v : undefined))
  }
  async getManyAsValueData(keys) {
    if (!keys || keys.length === 0) {
      return []
    }
    let result = await this.keyv.getMany(keys, { raw: true })
    // Making sure we return the same array length as the amount of key(s) passed in
    if (result === null || result === undefined || result.length === 0) {
      result = new Array()
      for (const key of keys) {
        result.push({ value: undefined, expires: undefined })
      }
    }
    return result.map((v) => (!!v ? this.toDeserializedValueData(v) : { value: undefined, expires: undefined }))
  }
  async set(key, value, ttl) {
    return this.keyv.set(key, value, ttl).then(() => this.getAsValueData(key))
  }
  async has(key) {
    return this.keyv.has(key)
  }
  async delete(key) {
    return this.keyv.delete(key)
  }
  async deleteMany(keys) {
    return Promise.all(keys.map((key) => this.keyv.delete(key)))
  }
  async clear() {
    return this.keyv.clear().then(() => this)
  }
  async disconnect() {
    return this.keyv.disconnect()
  }
  // Public so parties using the kv store directly can add listeners if they want
  async kvStoreOn(args) {
    this.keyv.on(args.eventName, args.listener)
    return this
  }
  toDeserializedValueData(result) {
    if (result === null || result === undefined) {
      throw Error(`Result cannot be undefined or null at this this point`)
    } else if (typeof result !== 'object') {
      return { value: result, expires: undefined }
    } else if (!('value' in result)) {
      return { value: result, expires: undefined }
    }
    if (!('expires' in result)) {
      result.expires = undefined
    }
    return result
  }
}
//# sourceMappingURL=key-value-store.js.map
