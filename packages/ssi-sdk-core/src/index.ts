import EventLogger from './loggers/eventLogger/EventLogger'
import EventLoggerBuilder from './loggers/eventLogger/EventLoggerBuilder'

if (typeof global.crypto === 'undefined') {
  global.crypto = require('crypto')
}

export * from './utils'
export * from './types'
export { KeyAlgo, SuppliedSigner } from './signers'
export * from './link-handlers'

export { EventLogger, EventLoggerBuilder }
