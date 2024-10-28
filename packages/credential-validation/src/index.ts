/**
 * @public
 */
const schema = require('../plugin.schema.json')
export { schema }
export { CredentialValidation, credentialValidationMethods } from './agent/CredentialValidation'
export * from './types/ICredentialValidation'
