import { CredentialCorrelationType, CredentialStateType, DigitalCredential } from './digitalCredential'

export type GetDigitalCredentialArgs = { id: string } | { hash: string }

export type FindDigitalCredentialArgs = Array<Partial<DigitalCredential>>

export type GetDigitalCredentialsArgs = {
  filter?: FindDigitalCredentialArgs
  skip?: number
  take?: number
  order?: { [key in keyof DigitalCredential]: 'ASC' | 'DESC' }
}

export type GetDigitalCredentialsResponse = {
  data: DigitalCredential[]
  total: number
  hasMore: boolean
}

export type AddDigitalCredentialArgs = {
  raw: string
  issuerCorrelationType: CredentialCorrelationType
  subjectCorrelationType?: CredentialCorrelationType
  issuerCorrelationId: string
  subjectCorrelationId?: string
  tenantId?: string
  state?: CredentialStateType
  verificationDate?: Date
  revocationDate?: Date
}

export type UpdateDigitalCredentialStateArgs = GetDigitalCredentialArgs & { verifiedState: CredentialStateType; verificationDate?: Date }

export type RemoveDigitalCredentialArgs = GetDigitalCredentialArgs
