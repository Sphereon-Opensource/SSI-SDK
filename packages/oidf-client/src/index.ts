import {Loggers} from '@sphereon/ssi-types'

/**
 * @public
 */
const schema = require('../plugin.schema.json')
export { schema }

export const logger = Loggers.DEFAULT.get('sphereon:oidf-client')

export { OIDFClient, oidfClientMethods } from './agent/OIDFClient'

export * from './types/IOIDFClient'
