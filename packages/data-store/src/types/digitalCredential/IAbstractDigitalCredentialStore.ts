import { CredentialCorrelationType, CredentialStateType, DigitalCredential } from './digitalCredential'

export type GetDigitalCredentialArgs = { id: string } | { hash: string }

export type FindDigitalCredentialArgs = Array<Partial<DigitalCredential>>

// TODO: discuss about what args we want here
export type GetDigitalCredentialsArgs = {
  filter?: FindDigitalCredentialArgs
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
