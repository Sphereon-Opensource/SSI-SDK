/**
 * Provides a {@link @sphereon/ssi-sdk.kv-store-temp#KeyValueStore} for the
 * {@link @veramo/core#Agent} plugin that implements {@link @sphereon/ssi-sdk.kv-store-temp#IKeyValueStore} interface
 *
 * @packageDocumentation
 */
export { KeyValueStore } from './key-value-store.mjs'
export * from './store-adapters/tiered/index.mjs'
export * from './store-adapters/typeorm/index.mjs'
export * from './key-value-types.mjs'
