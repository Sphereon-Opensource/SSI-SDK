import { AddDigitalCredentialArgs } from '../../types/digitalCredential/IAbstractDigitalCredentialStore'
import { DigitalCredentialEntity } from '../../entities/digitalCredential/DigitalCredentialEntity'
import {
  CredentialMapper,
  decodeSdJwtVc,
  DocumentFormat,
  IVerifiableCredential,
  IVerifiablePresentation,
  SdJwtDecodedVerifiableCredentialPayload,
} from '@sphereon/ssi-types'
import {
  CredentialDocumentFormat,
  CredentialType,
  DigitalCredential,
  NonPersistedDigitalCredential,
} from '../../types/digitalCredential/digitalCredential'
import { computeEntryHash } from '@veramo/utils'
import { createHash } from 'crypto'

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

function getExpiresAt(uniformDocument: IVerifiableCredential | IVerifiablePresentation | SdJwtDecodedVerifiableCredentialPayload): Date | undefined {
  if ('expirationDate' in uniformDocument) {
    return new Date(uniformDocument.expirationDate)
  } else if ('exp' in uniformDocument) {
    return new Date(uniformDocument.exp)
  }
  return undefined
}

function getIssuedAt(uniformDocument: IVerifiableCredential | IVerifiablePresentation | SdJwtDecodedVerifiableCredentialPayload): Date | undefined {
  if ('issuanceDate' in uniformDocument) {
    return new Date(uniformDocument.issuanceDate)
  } else if (uniformDocument.proof && CredentialMapper.getFirstProof(uniformDocument as IVerifiableCredential | IVerifiablePresentation)) {
    return new Date(CredentialMapper.getFirstProof(uniformDocument as IVerifiableCredential | IVerifiablePresentation)!.created)
  } else if ('validFrom' in uniformDocument) {
    return new Date(uniformDocument['validFrom'])
  } else if ('iat' in uniformDocument) {
    return new Date(uniformDocument['iat'] * 1000)
  }

  return undefined
}

export const handleSdJwt = (rawCredential: string): SdJwtDecodedVerifiableCredentialPayload => {
  // todo ask about the hasher
  return CredentialMapper.isSdJwtEncoded(rawCredential)
    ? decodeSdJwtVc(rawCredential, (data, algorithm) => createHash(algorithm).update(data).digest()).decodedPayload
    : JSON.parse(rawCredential)
}

export const nonPersistedDigitalCredentialEntityFromAddArgs = (addCredentialArgs: AddDigitalCredentialArgs): NonPersistedDigitalCredential => {
  const credentialType: CredentialType = determineCredentialType(addCredentialArgs.raw)
  const documentFormat: DocumentFormat = CredentialMapper.detectDocumentType(addCredentialArgs.raw)
  const uniformDocument =
    documentFormat === DocumentFormat.SD_JWT_VC
      ? handleSdJwt(addCredentialArgs.raw)
      : credentialType === CredentialType.VC || credentialType === CredentialType.C
      ? CredentialMapper.toUniformCredential(addCredentialArgs.raw)
      : CredentialMapper.toUniformPresentation(addCredentialArgs.raw)
  const issuedAt: Date | undefined = getIssuedAt(uniformDocument)
  const expiresAt: Date | undefined = getExpiresAt(uniformDocument)
  return {
    ...addCredentialArgs,
    credentialType,
    documentFormat: determineCredentialDocumentFormat(documentFormat),
    createdAt: new Date(),
    hash: computeEntryHash(addCredentialArgs.raw),
    uniformDocument: JSON.stringify(uniformDocument),
    issuedAt,
    expiresAt,
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
