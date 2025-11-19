import { CredentialRole } from '@sphereon/ssi-types'
import { CredentialCorrelationType, CredentialDocumentFormat, CredentialStateType, DocumentType, RegulationType } from './enums'
import { UpdateCredentialArgs } from './IAbstractDigitalCredentialStore'

/**
 * DigitalCredential
 *
 * @public
 */
export type DigitalCredential = {
  id: string
  parentId?: string
  documentType: DocumentType
  documentFormat: CredentialDocumentFormat
  credentialRole: CredentialRole
  regulationType: RegulationType
  rawDocument: string
  uniformDocument: string
  credentialId?: string
  hash: string
  kmsKeyRef?: string
  identifierMethod?: string
  issuerCorrelationType: CredentialCorrelationType
  subjectCorrelationType?: CredentialCorrelationType
  rpCorrelationType?: CredentialCorrelationType
  isIssuerSigned?: boolean
  issuerCorrelationId: string
  subjectCorrelationId?: string
  rpCorrelationId?: string
  verifiedState?: CredentialStateType
  tenantId?: string
  linkedVpId?: string | null
  linkedVpFrom?: Date | null
  createdAt: Date
  presentedAt?: Date
  lastUpdatedAt: Date
  validUntil?: Date
  validFrom?: Date
  verifiedAt?: Date
  revokedAt?: Date
}

export type NonPersistedDigitalCredential = Omit<DigitalCredential, 'id' | 'regulationType'> & { regulationType?: RegulationType }

export type UpdateCredentialArgsWithoutIdentifier = Omit<UpdateCredentialArgs, 'id' | 'hash'>
