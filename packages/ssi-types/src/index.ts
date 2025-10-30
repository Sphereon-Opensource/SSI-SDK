import { Loggers } from './logging'
// We call the logger first, making sure that any library (re-)using the logger has the static initialized
const logger = Loggers.DEFAULT.get('sphereon:ssi')
logger.debug(`Sphereon logger initialized`)

export type * from './types'
export * from './types/datastore' // (not export "type")
export * from './logging'
export * from './events'
export * from './utils'
export * from './mapper'
