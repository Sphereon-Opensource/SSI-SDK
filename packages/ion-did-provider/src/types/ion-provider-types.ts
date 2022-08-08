import { IAgentContext, IKey, IKeyManager, IService, MinimalImportableKey } from '@veramo/core'
import { IonPublicKeyPurpose, IonPublicKeyModel, JwkEs256k } from '@decentralized-identity/ion-sdk'

export type IContext = IAgentContext<IKeyManager>

export interface VerificationMethod extends KeyOpts {
  purposes: IonPublicKeyPurpose[] // In sidetree these are called purposes, but in DID-Core Verification Relationships
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
  actionId: number // Unique number denoting the action. Used for ordering internally. Suggested to use current timestamp
  anchor?: boolean
}

export interface IAddKeyOpts extends IUpdateOpts {
  purposes: IonPublicKeyPurpose[] // In sidetree these are called purposes, but in DID-Core Verification Relationships
}

export interface IUpdateOpts {
  actionId: number // Unique number denoting the action. Used for ordering internally. Suggested to use current timestamp
}

export interface IonKeyMetadata {
  purposes?: IonPublicKeyPurpose[]
  actionId: number // Unique number denoting the action. Used for ordering internally. Suggested to use current timestamp
  relation: KeyIdentifierRelation
  commitment?: string // Commitment value in case this is an update or recovery key. Used to get latest update/recovery keys
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

export enum IonDidForm {
  LONG = 'long',
  SHORT = 'short',
}

export interface IIonJwkPair {
  publicKeyJwk?: JwkEs256k
  privateKeyJwk?: JwkEs256k
}

export interface IKeyRotation {
  currentVeramoKey: IKey
  currentIonKey: IonPublicKeyModel
  currentJwk: JwkEs256k
  nextIonKey: IonPublicKeyModel
  nextJwk: JwkEs256k
  nextVeramoKey: IKey
}

export type IRequiredContext = IAgentContext<IKeyManager>
