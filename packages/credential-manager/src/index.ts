/**
 * @public
 */
const schema = require('../plugin.schema.json')
export { schema }
export { CredentialManager, credentialManagerMethods } from './agent/CredentialManager'
export {
  CredentialRole,
  CredentialStateType,
  CredentialCorrelationType,
  CredentialDocumentFormat,
  DocumentType,
  DigitalCredential,
  FindDigitalCredentialArgs,
} from '@sphereon/ssi-sdk.data-store'
export * from './types/ICredentialManager'
export * from './types/claims'
export * from './types/filters'
