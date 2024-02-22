import { CredentialCorrelationType, CredentialDocumentFormat, CredentialStateType, CredentialTypeEnum, UniformCredential } from './uniformCredential'

export type GetUniformCredentialArgs = { id: string } | { hash: string }

export type FindUniformCredentialArgs = Array<Partial<UniformCredential>>

// TODO: discuss about what args we want here
export type GetUniformCredentialsArgs = {
  filter?: FindUniformCredentialArgs
}

export type AddUniformCredentialArgs = {
  credentialType: CredentialTypeEnum
  documentFormat: CredentialDocumentFormat
  raw: string
  issuerCorrelationType: CredentialCorrelationType
  subjectCorrelationType?: CredentialCorrelationType
  issuerCorrelationId: string
  subjectCorrelationId?: string
  tenantId?: string
  expiresAt?: Date
  state?: CredentialStateType
  verificationDate?: Date
  revocationDate?: Date
}

export type UpdateUniformCredentialStateArgs = GetUniformCredentialArgs & { verifiedState: CredentialStateType }

export type RemoveUniformCredentialArgs = { id: string }
