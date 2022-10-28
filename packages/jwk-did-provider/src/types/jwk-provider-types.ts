import { IAgentContext, IIdentifier, IKey, IKeyManager, IService, MinimalImportableKey } from '@veramo/core'

export interface IKeyOpts {
  key?: WithRequiredProperty<Partial<MinimalImportableKey>, 'privateKeyHex'> // Optional key to import with only privateKeyHex mandatory. If not specified a key with random kid will be created
  type?: Key // The key type. Defaults to Secp256k1
  use?: KeyUse // The key use
}

// Needed to make a single property required
type WithRequiredProperty<Type, Key extends keyof Type> = Type & {
  [Property in Key]-?: Type[Property]
}

export interface ICreateIdentifierArgs {
  kms?: string
  alias?: string
  options?: IKeyOpts
}

export interface IAddKeyArgs {
  identifier: IIdentifier
  key: IKey
  options?: any
}

export interface IRemoveKeyArgs {
  identifier: IIdentifier
  id: string
  options?: any
}

export interface IRemoveKeyArgs {
  identifier: IIdentifier
  kid: string
  options?: any
}

export interface IAddServiceArgs {
  identifier: IIdentifier
  service: IService
  options?: any
}

export interface IImportProvidedOrGeneratedKeyArgs {
  kms?: string
  options?: IKeyOpts
}

export enum Key {
  Ed25519 = 'Ed25519',
  Secp256k1 = 'Secp256k1',
  Secp256r1 = 'Secp256r1',
}

export enum KeyUse {
  Encryption = 'enc',
  Signature = 'sig',
}

export enum KeyCurve {
  Secp256k1 = 'secp256k1',
  P_256 = 'P-256',
  Ed25519 = 'Ed25519',
}

export enum KeyType {
  EC = 'EC',
  OKP = 'OKP',
}

export enum VerificationType {
  JsonWebKey2020 = 'JsonWebKey2020',
}
export const SIG_KEY_ALGS = ['ES256', 'ES384', 'ES512', 'EdDSA', 'ES256K', 'Ed25519', 'Secp256k1', 'Secp256r1', 'Bls12381G1', 'Bls12381G2']
export const ENC_KEY_ALGS = ['X25519', 'ECDH_ES_A256KW', 'RSA_OAEP_256']

// https://datatracker.ietf.org/doc/html/rfc8812#section-3
// https://datatracker.ietf.org/doc/html/rfc8812#section-4
export enum VocabType {
  Jose = 'https://www.iana.org/assignments/jose#',
}

export enum ContextType {
  DidDocument = 'https://www.w3.org/ns/did/v1',
}

export type IRequiredContext = IAgentContext<IKeyManager>
