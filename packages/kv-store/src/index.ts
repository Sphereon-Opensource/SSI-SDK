/**
 * Provides a {@link @sphereon/ssi-sdk.kv-store-temp#KeyValueStore} for the
 * {@link @veramo/core#Agent} plugin that implements {@link @sphereon/ssi-sdk.kv-store-temp#IKeyValueStore} interface
 *
 * @packageDocumentation
 */
export { KeyValueStore } from './key-value-store'
export * from './store-adapters/tiered/index'
export * from './store-adapters/typeorm/index'
export * from './key-value-types'
