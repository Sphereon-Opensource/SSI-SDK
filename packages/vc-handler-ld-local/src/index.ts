/**
 * @public
 */
const schema = require('../plugin.schema.json')
export { schema }
export {
  BbsBlsSignature2020,
  SphereonEd25519Signature2018,
  SphereonEd25519Signature2020,
  SphereonEcdsaSecp256k1RecoverySignature2020,
  SphereonJsonWebSignature2020,
} from './suites'
export * from './ld-credential-module'
export * from './ld-context-loader'
export * from './ld-suite-loader'
export * from './ld-default-contexts'
export * from './ld-document-loader'
export { CredentialHandlerLDLocal } from './agent/CredentialHandlerLDLocal'
export * from './types/ICredentialHandlerLDLocal'
