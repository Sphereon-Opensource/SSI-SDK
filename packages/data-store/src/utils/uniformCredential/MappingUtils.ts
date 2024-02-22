import { AddUniformCredentialArgs } from '../../types/uniformCredential/IAbstractUniformCredentialStore'
import { UniformCredentialEntity } from '../../entities/uniformCredential/UniformCredentialEntity'
import { CredentialMapper, WrappedVerifiableCredential, WrappedVerifiablePresentation } from '@sphereon/ssi-types'
import { CredentialTypeEnum, NonPersistedUniformCredential, UniformCredential } from '../../types/uniformCredential/uniformCredential'
import { computeEntryHash } from '@veramo/utils'

export const uniformCredentialEntityFromAddArgs = (addCredentialArgs: AddUniformCredentialArgs): UniformCredentialEntity => {
  const wrappedCredential: WrappedVerifiableCredential | WrappedVerifiablePresentation =
    addCredentialArgs.credentialType === CredentialTypeEnum.VC
      ? CredentialMapper.toWrappedVerifiableCredential(JSON.stringify(addCredentialArgs.raw))
      : CredentialMapper.toWrappedVerifiablePresentation(addCredentialArgs.raw)
  const uniformCredentialEntity: UniformCredentialEntity = new UniformCredentialEntity()

  uniformCredentialEntity.credentialType = addCredentialArgs.credentialType
  uniformCredentialEntity.createdAt = new Date()
  uniformCredentialEntity.documentFormat = addCredentialArgs.documentFormat
  uniformCredentialEntity.lastUpdatedAt = new Date()
  uniformCredentialEntity.tenantId = addCredentialArgs.tenantId
  uniformCredentialEntity.raw = addCredentialArgs.raw
  uniformCredentialEntity.issuerCorrelationId = addCredentialArgs.issuerCorrelationId
  uniformCredentialEntity.issuerCorrelationType = addCredentialArgs.issuerCorrelationType
  uniformCredentialEntity.subjectCorrelationId = addCredentialArgs.subjectCorrelationId
  uniformCredentialEntity.subjectCorrelationType = addCredentialArgs.subjectCorrelationType
  uniformCredentialEntity.expiresAt = addCredentialArgs.expiresAt
  uniformCredentialEntity.lastVerifiedState = addCredentialArgs.state
  uniformCredentialEntity.verificationDate = addCredentialArgs.verificationDate
  uniformCredentialEntity.revocationDate = addCredentialArgs.revocationDate
  uniformCredentialEntity.hash = computeEntryHash(addCredentialArgs.raw)
  uniformCredentialEntity.uniformDocument =
    addCredentialArgs.credentialType === CredentialTypeEnum.VC
      ? JSON.stringify((wrappedCredential as WrappedVerifiableCredential).credential)
      : JSON.stringify((wrappedCredential as WrappedVerifiablePresentation).presentation)
  return uniformCredentialEntity
}

export const uniformCredentialEntityFromNonPersisted = (uniformCredential: NonPersistedUniformCredential): UniformCredentialEntity => {
  const uniformCredentialEntity: UniformCredentialEntity = new UniformCredentialEntity()
  uniformCredentialEntity.credentialType = uniformCredential.credentialType
  uniformCredentialEntity.createdAt = uniformCredential.createdAt
  uniformCredentialEntity.documentFormat = uniformCredential.documentFormat
  uniformCredentialEntity.lastUpdatedAt = new Date()
  uniformCredentialEntity.tenantId = uniformCredential.tenantId
  uniformCredentialEntity.raw = uniformCredential.raw
  uniformCredentialEntity.issuerCorrelationId = uniformCredential.issuerCorrelationId
  uniformCredentialEntity.issuerCorrelationType = uniformCredential.issuerCorrelationType
  uniformCredentialEntity.subjectCorrelationId = uniformCredential.subjectCorrelationId
  uniformCredentialEntity.subjectCorrelationType = uniformCredential.subjectCorrelationType
  uniformCredentialEntity.hash = uniformCredential.hash
  uniformCredentialEntity.uniformDocument = uniformCredential.uniformDocument
  return uniformCredentialEntity
}

export const uniformCredentialFrom = (credentialEntity: UniformCredentialEntity): UniformCredential => {
  return {
    id: credentialEntity.id,
    credentialType: credentialEntity.credentialType,
    documentFormat: credentialEntity.documentFormat,
    raw: credentialEntity.raw,
    uniformDocument: credentialEntity.uniformDocument,
    hash: credentialEntity.hash,
    issuerCorrelationType: credentialEntity.issuerCorrelationType,
    subjectCorrelationType: credentialEntity.subjectCorrelationType,
    issuerCorrelationId: credentialEntity.issuerCorrelationId,
    subjectCorrelationId: credentialEntity.subjectCorrelationId,
    lastVerifiedState: credentialEntity.lastVerifiedState,
    tenantId: credentialEntity.tenantId,
    createdAt: credentialEntity.createdAt,
    lastUpdatedAt: credentialEntity.lastUpdatedAt,
    expiresAt: credentialEntity.expiresAt,
  }
}

export const uniformCredentialsFrom = (credentialEntities: Array<UniformCredentialEntity>): UniformCredential[] => {
  return credentialEntities.map((credentialEntity) => uniformCredentialFrom(credentialEntity))
}
