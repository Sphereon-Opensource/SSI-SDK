import { CredentialCorrelationType, CredentialStateType, DigitalCredential } from './digitalCredential'

export type GetCredentialArgs = { id: string } | { hash: string }

export type FindDigitalCredentialArgs = Array<Partial<DigitalCredential>>

export type GetCredentialsArgs = {
  filter?: FindDigitalCredentialArgs
  skip?: number
  take?: number
  order?: { [key in keyof DigitalCredential]: 'ASC' | 'DESC' }
}

export type GetCredentialsResponse = {
  data: DigitalCredential[]
  total: number
  hasMore: boolean
}

export type AddCredentialArgs = {
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

export type UpdateCredentialStateArgs = GetCredentialArgs & { verifiedState: CredentialStateType; verificationDate?: Date }

export type RemoveCredentialArgs = GetCredentialArgs
