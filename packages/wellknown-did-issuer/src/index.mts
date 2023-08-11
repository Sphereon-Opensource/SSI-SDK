import { DidConfigurationResourceEntity } from './entities/DidConfigurationResourceEntity.mjs'

/**
 * @public
 */
export const schema = require('./plugin.schema.json')
export { WellKnownDidIssuer } from './agent/WellKnownDidIssuer.mjs'
export * from './types/IWellKnownDidIssuer.mjs'
export { WellknownDidIssuerMigrations } from './migrations/index.mjs'
