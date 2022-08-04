import { IAgentContext, IKeyManager, IService, MinimalImportableKey } from '@veramo/core'

export interface IKeyOpts {
  purposes: VerificationRelationship[] // In sidetree these are called purposes, but in DID-Core Verification Relationships
  kid?: string // Key ID to assign in case we are importing a key
  key?: MinimalImportableKey // Optional key to import. If not specified a key with random kid will be created
}


export interface ICreateIdentifierOpts {
  keyOpts?: IKeyOpts[]
  services?: IService[]
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
  capabilityInvocation = 'capabilityInvocation'
}

export enum KeyType {
  Ed25519 = 'Ed25519',
  Secp256k1 = 'Secp256k1'
}

export type IRequiredContext = IAgentContext<IKeyManager>
