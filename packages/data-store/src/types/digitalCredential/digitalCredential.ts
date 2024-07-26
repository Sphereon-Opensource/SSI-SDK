export type NonPersistedDigitalCredential = Omit<DigitalCredential, 'id'>

export type DigitalCredential = {
  id: string
  documentType: DocumentType
  documentFormat: CredentialDocumentFormat
  credentialRole: CredentialRole
  rawDocument: string
  uniformDocument: string
  credentialId?: string
  hash: string
  issuerCorrelationType: CredentialCorrelationType
  subjectCorrelationType?: CredentialCorrelationType
  issuerCorrelationId: string
  subjectCorrelationId?: string
  verifiedState?: CredentialStateType
  tenantId?: string
  createdAt: Date
  lastUpdatedAt: Date
  validUntil?: Date
  validFrom?: Date
  verifiedAt?: Date
  revokedAt?: Date
}

export enum DocumentType {
  VC = 'VC',
  VP = 'VP',
  P = 'P',
  C = 'C',
}

export enum CredentialDocumentFormat {
  JSON_LD = 'JSON_LD',
  JWT = 'JWT',
  SD_JWT = 'SD_JWT',
  MDOC = 'MDOC',
}

export enum CredentialCorrelationType {
  DID = 'DID',
}

export enum CredentialRole {
  ISSUER = 'ISSUER',
  VERIFIER = 'VERIFIER',
  HOLDER = 'HOLDER',
}

export enum CredentialStateType {
  REVOKED = 'REVOKED',
  VERIFIED = 'VERIFIED',
  EXPIRED = 'EXPIRED',
}
