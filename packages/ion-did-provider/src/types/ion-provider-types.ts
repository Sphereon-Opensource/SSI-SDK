import { IAgentContext, IKeyManager, IService, MinimalImportableKey } from '@veramo/core'

export interface VerificationMethod extends KeyOpts {
  purposes: VerificationRelationship[] // In sidetree these are called purposes, but in DID-Core Verification Relationships
}

export interface KeyOpts {
  kid?: string // Key ID to assign in case we are importing a key
  key?: MinimalImportableKey // Optional key to import. If not specified a key with random kid will be created
  type?: KeyType // The key type. Defaults to Secp256k1
}

export interface ICreateIdentifierOpts {
  verificationMethods?: VerificationMethod[]
  recoveryKey?: KeyOpts
  updateKey?: KeyOpts
  services?: IService[]
  anchor?: boolean
}

export interface IIonPublicKey {
  id: string
  type: string
  publicKeyJwk: any
  // In sidetree these are called purposes, but in DID-Core Verification Relationships
  purposes: VerificationRelationship[]
}

// see: https://w3c.github.io/did-core/#verification-relationships
export enum VerificationRelationship {
  authentication = 'authentication',
  keyAgreement = 'keyAgreement',
  assertionMethod = 'assertionMethod',
  capabilityDelegation = 'capabilityDelegation',
  capabilityInvocation = 'capabilityInvocation',
}

export enum KeyType {
  Ed25519 = 'Ed25519',
  Secp256k1 = 'Secp256k1',
}

export enum KeyIdentifierRelation {
  RECOVERY = 'recovery',
  UPDATE = 'update',
  DID = 'did',
}

export interface IIonKeyPair {
  publicJwk: ISecp256k1PublicKeyJwk
  privateJwk: ISecp256k1PrivateKeyJwk
}

/** Secp256k1 Private Key  */
export interface ISecp256k1PrivateKeyJwk {
  /** key type */
  kty: string
  /** curve */
  crv: string
  /** private point */
  d: string
  /** public point */
  x: string
  /** public point */
  y: string
  /** key id */
  kid: string
}

/** Secp256k1 Public Key  */
export interface ISecp256k1PublicKeyJwk {
  /** key type */
  kty: string
  /** curve */
  crv: string
  /** public point */
  x: string
  /** public point */
  y: string
  /** key id */
  kid: string
}

export type IRequiredContext = IAgentContext<IKeyManager>
