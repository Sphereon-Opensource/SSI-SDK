/**
 * Provides a {@link @veramo/kv-store#KeyValueStore} for the
 * {@link @veramo/core#Agent} plugin that implements {@link @veramo/kv-store#IKeyValueStore} interface
 *
 * @packageDocumentation
 */
export { KeyValueStore } from './key-value-store'
export * from './store-adapters/tiered/index'
export * from './store-adapters/typeorm/index'
export * from './key-value-types'
