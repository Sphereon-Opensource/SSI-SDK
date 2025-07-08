import type { IAgentContext, ICredentialPlugin, ProofFormat as VeramoProofFormat } from '@veramo/core'
import type { IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import {
  type BitstringStatusPurpose,
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
  BitstringStatusResult,
  CheckStatusIndexArgs,
  CreateStatusListArgs,
  StatusListResult,
  ToStatusListDetailsArgs,
  UpdateStatusListFromEncodedListArgs,
  UpdateStatusListIndexArgs,
} from '../types'

import { assertValidProofType, getAssertedProperty, getAssertedValue, getAssertedValues } from '../utils'
import { createList, decodeList } from '@digitalbazaar/vc-bitstring-status-list'
import { IBitstringStatusList } from '../types/BitstringStatusList'

export const DEFAULT_LIST_LENGTH = 131072 // W3C spec minimum
export const DEFAULT_PROOF_FORMAT = 'lds' as CredentialProofFormat
export const DEFAULT_STATUS_SIZE = 1
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
    const { statusPurpose, statusSize, statusMessage, ttl } = args.bitstringStatusList
    const list = (await createList({ length })) as IBitstringStatusList
    const encodedList = await list.encode()

    const statusListCredential = await this.createVerifiableCredential(
      {
        ...args,
        encodedList,
        proofFormat: veramoProofFormat,
        statusPurpose: statusPurpose ?? DEFAULT_STATUS_PURPOSE,
        statusSize: statusSize ?? DEFAULT_STATUS_SIZE,
        statusMessage: statusMessage,
        ttl,
      },
      context,
    )

    return {
      encodedList,
      statusListCredential: statusListCredential,
      bitstringStatusList: {
        statusPurpose: statusPurpose ?? DEFAULT_STATUS_PURPOSE,
        ttl,
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
    const credential = args.statusListCredential
    const uniform = CredentialMapper.toUniformCredential(credential)
    const { issuer, credentialSubject } = uniform
    const id = getAssertedValue('id', uniform.id)
    const origEncodedList = getAssertedProperty('encodedList', credentialSubject)

    const index = typeof args.statusListIndex === 'number' ? args.statusListIndex : parseInt(args.statusListIndex)
    const statusList = (await decodeList({ encodedList: origEncodedList })) as IBitstringStatusList
    statusList.setStatus(index, args.value != 0)
    const encodedList = await statusList.encode()

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
        encodedList,
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
      encodedList,
      bitstringStatusList: {
        statusPurpose,
        validFrom,
        validUntil,
        ttl,
      },
      length: statusList.length - 1,
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
    const proofFormat: CredentialProofFormat = args?.proofFormat ?? DEFAULT_PROOF_FORMAT
    assertValidProofType(StatusListType.BitstringStatusList, proofFormat)
    const veramoProofFormat: VeramoProofFormat = proofFormat as VeramoProofFormat

    const { issuer, id } = getAssertedValues(args)
    const statusList = (await decodeList({ encodedList: args.encodedList })) as IBitstringStatusList
    const index = typeof args.statusListIndex === 'number' ? args.statusListIndex : parseInt(args.statusListIndex)
    statusList.setStatus(index, args.value)

    const newEncodedList = await statusList.encode()
    const { statusPurpose, statusSize, statusMessage, ttl, validFrom, validUntil } = args.bitstringStatusList

    const credential = await this.createVerifiableCredential(
      {
        id,
        issuer,
        encodedList: newEncodedList,
        proofFormat: veramoProofFormat,
        keyRef: args.keyRef,
        statusPurpose,
        statusSize,
        statusMessage,
        validFrom,
        validUntil,
        ttl,
      },
      context,
    )

    return {
      type: StatusListType.BitstringStatusList,
      statusListCredential: credential,
      encodedList: newEncodedList,
      bitstringStatusList: {
        statusPurpose,
        validFrom,
        validUntil,
        ttl,
      },
      length: statusList.length,
      proofFormat: args.proofFormat ?? 'lds',
      id: id,
      issuer: issuer,
      statuslistContentType: this.buildContentType(proofFormat),
    }
  }

  async checkStatusIndex(args: CheckStatusIndexArgs): Promise<BitstringStatusResult> {
    const uniform = CredentialMapper.toUniformCredential(args.statusListCredential)
    const { credentialSubject } = uniform
    const encodedList = getAssertedProperty('encodedList', credentialSubject)

    const subject = Array.isArray(credentialSubject) ? credentialSubject[0] : credentialSubject
    const messageList = (subject as any).statusMessage as Array<Partial<BitstringStatus>>

    const numIndex = typeof args.statusListIndex === 'number' ? args.statusListIndex : parseInt(args.statusListIndex)
    const hexIndex = `0x${numIndex.toString(16)}`
    const statusMessage = messageList.find((statMsg) => statMsg.status === hexIndex)

    const statusList = (await decodeList({ encodedList })) as IBitstringStatusList
    if (statusList.length <= numIndex) {
      throw new Error(`Status list index out of bounds, has ${messageList.length} messages, requested ${numIndex}`)
    }
    const value = statusList.getStatus(numIndex)
    return {
      index: numIndex,
      status: hexIndex,
      message: statusMessage?.message,
      set: value,
    } satisfies BitstringStatusResult
  }

  async toStatusListDetails(args: ToStatusListDetailsArgs): Promise<StatusListResult> {
    const { statusListPayload } = args
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
    const list = (await decodeList({ encodedList })) as IBitstringStatusList

    return {
      id,
      encodedList,
      issuer,
      type: StatusListType.BitstringStatusList,
      proofFormat,
      length: list.length,
      statusListCredential: statusListPayload,
      statuslistContentType: this.buildContentType(proofFormat),
      bitstringStatusList: {
        statusPurpose,
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
      encodedList: string
      proofFormat: VeramoProofFormat
      statusPurpose: BitstringStatusPurpose
      statusSize?: number
      statusMessage?: Array<BitstringStatus>
      validFrom?: Date
      validUntil?: Date
      ttl?: number
      keyRef?: string
    },
    context: IAgentContext<ICredentialPlugin & IIdentifierResolution>,
  ): Promise<StatusListCredential> {
    const identifier = await context.agent.identifierManagedGet({
      identifier: typeof args.issuer === 'string' ? args.issuer : args.issuer.id,
      vmRelationship: 'assertionMethod',
      offlineWhenNoDIDRegistered: true,
    })

    const credentialSubject: any = {
      id: args.id,
      type: 'BitstringStatusList',
      statusPurpose: args.statusPurpose,
      encodedList: args.encodedList,
    }

    if (args.statusSize && args.statusSize > 1) {
      credentialSubject.statusSize = args.statusSize
    }

    if (args.statusMessage) {
      credentialSubject.statusMessage = args.statusMessage
    }

    if (args.validFrom) {
      credentialSubject.validFrom = args.validFrom
    }

    if (args.validUntil) {
      credentialSubject.validUntil = args.validUntil
    }

    if (args.ttl) {
      credentialSubject.ttl = args.ttl
    }

    const credential = {
      '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/ns/credentials/status/v1'],
      id: args.id,
      issuer: args.issuer,
      type: ['VerifiableCredential', 'BitstringStatusListCredential'],
      credentialSubject,
    }

    const verifiableCredential = await context.agent.createVerifiableCredential({
      credential,
      keyRef: args.keyRef ?? identifier.kmsKeyRef,
      proofFormat: args.proofFormat,
      fetchRemoteContexts: true,
    })

    return CredentialMapper.toWrappedVerifiableCredential(verifiableCredential as StatusListCredential).original as StatusListCredential
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
