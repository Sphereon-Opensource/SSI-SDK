import { Loggers, LogLevel, LogMethod } from '@sphereon/ssi-types'

export const logger = Loggers.DEFAULT.options('sphereon:ebsi-support', {
  defaultLogLevel: LogLevel.DEBUG,
  methods: [LogMethod.CONSOLE, LogMethod.DEBUG_PKG],
}).get('sphereon:ebsi-support')
const schema = require('../plugin.schema.json')
export { schema }
export { EbsiSupport, ebsiSupportMethods } from './agent/EbsiSupport'
export * from './types/IEbsiSupport'
export { EbsiDidProvider } from './did'
