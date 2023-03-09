import {
  VerifiablePresentation,
  CompactJWT,
  UnsignedCredential,
  CredentialSubject,
  VerifiableCredential,
  UnsignedPresentation,
  ProofType,
  CredentialStatusReference,
} from '@veramo/core'

import { IProofPurpose, IProofType, PresentationSubmission } from '@sphereon/ssi-types'

export type W3CVerifiablePresentationSP = VerifiablePresentation | VerifiablePresentationSP | CompactJWT
export type W3CVerifiableCredentialSP = VerifiableCredential | VerifiableCredentialSP | CompactJWT

export interface CredentialStatusSP extends CredentialStatusReference {
  id: string
  type: string
  revocationListIndex?: string
  revocationListCredential?: string
}

/*export interface ICredentialIssuer {
  id: string

  [x: string]: unknown
}*/

/*export interface ICredentialSubject {
  id?: string

  [x: string]: unknown
}*/

export interface CredentialProofSP extends ProofType {
  type: string | IProofType // The proof type
  created: string // The ISO8601 date-time string for creation
  proofPurpose: IProofPurpose | string // The specific intent for the proof
  verificationMethod: string // A set of parameters required to independently verify the proof
  challenge?: string // A challenge to protect against replay attacks
  domain?: string // A string restricting the (usage of a) proof to the domain and protects against replay attacks
  proofValue?: string // One of any number of valid representations of proof values
  jws?: string // JWS based proof
  nonce?: string // Similar to challenge. A nonce to protect against replay attacks, used in some ZKP proofs
  requiredRevealStatements?: string[] // The parts of the proof that must be revealed in a derived proof

  [x: string]: string | string[] | undefined
}

export interface UnsignedCredentialSP extends UnsignedCredential {
  credentialSubject: CredentialSubject[] | CredentialSubject
  credentialStatus?: CredentialStatusSP
  validFrom?: string
  validUntil?: string
}

export interface VerifiableCredentialSP extends UnsignedCredentialSP {
  proof: CredentialProofSP | CredentialProofSP[] | ProofType
}

export interface UnsignedPresentationSP extends UnsignedPresentation {
  type: string[] | string
  verifiableCredential: W3CVerifiableCredentialSP[]
  presentation_submission?: PresentationSubmission

  [x: string]: any
}

export interface VerifiablePresentationSP extends UnsignedPresentationSP {
  // Last one is from Veramo
  proof: CredentialProofSP | CredentialProofSP[] | ProofType
}
