import { CredentialRole, type HasherSync } from '@sphereon/ssi-types'
import type { CredentialCorrelationType, CredentialStateType, RegulationType } from './enums'
import type { DigitalCredential } from './types'

export type GetCredentialArgs = { id: string } | { hash: string }

export type FindDigitalCredentialArgs = Array<Partial<DigitalCredential>>

export type GetCredentialsArgs = {
  filter?: FindDigitalCredentialArgs
  offset?: number
  limit?: number
  order?: string //| FindOptionsOrder<DigitalCredentialEntity>
}

export type GetCredentialsResponse = {
  data: Array<DigitalCredential>
  total: number
}

export type AddCredentialArgs = {
  rawDocument: string
  kmsKeyRef?: string
  identifierMethod?: string
  regulationType?: RegulationType
  parentId?: string
  issuerCorrelationType: CredentialCorrelationType
  subjectCorrelationType?: CredentialCorrelationType
  issuerCorrelationId: string
  subjectCorrelationId?: string
  credentialRole: CredentialRole
  linkedVpId?: string
  tenantId?: string
  linkedVpFrom?: Date
  state?: CredentialStateType
  verifiedAt?: Date
  revokedAt?: Date
  opts?: { maxTimeSkewInMS?: number; hasher?: HasherSync }
}

export type UpdateCredentialStateArgs = GetCredentialArgs & { verifiedState: CredentialStateType; verifiedAt?: Date; revokedAt?: Date }

export type UpdateCredentialArgs = GetCredentialArgs & Partial<Omit<DigitalCredential, 'id' | 'hash' | 'createdAt' | 'lastUpdatedAt'>>

export type RemoveCredentialArgs = GetCredentialArgs
