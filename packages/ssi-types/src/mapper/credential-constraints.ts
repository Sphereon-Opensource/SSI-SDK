import { CredentialFormat, PresentationFormat } from '../types'

export type CredentialEncoding = 'json' /*includes json-ld*/ | 'jwt' | 'cbor'

export type IssuerAttributeName = 'iss' | 'issuer' | 'issuerAuth'
export type SubjectAttributeName = 'subject' | 'id' | 'deviceMac' | 'TODO'
export type TypeAttributeName = 'type' | 'vct'

export type DataModel = 'W3C_VCDM' | 'IETF_SD_JWT' | 'ISO_MSO_MDOC'

export interface CredentialConstraint {
  credentialFormat: CredentialFormat
  presentationFormat: PresentationFormat
  maxSignatures: number
  encoding: CredentialEncoding
  dataModel: DataModel
  typeAttribute?: TypeAttributeName // optional since mdocs use namespace maps without an explicit type attribute
  issuerAttributes: [IssuerAttributeName]
}
