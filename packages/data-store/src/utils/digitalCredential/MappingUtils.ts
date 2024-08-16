import {
  CredentialMapper,
  DocumentFormat,
  IVerifiableCredential,
  IVerifiablePresentation,
  OriginalVerifiableCredential,
  OriginalVerifiablePresentation,
  SdJwtDecodedVerifiableCredentialPayload,
} from '@sphereon/ssi-types'
import { computeEntryHash } from '@veramo/utils'
import { DigitalCredentialEntity } from '../../entities/digitalCredential/DigitalCredentialEntity'
import { AddCredentialArgs, CredentialDocumentFormat, DigitalCredential, DocumentType, NonPersistedDigitalCredential } from '../../types'

function determineDocumentType(raw: string): DocumentType {
  const rawDocument = parseRawDocument(raw)
  if (!rawDocument) {
    throw new Error(`Couldn't parse the credential: ${raw}`)
  }

  const hasProof = CredentialMapper.hasProof(rawDocument)
  const isCredential = CredentialMapper.isCredential(rawDocument)
  const isPresentation = CredentialMapper.isPresentation(rawDocument)

  if (isCredential) {
    return hasProof ? DocumentType.VC : DocumentType.C
  } else if (isPresentation) {
    return hasProof ? DocumentType.VP : DocumentType.P
  }
  throw new Error(`Couldn't determine the type of the credential: ${raw}`)
}

function parseRawDocument(raw: string): OriginalVerifiableCredential | OriginalVerifiablePresentation {
  if (CredentialMapper.isJwtEncoded(raw) || CredentialMapper.isSdJwtEncoded(raw)) {
    return raw
  }
  try {
    return JSON.parse(raw)
  } catch (e) {
    throw new Error(`Can't parse the raw credential: ${raw}`)
  }
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

function getValidUntil(uniformDocument: IVerifiableCredential | IVerifiablePresentation | SdJwtDecodedVerifiableCredentialPayload): Date | undefined {
  if ('expirationDate' in uniformDocument) {
    return new Date(uniformDocument.expirationDate)
  } else if ('validUntil' in uniformDocument) {
    return new Date(uniformDocument.validUntil)
  } else if ('exp' in uniformDocument) {
    return new Date(uniformDocument.exp * 1000)
  }
  return undefined
}

function getValidFrom(uniformDocument: IVerifiableCredential | IVerifiablePresentation | SdJwtDecodedVerifiableCredentialPayload): Date | undefined {
  if ('issuanceDate' in uniformDocument) {
    return new Date(uniformDocument.issuanceDate)
  } else if ('validFrom' in uniformDocument) {
    return new Date(uniformDocument['validFrom'])
  } else if ('nbf' in uniformDocument) {
    return new Date(uniformDocument['nbf'] * 1000)
  } else if ('iat' in uniformDocument) {
    return new Date(uniformDocument['iat'] * 1000)
  }
  return undefined
}

export const nonPersistedDigitalCredentialEntityFromAddArgs = (addCredentialArgs: AddCredentialArgs): NonPersistedDigitalCredential => {
  const documentType: DocumentType = determineDocumentType(addCredentialArgs.rawDocument)
  const documentFormat: DocumentFormat = CredentialMapper.detectDocumentType(addCredentialArgs.rawDocument)
  if (documentFormat === DocumentFormat.SD_JWT_VC && !addCredentialArgs.opts?.hasher) {
    throw new Error('No hasher function is provided for SD_JWT credential.')
  }
  const hasher = addCredentialArgs.opts?.hasher
  const uniformDocument =
    documentType === DocumentType.VC || documentType === DocumentType.C
      ? CredentialMapper.toUniformCredential(addCredentialArgs.rawDocument, { hasher })
      : CredentialMapper.toUniformPresentation(addCredentialArgs.rawDocument)
  const validFrom: Date | undefined = getValidFrom(uniformDocument)
  const validUntil: Date | undefined = getValidUntil(uniformDocument)
  const hash = computeEntryHash(addCredentialArgs.rawDocument)
  return {
    ...addCredentialArgs,
    documentType,
    documentFormat: determineCredentialDocumentFormat(documentFormat),
    createdAt: new Date(),
    credentialId: uniformDocument.id ?? hash,
    hash,
    uniformDocument: JSON.stringify(uniformDocument),
    validFrom,
    validUntil,
    lastUpdatedAt: new Date(),
  }
}

export const digitalCredentialFrom = (credentialEntity: DigitalCredentialEntity): DigitalCredential => {
  return {
    ...credentialEntity,
  }
}

export const digitalCredentialsFrom = (credentialEntities: Array<DigitalCredentialEntity>): DigitalCredential[] => {
  return credentialEntities.map((credentialEntity) => digitalCredentialFrom(credentialEntity))
}
