import { Loggers } from '@sphereon/ssi-types'

/**
 * @public
 */
const schema = require('../plugin.schema.json')
export { schema }

export const logger = Loggers.DEFAULT.get('sphereon:credential-store')

export { CredentialStore, credentialStoreMethods } from './agent/CredentialStore'
export {
  CredentialStateType,
  CredentialCorrelationType,
  CredentialDocumentFormat,
  DocumentType,
  type DigitalCredential,
  type FindDigitalCredentialArgs,
} from '@sphereon/ssi-sdk.data-store'
export { CredentialRole } from '@sphereon/ssi-types'
export * from './types/ICredentialStore'
export * from './types/claims'
export * from './utils/filters'
