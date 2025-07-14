import type { IAgentContext, ICredentialPlugin, ProofFormat as VeramoProofFormat } from '@veramo/core'
import type { IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import {
  CredentialMapper,
  type CredentialProofFormat,
  DocumentFormat,
  type IIssuer,
  type StatusListCredential,
  StatusListType,
} from '@sphereon/ssi-types'

import type { IStatusList } from './IStatusList'
import {
  BitstringStatus,
  CheckStatusIndexArgs,
  CreateStatusListArgs,
  StatusListResult,
  ToStatusListDetailsArgs,
  UpdateStatusListFromEncodedListArgs,
  UpdateStatusListIndexArgs,
} from '../types'

import { assertValidProofType, ensureDate, getAssertedProperty, getAssertedValue, getAssertedValues } from '../utils'
import { BitstringStatusListCredential } from '../types/BitstringStatusList'
import { BitstreamStatusList, BitstringStatusPurpose, createStatusListCredential } from '@4sure-tech/vc-bitstring-status-lists'

export const DEFAULT_LIST_LENGTH = 131072 // W3C spec minimum
export const DEFAULT_PROOF_FORMAT = 'lds' as CredentialProofFormat
export const DEFAULT_STATUS_PURPOSE: BitstringStatusPurpose = 'revocation'

export class BitstringStatusListImplementation implements IStatusList {
  async createNewStatusList(
    args: CreateStatusListArgs,
    context: IAgentContext<ICredentialPlugin & IIdentifierResolution>,
  ): Promise<StatusListResult> {
    if (!args.bitstringStatusList) {
      throw new Error('BitstringStatusList options are required for type BitstringStatusList')
    }

    const length = args?.length ?? DEFAULT_LIST_LENGTH
    const proofFormat: CredentialProofFormat = args?.proofFormat ?? DEFAULT_PROOF_FORMAT
    assertValidProofType(StatusListType.BitstringStatusList, proofFormat)
    const veramoProofFormat: VeramoProofFormat = proofFormat as VeramoProofFormat

    const { issuer, id } = args
    const correlationId = getAssertedValue('correlationId', args.correlationId)
    const { statusPurpose, bitsPerStatus, validFrom, validUntil, ttl } = args.bitstringStatusList
    const statusListCredential = await this.createVerifiableCredential(
      {
        ...args,
        proofFormat: veramoProofFormat,
        statusPurpose: statusPurpose ?? DEFAULT_STATUS_PURPOSE,
        validFrom: ensureDate(validFrom),
        validUntil: ensureDate(validUntil),
        ttl,
      },
      context,
    )

    return {
      encodedList: statusListCredential.credentialSubject.encodedList,
      statusListCredential: statusListCredential,
      bitstringStatusList: {
        statusPurpose: statusPurpose ?? DEFAULT_STATUS_PURPOSE,
        ...(statusListCredential.validFrom && { validFrom: new Date(statusListCredential.validFrom) }),
        ...(statusListCredential.validUntil && { validUntil: new Date(statusListCredential.validUntil) }),
        ttl,
        bitsPerStatus,
      },
      length,
      type: StatusListType.BitstringStatusList,
      proofFormat,
      id,
      correlationId,
      issuer,
      statuslistContentType: this.buildContentType(proofFormat),
    }
  }

  async updateStatusListIndex(
    args: UpdateStatusListIndexArgs,
    context: IAgentContext<ICredentialPlugin & IIdentifierResolution>,
  ): Promise<StatusListResult> {
    if (!args.bitsPerStatus || args.bitsPerStatus < 1) {
      return Promise.reject('bitsPerStatus must be set for bitstring status lists and must be 1 or higher. (updateStatusListIndex)')
    }

    const credential = args.statusListCredential
    const uniform = CredentialMapper.toUniformCredential(credential)
    const { issuer, credentialSubject } = uniform
    const id = getAssertedValue('id', uniform.id)
    const origEncodedList = getAssertedProperty('encodedList', credentialSubject)

    const index = typeof args.statusListIndex === 'number' ? args.statusListIndex : parseInt(args.statusListIndex)
    const statusList: BitstreamStatusList = await BitstreamStatusList.decode({ encodedList: origEncodedList, statusSize: args.bitsPerStatus })
    statusList.setStatus(index, args.value)

    const proofFormat = CredentialMapper.detectDocumentType(credential) === DocumentFormat.JWT ? 'jwt' : 'lds'

    const credSubject = Array.isArray(credentialSubject) ? credentialSubject[0] : credentialSubject

    const statusPurpose = getAssertedProperty('statusPurpose', credSubject)

    const validFrom = uniform.validFrom ? new Date(uniform.validFrom) : undefined
    const validUntil = uniform.validUntil ? new Date(uniform.validUntil) : undefined
    const ttl = credSubject.ttl

    const updatedCredential = await this.createVerifiableCredential(
      {
        ...args,
        id,
        issuer,
        statusList,
        proofFormat: proofFormat,
        statusPurpose,
        ttl,
        validFrom,
        validUntil,
      },
      context,
    )

    return {
      statusListCredential: updatedCredential,
      encodedList: updatedCredential.credentialSubject.encodedList,
      bitstringStatusList: {
        statusPurpose,
        ...(updatedCredential.validFrom && { validFrom: new Date(updatedCredential.validFrom) }),
        ...(updatedCredential.validUntil && { validUntil: new Date(updatedCredential.validUntil) }),
        bitsPerStatus: args.bitsPerStatus,
        ttl,
      },
      length: statusList.getLength(),
      type: StatusListType.BitstringStatusList,
      proofFormat: proofFormat,
      id,
      issuer,
      statuslistContentType: this.buildContentType(proofFormat),
    }
  }

  async updateStatusListFromEncodedList(
    args: UpdateStatusListFromEncodedListArgs,
    context: IAgentContext<ICredentialPlugin & IIdentifierResolution>,
  ): Promise<StatusListResult> {
    if (!args.bitstringStatusList) {
      throw new Error('bitstringStatusList options required for type BitstringStatusList')
    }

    if (args.bitstringStatusList.bitsPerStatus < 1) {
      return Promise.reject('bitsPerStatus must be set for bitstring status lists and must be 1 or higher. (updateStatusListFromEncodedList)')
    }

    const { statusPurpose, bitsPerStatus, ttl, validFrom, validUntil } = args.bitstringStatusList

    const proofFormat: CredentialProofFormat = args?.proofFormat ?? DEFAULT_PROOF_FORMAT
    assertValidProofType(StatusListType.BitstringStatusList, proofFormat)
    const veramoProofFormat: VeramoProofFormat = proofFormat as VeramoProofFormat

    const { issuer, id } = getAssertedValues(args)
    const statusList: BitstreamStatusList = await BitstreamStatusList.decode({ encodedList: args.encodedList, statusSize: bitsPerStatus })
    const index = typeof args.statusListIndex === 'number' ? args.statusListIndex : parseInt(args.statusListIndex)
    statusList.setStatus(index, args.value)

    const credential = await this.createVerifiableCredential(
      {
        id,
        issuer,
        statusList,
        proofFormat: veramoProofFormat,
        keyRef: args.keyRef,
        statusPurpose,
        validFrom: ensureDate(validFrom),
        validUntil: ensureDate(validUntil),
        ttl,
      },
      context,
    )

    return {
      type: StatusListType.BitstringStatusList,
      statusListCredential: credential,
      encodedList: credential.credentialSubject.encodedList,
      bitstringStatusList: {
        statusPurpose,
        bitsPerStatus,
        ...(credential.validFrom && { validFrom: new Date(credential.validFrom) }),
        ...(credential.validUntil && { validUntil: new Date(credential.validUntil) }),
        ttl,
      },
      length: statusList.getLength(),
      proofFormat: args.proofFormat ?? 'lds',
      id: id,
      issuer: issuer,
      statuslistContentType: this.buildContentType(proofFormat),
    }
  }

  async checkStatusIndex(args: CheckStatusIndexArgs): Promise<BitstringStatus> {
    if (!args.bitsPerStatus || args.bitsPerStatus < 1) {
      return Promise.reject('bitsPerStatus must be set for bitstring status lists and must be 1 or higher. (checkStatusIndex)')
    }

    const uniform = CredentialMapper.toUniformCredential(args.statusListCredential)
    const { credentialSubject } = uniform
    const encodedList = getAssertedProperty('encodedList', credentialSubject)

    const statusSize = args.bitsPerStatus
    const statusList = await BitstreamStatusList.decode({ encodedList, statusSize })

    const numIndex = typeof args.statusListIndex === 'number' ? args.statusListIndex : parseInt(args.statusListIndex)
    if (statusList.getLength() <= numIndex) {
      throw new Error(`Status list index out of bounds, has ${statusList.getLength()} entries, requested ${numIndex}`)
    }
    return statusList.getStatus(numIndex)
  }

  async toStatusListDetails(args: ToStatusListDetailsArgs): Promise<StatusListResult> {
    const { statusListPayload, bitsPerStatus } = args
    if (!bitsPerStatus || bitsPerStatus < 1) {
      return Promise.reject('bitsPerStatus must be set for bitstring status lists and must be 1 or higher. (toStatusListDetails)')
    }

    const uniform = CredentialMapper.toUniformCredential(statusListPayload)
    const { issuer, credentialSubject } = uniform
    const id = getAssertedValue('id', uniform.id)
    const encodedList = getAssertedProperty('encodedList', credentialSubject)
    const proofFormat: CredentialProofFormat = CredentialMapper.detectDocumentType(statusListPayload) === DocumentFormat.JWT ? 'jwt' : 'lds'
    const credSubject = Array.isArray(credentialSubject) ? credentialSubject[0] : credentialSubject
    const statusPurpose = getAssertedProperty('statusPurpose', credSubject)
    const validFrom = uniform.validFrom ? new Date(uniform.validFrom) : undefined
    const validUntil = uniform.validUntil ? new Date(uniform.validUntil) : undefined
    const ttl = credSubject.ttl
    const statuslistLength: number = BitstreamStatusList.getStatusListLength(encodedList, bitsPerStatus)

    return {
      id,
      encodedList,
      issuer,
      type: StatusListType.BitstringStatusList,
      proofFormat,
      length: statuslistLength,
      statusListCredential: statusListPayload,
      statuslistContentType: this.buildContentType(proofFormat),
      bitstringStatusList: {
        statusPurpose,
        bitsPerStatus,
        validFrom,
        validUntil,
        ttl,
      },
      ...(args.correlationId && { correlationId: args.correlationId }),
      ...(args.driverType && { driverType: args.driverType }),
    }
  }

  private async createVerifiableCredential(
    args: {
      id: string
      issuer: string | IIssuer
      statusList?: BitstreamStatusList
      proofFormat: VeramoProofFormat
      statusPurpose: BitstringStatusPurpose
      validFrom?: Date
      validUntil?: Date
      ttl?: number
      keyRef?: string
    },
    context: IAgentContext<ICredentialPlugin & IIdentifierResolution>,
  ): Promise<BitstringStatusListCredential> {
    const identifier = await context.agent.identifierManagedGet({
      identifier: typeof args.issuer === 'string' ? args.issuer : args.issuer.id,
      vmRelationship: 'assertionMethod',
      offlineWhenNoDIDRegistered: true,
    })

    const unsignedCredential = await createStatusListCredential(args)

    const verifiableCredential = await context.agent.createVerifiableCredential({
      credential: unsignedCredential,
      keyRef: args.keyRef ?? identifier.kmsKeyRef,
      proofFormat: args.proofFormat,
      fetchRemoteContexts: true,
    })

    return CredentialMapper.toWrappedVerifiableCredential(verifiableCredential as StatusListCredential).original as BitstringStatusListCredential
  }

  private buildContentType(proofFormat: CredentialProofFormat | undefined) {
    switch (proofFormat) {
      case 'jwt':
        return `application/statuslist+jwt`
      case 'cbor':
        return `application/statuslist+cwt`
      case 'lds':
        return 'application/statuslist+ld+json'
      default:
        throw Error(`Unsupported content type '${proofFormat}' for status lists`)
    }
  }
}
