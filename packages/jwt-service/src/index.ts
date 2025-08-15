import { Loggers } from '@sphereon/ssi-types'

/**
 * @internal
 */
const schema = require('../plugin.schema.json')
export { schema }

export const JwtLogger = Loggers.DEFAULT.get('sphereon:sdk:jwt')
/**
 * @public
 */
export { JwtService } from './agent/JwtService'
export * from './functions'
export * from './types/IJwtService'
