import { Loggers } from '@sphereon/ssi-types'

/**
 * @public
 */
const schema = require('../plugin.schema.json')
export { schema }

export const logger = Loggers.DEFAULT.get('sphereon:credential-store')

export { CredentialStore, credentialStoreMethods } from './agent/CredentialStore'
export {
  CredentialRole,
  CredentialStateType,
  CredentialCorrelationType,
  CredentialDocumentFormat,
  DocumentType,
  DigitalCredential,
  FindDigitalCredentialArgs,
} from '@sphereon/ssi-sdk.data-store'
export * from './types/ICredentialStore'
export * from './types/claims'
export * from './utils/filters'
