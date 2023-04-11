import EventEmitter from 'events'
import { Keyv } from '../../keyv/keyv.js'
export class KeyValueTieredStoreAdapter extends EventEmitter {
  opts
  remote
  local
  iterationLimit
  namespace
  constructor({ remote, local, ...options }) {
    super()
    this.opts = {
      validator: () => true,
      dialect: 'tiered',
      ...options,
    }
    // todo: since we are instantiating a new Keyv object in case we encounter a map, the key prefix applied twice, given it will be part of a an outer keyv object as well.
    // Probably wise to simply create a Map Store class. As it is an in memory construct, and will work in terms of resolution it does not have highest priority
    this.local = isMap(local) ? new Keyv(local) : local
    this.remote = isMap(remote) ? new Keyv(remote) : remote
    this.namespace = this.local.namespace
  }
  async get(key, options) {
    if (Array.isArray(key)) {
      return await this.getMany(key, options)
    }
    const localResult = await this.local.get(key, options)
    if (localResult === undefined || !this.opts.validator(localResult, key)) {
      const remoteResult = await this.remote.get(key, options)
      if (remoteResult !== localResult) {
        const value = !!remoteResult ? (typeof remoteResult === 'object' && 'value' in remoteResult ? remoteResult.value : remoteResult) : undefined
        const ttl =
          !!remoteResult && typeof remoteResult === 'object' && 'expires' in remoteResult && remoteResult.expires
            ? remoteResult.expires - Date.now()
            : undefined
        if (!ttl || ttl > 0) {
          await this.local.set(key, value, ttl)
        } else {
          this.local.delete(key)
        }
      }
      return remoteResult
    }
    return localResult
  }
  async getMany(keys, options) {
    const promises = []
    for (const key of keys) {
      promises.push(this.get(key, options))
    }
    const values = await Promise.all(promises)
    const data = []
    for (const value of values) {
      data.push(value)
    }
    return data
  }
  async set(key, value, ttl) {
    const toSet = ['local', 'remote']
    return Promise.all(toSet.map(async (store) => this[store].set(key, value, ttl)))
  }
  async clear() {
    const toClear = ['local']
    if (!this.opts.localOnly) {
      toClear.push('remote')
    }
    await Promise.all(toClear.map(async (store) => this[store].clear()))
    return undefined
  }
  async delete(key) {
    const toDelete = ['local']
    if (!this.opts.localOnly) {
      toDelete.push('remote')
    }
    const deleted = await Promise.all(toDelete.map(async (store) => this[store].delete(key)))
    return deleted.every(Boolean)
  }
  async deleteMany(keys) {
    const promises = []
    for (const key of keys) {
      promises.push(this.delete(key))
    }
    const values = await Promise.all(promises)
    return values.every(Boolean)
  }
  async has(key) {
    let response
    if (typeof this.local.has === 'function') {
      response = this.local.has(key)
    } else {
      const value = await this.local.get(key)
      response = value !== undefined
    }
    if (!response || !this.opts.validator(response, key)) {
      if (typeof this.remote.has === 'function') {
        response = this.remote.has(key)
      } else {
        const value = await this.remote.get(key)
        response = value !== undefined
      }
    }
    return response
  }
  async *iterator(namespace) {
    const limit = Number.parseInt(this.iterationLimit, 10) || 10
    this.remote.opts.iterationLimit = limit
    if (this.remote && typeof this.remote.iterator === 'function') {
      for await (const entries of this.remote.iterator(namespace)) {
        yield entries
      }
    }
  }
}
function isMap(map) {
  if (map instanceof Map) {
    return true
  } else if (
    map &&
    typeof map.clear === 'function' &&
    typeof map.delete === 'function' &&
    typeof map.get === 'function' &&
    typeof map.has === 'function' &&
    typeof map.set === 'function'
  ) {
    return true
  }
  return false
}
//# sourceMappingURL=index.js.map
