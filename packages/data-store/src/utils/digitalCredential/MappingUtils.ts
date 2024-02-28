import { AddDigitalCredentialArgs } from '../../types/digitalCredential/IAbstractDigitalCredentialStore'
import { DigitalCredentialEntity } from '../../entities/digitalCredential/DigitalCredentialEntity'
import { CredentialMapper, DocumentFormat, ICredential, IHasProof, IPresentation } from '@sphereon/ssi-types'
import {
  CredentialDocumentFormat,
  CredentialType,
  DigitalCredential,
  NonPersistedDigitalCredential,
} from '../../types/digitalCredential/digitalCredential'
import { computeEntryHash } from '@veramo/utils'

function determineCredentialType(raw: string): CredentialType {
  if (CredentialMapper.hasProof(raw)) {
    if (CredentialMapper.isCredential(raw)) {
      return CredentialType.VC
    } else if (CredentialMapper.isPresentation(raw)) {
      return CredentialType.VP
    }
  } else {
    if (CredentialMapper.isCredential(raw)) {
      return CredentialType.C
    } else if (CredentialMapper.isPresentation(raw)) {
      return CredentialType.P
    }
  }
  throw new Error(`Couldn't determine the type of the credential: ${raw}`)
}

function determineCredentialDocumentFormat(documentFormat: DocumentFormat): CredentialDocumentFormat {
  switch (documentFormat) {
    case DocumentFormat.JSONLD:
      return CredentialDocumentFormat.JSON_LD
    case DocumentFormat.JWT:
      return CredentialDocumentFormat.JWT
    case DocumentFormat.SD_JWT_VC:
      return CredentialDocumentFormat.SD_JWT
    default:
      throw new Error(`Not supported document format: ${documentFormat}`)
  }
}

function getExpiryDate(uniformDocument: (ICredential & IHasProof) | (IPresentation & IHasProof)): Date | undefined {
  if ('expirationDate' in uniformDocument) {
    return new Date(uniformDocument.expirationDate)
  } else if ('exp' in uniformDocument) {
    return new Date(uniformDocument.exp)
  }
  return undefined
}

function getIssuedAt(uniformDocument: (ICredential & IHasProof) | (IPresentation & IHasProof)): Date | undefined {
  if ('issuanceDate' in uniformDocument) {
    return new Date(uniformDocument.expirationDate)
  } else if (CredentialMapper.getFirstProof(uniformDocument)) {
    return new Date(CredentialMapper.getFirstProof(uniformDocument)!.created)
  } else if ('validFrom' in uniformDocument) {
    return new Date(uniformDocument.validFrom)
  }
  return undefined
}

export const nonPersistedDigitalCredentialEntityFromAddArgs = (addCredentialArgs: AddDigitalCredentialArgs): NonPersistedDigitalCredential => {
  const credentialType: CredentialType = determineCredentialType(addCredentialArgs.raw)
  const uniformDocument =
    credentialType === CredentialType.VC || credentialType === CredentialType.C
      ? CredentialMapper.toUniformCredential(addCredentialArgs.raw)
      : CredentialMapper.toUniformPresentation(addCredentialArgs.raw)
  const documentFormat: CredentialDocumentFormat = determineCredentialDocumentFormat(CredentialMapper.detectDocumentType(uniformDocument))
  return {
    ...addCredentialArgs,
    credentialType,
    documentFormat,
    createdAt: new Date(),
    ...(credentialType === CredentialType.VC || credentialType === CredentialType.VP ? { expiresAt: getExpiryDate(uniformDocument) } : {}),
    hash: computeEntryHash(addCredentialArgs.raw),
    uniformDocument: JSON.stringify(uniformDocument),
    issuedAt: getIssuedAt(uniformDocument),
    lastUpdatedAt: new Date(),
  }
}

export const digitalCredentialFrom = (credentialEntity: DigitalCredentialEntity): DigitalCredential => {
  return {
    ...credentialEntity
  }
}

export const digitalCredentialsFrom = (credentialEntities: Array<DigitalCredentialEntity>): DigitalCredential[] => {
  return credentialEntities.map((credentialEntity) => digitalCredentialFrom(credentialEntity))
}
