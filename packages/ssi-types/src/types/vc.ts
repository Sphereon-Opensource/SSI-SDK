import { PresentationSubmission } from './pex'
import { IProofPurpose, IProofType } from './did'

export type AdditionalClaims = Record<string, any>

export type IIssuerId = string

export interface ICredential {
  '@context': ICredentialContextType | ICredentialContextType[]
  type: string[]
  credentialSchema?: undefined | ICredentialSchemaType | ICredentialSchemaType[]
  // If iss is present, the value MUST be used to set the issuer property of the new credential JSON object or the holder property of the new presentation JSON object.
  issuer: IIssuerId | IIssuer
  // If nbf is present, the UNIX timestamp MUST be converted to an [XMLSCHEMA11-2] date-time, and MUST be used to set the value of the issuanceDate property of the new JSON object.
  issuanceDate: string
  // If sub is present, the value MUST be used to set the value of the id property of credentialSubject of the new credential JSON object.
  credentialSubject: (ICredentialSubject & AdditionalClaims) | (ICredentialSubject & AdditionalClaims)[]
  // If exp is present, the UNIX timestamp MUST be converted to an [XMLSCHEMA11-2] date-time, and MUST be used to set the value of the expirationDate property of credentialSubject of the new JSON object.
  expirationDate?: string
  // If jti is present, the value MUST be used to set the value of the id property of the new JSON object.
  id?: string
  credentialStatus?: ICredentialStatus
  description?: string
  name?: string

  [x: string]: any
}

export interface ICredentialSubject {
  id?: string
}

export type ICredentialContextType = (ICredentialContext & AdditionalClaims) | string

export interface ICredentialContext {
  name?: string
  did?: string
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
  jwt?: string //Jwt 2020 proof. Used to map a JWT VC onto a uniform presentation, and retain access to the original JWT
  nonce?: string // Similar to challenge. A nonce to protect against replay attacks, used in some ZKP proofs
  requiredRevealStatements?: string[] // The parts of the proof that must be revealed in a derived proof

  [x: string]: any // Any because we want to be able to access value1.value2.value3, which unknown does not allow for without a cast
}

export interface ICredentialStatus {
  id: string
  type: string
}

export interface IIssuer {
  id: string

  [x: string]: any
}

export interface IHasProof {
  proof: IProof | IProof[]
}

export type IVerifiableCredential = ICredential & IHasProof

/**
 * Represents a Json Web Token in compact form.
 */
export type CompactJWT = string

/**
 * Represents a signed Verifiable Credential (includes proof), in either JSON or compact JWT format.
 * See {@link https://www.w3.org/TR/vc-data-model/#credentials | VC data model}
 * See {@link https://www.w3.org/TR/vc-data-model/#proof-formats | proof formats}
 */
export type W3CVerifiableCredential = IVerifiableCredential | CompactJWT

export interface IPresentation {
  id?: string
  '@context': ICredentialContextType | ICredentialContextType[]
  type?: string | string[]
  verifiableCredential?: W3CVerifiableCredential[]
  presentation_submission?: PresentationSubmission
  holder?: string

  [x: string]: any
}

export type IVerifiablePresentation = IPresentation & IHasProof

/**
 * Represents a signed Verifiable Presentation (includes proof), in either JSON or compact JWT format.
 * See {@link https://www.w3.org/TR/vc-data-model/#presentations | VC data model}
 * See {@link https://www.w3.org/TR/vc-data-model/#proof-formats | proof formats}
 */
export type W3CVerifiablePresentation = IVerifiablePresentation | CompactJWT

export interface WrappedVerifiableCredential {
  /**
   * Original VC that we've received
   */
  original: OriginalVerifiableCredential
  /**
   * In case of JWT credential it will be the decoded version. In other cases it will be the same as original one
   */
  decoded: JwtDecodedVerifiableCredential | IVerifiableCredential
  /**
   * Type of this credential. Supported types are json-ld and jwt (decoded/encoded)
   */
  type: OriginalType
  /**
   * The claim format, typically used during exchange transport protocols
   */
  format: CredentialFormat
  /**
   * Internal stable representation of a Credential
   */
  credential: IVerifiableCredential
}

export interface WrappedVerifiablePresentation {
  /**
   * Original VP that we've received
   */
  original: OriginalVerifiablePresentation
  /**
   * In case of JWT VP it will be the decoded version. In other cases it will be the same as original one
   */
  decoded: JwtDecodedVerifiablePresentation | IVerifiablePresentation
  /**
   * Type of this Presentation. Supported types are json-ld and jwt (decoded/encoded)
   */
  type: OriginalType
  /**
   * The claim format, typically used during exchange transport protocols
   */
  format: PresentationFormat
  /**
   * Internal stable representation of a Presentation without proofs, created based on https://www.w3.org/TR/vc-data-model/#jwt-decoding
   */
  presentation: UniformVerifiablePresentation
  /**
   * Wrapped Verifiable Credentials belonging to the Presentation
   */
  vcs: WrappedVerifiableCredential[]
}

export enum OriginalType {
  JSONLD = 'json-ld',
  JWT_ENCODED = 'jwt-encoded',
  JWT_DECODED = 'jwt-decoded',
}

export interface UniformVerifiablePresentation {
  '@context': ICredentialContextType | ICredentialContextType[]
  type: string | string[]
  verifiableCredential: WrappedVerifiableCredential[]
  presentation_submission?: PresentationSubmission
  holder?: string
}

export interface JwtDecodedVerifiableCredential {
  vc: IVerifiableCredential
  exp: string
  iss: string
  nbf: string
  sub: string
  jti: string

  [x: string]: any
}

export interface JwtDecodedVerifiablePresentation {
  vp: IVerifiablePresentation
  exp: string
  iss: string
  nbf: string
  sub: string
  jti: string

  [x: string]: any
}

export type CredentialFormat = 'jwt' | 'ldp' | 'jwt_vc' | 'ldp_vc' | string
export type PresentationFormat = 'jwt' | 'ldp' | 'jwt_vp' | 'ldp_vp' | string
export type ClaimFormat = CredentialFormat | PresentationFormat

export type OriginalVerifiableCredential = W3CVerifiableCredential | JwtDecodedVerifiableCredential
export type OriginalVerifiablePresentation = W3CVerifiablePresentation | JwtDecodedVerifiablePresentation
export type Original = OriginalVerifiablePresentation | OriginalVerifiableCredential

export const enum DocumentFormat {
  JWT,
  JSONLD,
  EIP712,
}
