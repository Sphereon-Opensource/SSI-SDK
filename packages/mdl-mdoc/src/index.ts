import { Loggers } from '@sphereon/ssi-types'

export const logger = Loggers.DEFAULT.get('sphereon:mdl-mdoc')
const schema = require('../plugin.schema.json')
export { schema }
export { MDLMdoc, mdocSupportMethods } from './agent/mDLMdoc'
export * from './types/ImDLMdoc'
