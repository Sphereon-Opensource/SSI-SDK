/**
 * @public
 */
const schema = require('../plugin.schema.json')
export { schema }
export { ConnectionManager } from './agent/ConnectionManager'
export { AbstractConnectionStore } from './store/AbstractConnectionStore'
export * from './types/IConnectionManager'
