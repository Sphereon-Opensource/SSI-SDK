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
  kmsKeyRef: string
  identifierMethod: string
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
  MSO_MDOC = 'MSO_MDOC',
}

export namespace CredentialDocumentFormat {
  export function fromSpecValue(credentialFormat: string) {
    const format = credentialFormat.toLowerCase()
    if (format.includes('sd')) {
      return CredentialDocumentFormat.SD_JWT
    } else if (format.includes('ldp')) {
      return CredentialDocumentFormat.JSON_LD
    } else if (format.includes('mso') || credentialFormat.includes('mdoc')) {
      return CredentialDocumentFormat.MSO_MDOC
    } else if (format.includes('jwt_')) {
      return CredentialDocumentFormat.JWT
    } else {
      throw Error(`Could not map format ${format} to known format`)
    }
  }

  export function toSpecValue(documentFormat: CredentialDocumentFormat, documentType: DocumentType) {
    switch (documentFormat) {
      case CredentialDocumentFormat.SD_JWT:
        return 'vc+sd-jwt'
      case CredentialDocumentFormat.MSO_MDOC:
        return 'mso_mdoc'
      case CredentialDocumentFormat.JSON_LD:
        return documentType === DocumentType.C || documentType === DocumentType.VC ? 'ldp_vc' : 'ldp_vp'
      case CredentialDocumentFormat.JWT:
        return documentType === DocumentType.C || documentType === DocumentType.VC ? 'jwt_vc_json' : 'jwt_vp_json'
    }
  }
}

export enum CredentialCorrelationType {
  DID = 'DID',
  X509_CN = 'X509_CN',
  URL = 'URL',
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
