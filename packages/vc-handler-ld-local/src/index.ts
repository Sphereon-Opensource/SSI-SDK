/**
 * @public
 */
const schema = require('../plugin.schema.json')
export { schema }
export {
  SphereonBbsBlsSignature2020,
  SphereonEd25519Signature2018,
  SphereonEd25519Signature2020,
  SphereonEcdsaSecp256k1RecoverySignature2020,
} from './suites'
export { CredentialHandlerLDLocal } from './agent/CredentialHandlerLDLocal'
export * from './types/ICredentialHandlerLDLocal'
