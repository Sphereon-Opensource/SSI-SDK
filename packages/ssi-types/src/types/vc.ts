import type {
  MdocDeviceResponse,
  MdocDocument,
  MdocOid4vpIssuerSigned,
  MdocOid4vpMdocVpToken,
  WrappedMdocCredential,
  WrappedMdocPresentation,
} from './mso_mdoc'
import type { SdJwtDecodedVerifiableCredential, WrappedSdJwtVerifiableCredential, WrappedSdJwtVerifiablePresentation } from './sd-jwt-vc'
import type {
  JwtDecodedVerifiableCredential,
  JwtDecodedVerifiablePresentation,
  W3CVerifiableCredential,
  W3CVerifiablePresentation,
  WrappedW3CVerifiableCredential,
  WrappedW3CVerifiablePresentation,
} from './w3c-vc'

export type WrappedVerifiableCredential = WrappedW3CVerifiableCredential | WrappedSdJwtVerifiableCredential | WrappedMdocCredential

export type WrappedVerifiablePresentation = WrappedW3CVerifiablePresentation | WrappedSdJwtVerifiablePresentation | WrappedMdocPresentation

export type CredentialFormat =
  // W3C
  | 'jwt_vc'
  | 'ldp_vc'
  // SD-JWT
  | 'vc+sd-jwt'
  // Remaining
  | 'jwt'
  | 'ldp'
  | 'mso_mdoc'
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
  | 'mso_mdoc'
  | string

export type ClaimFormat = CredentialFormat | PresentationFormat

export type OriginalVerifiableCredential =
  | W3CVerifiableCredential
  | JwtDecodedVerifiableCredential
  | SdJwtDecodedVerifiableCredential
  | MdocOid4vpIssuerSigned
  | MdocDocument
export type OriginalVerifiablePresentation =
  | W3CVerifiablePresentation
  | JwtDecodedVerifiablePresentation
  | SdJwtDecodedVerifiableCredential
  | MdocOid4vpMdocVpToken
  | MdocDeviceResponse
export type Original = OriginalVerifiablePresentation | OriginalVerifiableCredential
