/**
 * @public
 */
const schema = require('../plugin.schema.json')
export { schema }
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
export * from './types/filters'
