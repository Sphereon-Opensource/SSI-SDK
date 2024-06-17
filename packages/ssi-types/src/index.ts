import { Loggers } from './logging'
// We call the logger first, making sure that any library (re-)using the logger has the static initialized
Loggers.DEFAULT.get('sphereon:ssi').debug(`Sphereon logger initialized`)

export * from './logging'
export * from './events'
export * from './types'
export * from './utils'
export * from './mapper'
