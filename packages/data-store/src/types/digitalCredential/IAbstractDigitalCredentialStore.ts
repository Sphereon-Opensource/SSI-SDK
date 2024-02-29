import { CredentialCorrelationType, CredentialStateType, DigitalCredential } from './digitalCredential'
import { Hasher } from '@sphereon/ssi-types'

export type GetCredentialArgs = { id: string } | { hash: string }

export type FindDigitalCredentialArgs = Array<Partial<DigitalCredential>>

export type GetCredentialsArgs = {
  filter?: FindDigitalCredentialArgs
  offset?: number
  limit?: number
  order?: string
}

export type GetCredentialsResponse = {
  data: Array<DigitalCredential>
  total: number
}

export type AddCredentialArgs = {
  raw: string
  issuerCorrelationType: CredentialCorrelationType
  subjectCorrelationType?: CredentialCorrelationType
  issuerCorrelationId: string
  subjectCorrelationId?: string
  tenantId?: string
  state?: CredentialStateType
  verifiedAt?: Date
  revokedAt?: Date
  opts?: { maxTimeSkewInMS?: number; hasher?: Hasher }
}

export type UpdateCredentialStateArgs = GetCredentialArgs & { verifiedState: CredentialStateType; verifiedAt?: Date; revokedAt?: Date }

export type RemoveCredentialArgs = GetCredentialArgs
