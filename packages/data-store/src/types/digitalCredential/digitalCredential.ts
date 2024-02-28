export type NonPersistedDigitalCredential = Omit<DigitalCredential, 'id'>

export type DigitalCredential = {
  id: string
  credentialType: CredentialType
  documentFormat: CredentialDocumentFormat
  raw: string
  hash: string
  issuerCorrelationType: CredentialCorrelationType
  subjectCorrelationType?: CredentialCorrelationType
  issuerCorrelationId: string
  subjectCorrelationId?: string
  lastVerificationDate: string
  verificationDate?: Date
  verifiedState?: CredentialStateType
  tenantId?: string
  createdAt: Date
  lastUpdatedAt: Date
  issuedAt?: Date
  expiresAt?: Date
}

export enum CredentialType {
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

export enum CredentialStateType {
  REVOKED = 'REVOKED',
  VERIFIED = 'VERIFIED',
  EXPIRED = 'EXPIRED',
}
