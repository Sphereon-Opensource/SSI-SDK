import { PresentationSubmission } from './pex'
import { IProofPurpose, IProofType } from './did'

export interface ICredential {
  // If exp is present, the UNIX timestamp MUST be converted to an [XMLSCHEMA11-2] date-time, and MUST be used to set the value of the expirationDate property of credentialSubject of the new JSON object.
  expirationDate?: string
  // If iss is present, the value MUST be used to set the issuer property of the new credential JSON object or the holder property of the new presentation JSON object.
  issuer: string | IIssuer
  // If nbf is present, the UNIX timestamp MUST be converted to an [XMLSCHEMA11-2] date-time, and MUST be used to set the value of the issuanceDate property of the new JSON object.
  issuanceDate: string
  // If sub is present, the value MUST be used to set the value of the id property of credentialSubject of the new credential JSON object.
  credentialSubject: ICredentialSubject
  // If jti is present, the value MUST be used to set the value of the id property of the new JSON object.
  id?: string
  '@context': ICredentialContextType[] | ICredentialContextType
  credentialStatus?: ICredentialStatus
  credentialSchema?: undefined | ICredentialSchemaType | ICredentialSchemaType[]
  description?: string
  name?: string
  type: string[]

  [x: string]: unknown
}

export interface ICredentialSubject {
  id?: string

  [x: string]: unknown
}

export type ICredentialContextType = ICredentialContext | string

export interface ICredentialContext {
  name?: string
  did?: string
  [x: string]: unknown
}

export type ICredentialSchemaType = ICredentialSchema | string

export interface ICredentialSchema {
  id: string
  type?: string
}

export interface IProof {
  type: IProofType | string // The proof type
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

export interface ICredentialStatus {
  id: string
  type: string
}

export interface IIssuer {
  id: string

  [x: string]: unknown
}

export interface IHasProof {
  proof: IProof | IProof[]
}

export type IVerifiableCredential = ICredential & IHasProof

export interface IPresentation {
  id?: string
  '@context': ICredentialContextType | ICredentialContextType[]
  type: string[]
  verifiableCredential: IVerifiableCredential[]
  presentation_submission?: PresentationSubmission
  holder?: string
}

export type IVerifiablePresentation = IPresentation & IHasProof

export interface WrappedVerifiableCredential {
  /**
   * Original VC that we've received
   */
  original: string | JwtWrappedVerifiableCredential | IVerifiableCredential
  /**
   * In case of JWT credential it will be the decoded version. In other cases it will be the same as original one
   */
  decoded: JwtWrappedVerifiableCredential | IVerifiableCredential
  /**
   * Type of this credential. Supported types are json-ld and jwt
   */
  type: VerifiableDataExchangeType
  /**
   * created based on https://www.w3.org/TR/vc-data-model/#jwt-decoding
   */
  internalCredential: ICredential
}

export interface WrappedVerifiablePresentation {
  original: string | JwtWrappedVerifiablePresentation | IVerifiablePresentation
  decoded: JwtWrappedVerifiablePresentation | IVerifiablePresentation
  type: VerifiableDataExchangeType
  internalPresentation: InternalPresentation
  vcs: WrappedVerifiableCredential[]
}

export enum VerifiableDataExchangeType {
  JSONLD,
  JWT_ENCODED,
  JWT_DECODED,
}

export interface InternalPresentation {
  '@context': ICredentialContextType | ICredentialContextType[]
  type: string[]
  verifiableCredential: WrappedVerifiableCredential[]
  presentation_submission?: PresentationSubmission
  holder?: string
}

export interface JwtWrappedVerifiableCredential {
  vc: ICredential
  exp: string
  iss: string
  nbf: string
  sub: string
  jti: string
}

export interface JwtWrappedVerifiablePresentation {
  vp: IVerifiablePresentation
  exp: string
  iss: string
  nbf: string
  sub: string
  jti: string
}
