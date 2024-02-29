export type NonPersistedDigitalCredential = Omit<DigitalCredential, 'id'>

export type DigitalCredential = {
  id: string
  credentialType: CredentialType
  documentFormat: CredentialDocumentFormat
  raw: string
  uniformDocument: string
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
