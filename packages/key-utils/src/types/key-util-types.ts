import type { IKey, MinimalImportableKey } from '@veramo/core'

export const JWK_JCS_PUB_NAME = 'jwk_jcs-pub' as const
export const JWK_JCS_PUB_PREFIX = 0xeb51

export type TKeyType = 'Ed25519' | 'Secp256k1' | 'Secp256r1' | 'Secp384r1' | 'Secp521r1' | 'X25519' | 'Bls12381G1' | 'Bls12381G2' | 'RSA'

export enum Key {
  Ed25519 = 'Ed25519',
  Secp256k1 = 'Secp256k1',
  Secp256r1 = 'Secp256r1',
}

export enum JwkKeyUse {
  Encryption = 'enc',
  Signature = 'sig',
}

export const SIG_KEY_ALGS = ['ES256', 'ES384', 'ES512', 'EdDSA', 'ES256K', 'Ed25519', 'Secp256k1', 'Secp256r1', 'Bls12381G1', 'Bls12381G2']
export const ENC_KEY_ALGS = ['X25519', 'ECDH_ES_A256KW', 'RSA_OAEP_256']

export type KeyVisibility = 'public' | 'private'

export interface X509Opts {
  cn?: string // The certificate Common Name. Will be used as the KID for the private key. Uses alias if not provided.
  privateKeyPEM?: string // Optional as you also need to provide it in hex format, but advisable to use it
  certificatePEM?: string // Optional, as long as the certificate then is part of the certificateChainPEM
  certificateChainURL?: string // Certificate chain URL. If used this is where the certificateChainPEM will be hosted/found.
  certificateChainPEM?: string // Base64 (not url!) encoded DER certificate chain. Please provide even if certificateChainURL is used!
}

export interface IImportProvidedOrGeneratedKeyArgs {
  kms?: string
  alias?: string
  options?: IKeyOpts
}
export interface IKeyOpts {
  key?: Partial<MinimalImportableKey> // Optional key to import with only privateKeyHex mandatory. If not specified a key with random kid will be created
  type?: Exclude<TKeyType, 'Secp384r1' | 'Secp521r1'> // The key type. Defaults to Secp256k1. The exclude is there as we do not support it yet for key generation
  use?: JwkKeyUse // The key use
  x509?: X509Opts
}
/*
// Needed to make a single property required
type WithRequiredProperty<Type, Key extends keyof Type> = Type & {
  [Property in Key]-?: Type[Property]
}*/

export type SignatureAlgorithmFromKeyArgs = {
  key: IKey
}

export type SignatureAlgorithmFromKeyTypeArgs = {
  type: TKeyType
}

export type KeyTypeFromCryptographicSuiteArgs = {
  crv?: string
  kty?: string
  alg?: string
}
