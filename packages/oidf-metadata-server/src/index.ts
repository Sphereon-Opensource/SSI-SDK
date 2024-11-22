import { Loggers, LogLevel, LogMethod } from '@sphereon/ssi-types'

export const logger = Loggers.DEFAULT.options('sphereon:oidf-metadata-server', {
  defaultLogLevel: LogLevel.DEBUG,
  methods: [LogMethod.CONSOLE, LogMethod.DEBUG_PKG],
}).get('sphereon:oidf-metadata-server')

/**
 * @public
 */
const schema = require('../plugin.schema.json')
export { schema }

export * from './oidf-metadata-store'
export * from './types/metadata-store'
export * from './oidf-metadata-server'
