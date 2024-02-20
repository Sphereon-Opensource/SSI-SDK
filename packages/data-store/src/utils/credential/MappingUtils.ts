import { AddCredentialArgs } from '../../types/credential/IAbstractCredentialStore'
import { UniformCredentialEntity } from '../../entities/credential/CredentialEntity'
import { CredentialMapper, WrappedVerifiableCredential, WrappedVerifiablePresentation } from '@sphereon/ssi-types'
import { CredentialTypeEnum } from '../../types/credential/credential'
import { computeEntryHash } from '@veramo/utils'

export const credentialEntityFrom = async (addCredentialArgs: AddCredentialArgs): Promise<UniformCredentialEntity> => {
  const wrappedCredential: WrappedVerifiableCredential | WrappedVerifiablePresentation =
    addCredentialArgs.credentialType === CredentialTypeEnum.VC
      ? CredentialMapper.toWrappedVerifiableCredential(JSON.stringify(addCredentialArgs.raw))
      : CredentialMapper.toWrappedVerifiablePresentation(addCredentialArgs.raw)
  const uniformCredentialEntity: UniformCredentialEntity = new UniformCredentialEntity()

  uniformCredentialEntity.credentialType = addCredentialArgs.credentialType
  uniformCredentialEntity.createdAt = new Date(wrappedCredential.decoded.nbf)
  console.log(`We have createdAt:`, uniformCredentialEntity.createdAt)
  uniformCredentialEntity.documentFormat = addCredentialArgs.documentFormat
  uniformCredentialEntity.lastUpdatedAt = new Date()
  uniformCredentialEntity.tenantId = addCredentialArgs.tenantId
  uniformCredentialEntity.raw = addCredentialArgs.raw
  uniformCredentialEntity.subjectCorrelationId = addCredentialArgs.subjectCorrelationId
  uniformCredentialEntity.subjectCorrelationType = addCredentialArgs.subjectCorrelationType
  uniformCredentialEntity.type = wrappedCredential.type
  uniformCredentialEntity.hash = computeEntryHash(addCredentialArgs.raw)
  uniformCredentialEntity.uniformDocument =
    addCredentialArgs.credentialType === CredentialTypeEnum.VC
      ? JSON.stringify((wrappedCredential as WrappedVerifiableCredential).credential)
      : JSON.stringify((wrappedCredential as WrappedVerifiablePresentation).presentation)
  return {} as UniformCredentialEntity
}
