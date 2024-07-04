import { Loggers } from '@sphereon/ssi-types'

export const logger = Loggers.DEFAULT.get('sphereon:ebsi-support')
const schema = require('../plugin.schema.json')
export { schema }
export { EbsiSupport } from './agent/EbsiSupport'
export * from './types/IEbsiSupport'
export { EbsiDidProvider } from './did'
