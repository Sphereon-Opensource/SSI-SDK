import { CredentialCorrelationType, CredentialDocumentFormat, CredentialStateType, CredentialTypeEnum } from './credential'

export type GetCredentialArgs = { id: string } | { hash: string }

// TODO: discuss about what args we want here
export type GetCredentialsArgs = {}

export type AddCredentialArgs = {
  credentialType: CredentialTypeEnum
  documentFormat: CredentialDocumentFormat
  raw: string
  issuerCorrelationType: CredentialCorrelationType
  subjectCorrelationType?: CredentialCorrelationType
  issuerCorrelationId: string
  subjectCorrelationId?: string
  tenantId?: string
}

export type UpdateCredentialStateArgs = GetCredentialArgs & { verified_state: CredentialStateType }

export type RemoveCredentialArgs = { id: string } | { hash: string }
