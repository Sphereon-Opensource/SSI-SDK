import { SdJwtDecodedVerifiableCredential, WrappedSdJwtVerifiableCredential, WrappedSdJwtVerifiablePresentation } from './sd-jwt-vc'
import {
  JwtDecodedVerifiableCredential,
  JwtDecodedVerifiablePresentation,
  W3CVerifiableCredential,
  W3CVerifiablePresentation,
  WrappedW3CVerifiableCredential,
  WrappedW3CVerifiablePresentation,
} from './w3c-vc'

export type WrappedVerifiableCredential = WrappedW3CVerifiableCredential | WrappedSdJwtVerifiableCredential

export type WrappedVerifiablePresentation = WrappedW3CVerifiablePresentation | WrappedSdJwtVerifiablePresentation

export enum OriginalType {
  // W3C
  JSONLD = 'json-ld',
  JWT_ENCODED = 'jwt-encoded',
  JWT_DECODED = 'jwt-decoded',

  // SD-JWT
  SD_JWT_VC_ENCODED = 'sd-jwt-vc-encoded',
  SD_JWT_VC_DECODED = 'sd-jwt-vc-decoded',
}

export type CredentialFormat =
  // W3C
  | 'jwt_vc'
  | 'ldp_vc'
  // SD-JWT
  | 'vc+sd-jwt'
  // Remaining
  | 'jwt'
  | 'ldp'
  | string

export type PresentationFormat =
  // W3C
  | 'jwt_vp'
  | 'ldp_vp'
  // SD-JWT
  | 'vc+sd-jwt'
  // Remaining
  | 'jwt'
  | 'ldp'
  | string

export type ClaimFormat = CredentialFormat | PresentationFormat

export type OriginalVerifiableCredential = W3CVerifiableCredential | JwtDecodedVerifiableCredential | SdJwtDecodedVerifiableCredential
export type OriginalVerifiablePresentation = W3CVerifiablePresentation | JwtDecodedVerifiablePresentation | SdJwtDecodedVerifiableCredential
export type Original = OriginalVerifiablePresentation | OriginalVerifiableCredential

export const enum DocumentFormat {
  // W3C
  JWT,
  JSONLD,
  // SD-JWT
  SD_JWT_VC,
  // Remaining
  EIP712,
}
