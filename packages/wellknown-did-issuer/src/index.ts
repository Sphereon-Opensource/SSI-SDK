import { DidConfigurationResourceEntity } from './entities/DidConfigurationResourceEntity'

/**
 * @public
 */
const schema = require('../plugin.schema.json')
export { schema }
export { WellKnownDidIssuer } from './agent/WellKnownDidIssuer'
export * from './types/IWellKnownDidIssuer'
export const WellknownDidIssuerEntities = [DidConfigurationResourceEntity]
export { WellknownDidIssuerMigrations } from './migrations'
