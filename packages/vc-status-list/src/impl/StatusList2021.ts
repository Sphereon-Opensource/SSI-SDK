import type { IAgentContext, ProofFormat as VeramoProofFormat } from '@veramo/core'
import type { IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import {
  CredentialMapper,
  type CredentialProofFormat,
  DocumentFormat,
  type IIssuer,
  type StatusListCredential,
  StatusListType,
} from '@sphereon/ssi-types'

import { StatusList } from '@sphereon/vc-status-list'
import type { IExtractedCredentialDetails, IStatusList, IStatusList2021ImplementationResult } from './IStatusList'
import type {
  CheckStatusIndexArgs,
  CreateStatusListArgs,
  IMergeDetailsWithEntityArgs,
  IToDetailsFromCredentialArgs,
  StatusListResult,
  UpdateStatusListFromEncodedListArgs,
  UpdateStatusListIndexArgs,
} from '../types'
import { Status2021, StatusList2021EntryCredentialStatus } from '../types'
import { assertValidProofType, getAssertedProperty, getAssertedValue, getAssertedValues } from '../utils'
import { IBitstringStatusListEntryEntity, IStatusListEntryEntity, StatusList2021Entity, StatusListEntity } from '@sphereon/ssi-sdk.data-store'
import { IVcdmCredentialPlugin } from '@sphereon/ssi-sdk.credential-vcdm'

export const DEFAULT_LIST_LENGTH = 250000
export const DEFAULT_PROOF_FORMAT = 'lds' as CredentialProofFormat

export class StatusList2021Implementation implements IStatusList {
  async createNewStatusList(
    args: CreateStatusListArgs,
    context: IAgentContext<IVcdmCredentialPlugin & IIdentifierResolution>,
  ): Promise<StatusListResult> {
    const length = args?.length ?? DEFAULT_LIST_LENGTH
    const proofFormat: CredentialProofFormat = args?.proofFormat ?? DEFAULT_PROOF_FORMAT
    assertValidProofType(StatusListType.StatusList2021, proofFormat)
    const veramoProofFormat: VeramoProofFormat = proofFormat as VeramoProofFormat

    const { issuer, id } = args
    const correlationId = getAssertedValue('correlationId', args.correlationId)

    const list = new StatusList({ length })
    const encodedList = await list.encode()
    const statusPurpose = 'revocation'

    const statusListCredential = await this.createVerifiableCredential(
      {
        ...args,
        encodedList,
        proofFormat: veramoProofFormat,
      },
      context,
    )

    return {
      encodedList,
      statusListCredential: statusListCredential,
      statusList2021: {
        statusPurpose,
        indexingDirection: 'rightToLeft',
      },
      length,
      type: StatusListType.StatusList2021,
      proofFormat,
      id,
      correlationId,
      issuer,
      statuslistContentType: this.buildContentType(proofFormat),
    }
  }

  async updateStatusListIndex(
    args: UpdateStatusListIndexArgs,
    context: IAgentContext<IVcdmCredentialPlugin & IIdentifierResolution>,
  ): Promise<StatusListResult> {
    const credential = args.statusListCredential
    const uniform = CredentialMapper.toUniformCredential(credential)
    const { issuer, credentialSubject } = uniform
    const id = getAssertedValue('id', uniform.id)
    const origEncodedList = getAssertedProperty('encodedList', credentialSubject)

    const index = typeof args.statusListIndex === 'number' ? args.statusListIndex : parseInt(args.statusListIndex)
    const statusList = await StatusList.decode({ encodedList: origEncodedList })
    statusList.setStatus(index, args.value != 0)
    const encodedList = await statusList.encode()

    const proofFormat = CredentialMapper.detectDocumentType(credential) === DocumentFormat.JWT ? 'jwt' : 'lds'
    const updatedCredential = await this.createVerifiableCredential(
      {
        ...args,
        id,
        issuer,
        encodedList,
        proofFormat: proofFormat,
      },
      context,
    )

    if (!('statusPurpose' in credentialSubject)) {
      return Promise.reject(Error('statusPurpose is required in credentialSubject for StatusList2021'))
    }

    return {
      statusListCredential: updatedCredential,
      encodedList,
      statusList2021: {
        statusPurpose: credentialSubject.statusPurpose,
        indexingDirection: 'rightToLeft',
      },
      length: statusList.length - 1,
      type: StatusListType.StatusList2021,
      proofFormat: proofFormat,
      id,
      issuer,
      statuslistContentType: this.buildContentType(proofFormat),
    }
  }

  async updateStatusListFromEncodedList(
    args: UpdateStatusListFromEncodedListArgs,
    context: IAgentContext<IVcdmCredentialPlugin & IIdentifierResolution>,
  ): Promise<StatusListResult> {
    if (!args.statusList2021) {
      throw new Error('statusList2021 options required for type StatusList2021')
    }
    const proofFormat: CredentialProofFormat = args?.proofFormat ?? DEFAULT_PROOF_FORMAT
    assertValidProofType(StatusListType.StatusList2021, proofFormat)
    const veramoProofFormat: VeramoProofFormat = proofFormat as VeramoProofFormat

    const { issuer, id } = getAssertedValues(args)
    const statusList = await StatusList.decode({ encodedList: args.encodedList })
    const index = typeof args.statusListIndex === 'number' ? args.statusListIndex : parseInt(args.statusListIndex)
    statusList.setStatus(index, args.value !== 0)

    const newEncodedList = await statusList.encode()
    const credential = await this.createVerifiableCredential(
      {
        id,
        issuer,
        encodedList: newEncodedList,
        proofFormat: veramoProofFormat,
        keyRef: args.keyRef,
      },
      context,
    )

    return {
      type: StatusListType.StatusList2021,
      statusListCredential: credential,
      encodedList: newEncodedList,
      statusList2021: {
        statusPurpose: args.statusList2021.statusPurpose,
        indexingDirection: 'rightToLeft',
      },
      length: statusList.length,
      proofFormat: args.proofFormat ?? 'lds',
      id: id,
      issuer: issuer,
      statuslistContentType: this.buildContentType(proofFormat),
    }
  }

  async checkStatusIndex(args: CheckStatusIndexArgs): Promise<number | Status2021> {
    const uniform = CredentialMapper.toUniformCredential(args.statusListCredential)
    const { credentialSubject } = uniform
    const encodedList = getAssertedProperty('encodedList', credentialSubject)

    const statusList = await StatusList.decode({ encodedList })
    const status = statusList.getStatus(typeof args.statusListIndex === 'number' ? args.statusListIndex : parseInt(args.statusListIndex))
    return status ? Status2021.Invalid : Status2021.Valid
  }

  async extractCredentialDetails(credential: StatusListCredential): Promise<IExtractedCredentialDetails> {
    const uniform = CredentialMapper.toUniformCredential(credential)
    const { issuer, credentialSubject } = uniform
    const subject = Array.isArray(credentialSubject) ? credentialSubject[0] : credentialSubject

    return {
      id: getAssertedValue('id', uniform.id),
      issuer,
      encodedList: getAssertedProperty('encodedList', subject),
    }
  }

  async toStatusListDetails(args: IToDetailsFromCredentialArgs): Promise<StatusListResult & IStatusList2021ImplementationResult>
  // For UPDATE contexts
  async toStatusListDetails(args: IMergeDetailsWithEntityArgs): Promise<StatusListResult & IStatusList2021ImplementationResult>
  async toStatusListDetails(
    args: IToDetailsFromCredentialArgs | IMergeDetailsWithEntityArgs,
  ): Promise<StatusListResult & IStatusList2021ImplementationResult> {
    if ('statusListCredential' in args) {
      // CREATE/READ context
      const { statusListCredential, correlationId, driverType } = args
      const uniform = CredentialMapper.toUniformCredential(statusListCredential)
      const { issuer, credentialSubject } = uniform
      const subject = Array.isArray(credentialSubject) ? credentialSubject[0] : credentialSubject

      const id = getAssertedValue('id', uniform.id)
      const encodedList = getAssertedProperty('encodedList', subject)
      const statusPurpose = getAssertedProperty('statusPurpose', subject)
      const proofFormat: CredentialProofFormat = CredentialMapper.detectDocumentType(statusListCredential) === DocumentFormat.JWT ? 'jwt' : 'lds'
      const list = await StatusList.decode({ encodedList })

      return {
        id,
        encodedList,
        issuer,
        type: StatusListType.StatusList2021,
        proofFormat,
        length: list.length,
        statusListCredential,
        statuslistContentType: this.buildContentType(proofFormat),
        correlationId,
        driverType,
        indexingDirection: 'rightToLeft',
        statusPurpose,
        statusList2021: {
          indexingDirection: 'rightToLeft',
          statusPurpose,
        },
      }
    } else {
      // UPDATE context
      const { extractedDetails, statusListEntity } = args
      const statusList2021Entity = statusListEntity as StatusList2021Entity

      const proofFormat: CredentialProofFormat =
        CredentialMapper.detectDocumentType(statusListEntity.statusListCredential!) === DocumentFormat.JWT ? 'jwt' : 'lds'
      const list = await StatusList.decode({ encodedList: extractedDetails.encodedList })

      return {
        id: extractedDetails.id,
        encodedList: extractedDetails.encodedList,
        issuer: extractedDetails.issuer,
        type: StatusListType.StatusList2021,
        proofFormat,
        length: list.length,
        statusListCredential: statusListEntity.statusListCredential!,
        statuslistContentType: this.buildContentType(proofFormat),
        correlationId: statusListEntity.correlationId,
        driverType: statusListEntity.driverType,
        indexingDirection: statusList2021Entity.indexingDirection,
        statusPurpose: statusList2021Entity.statusPurpose,
        statusList2021: {
          indexingDirection: statusList2021Entity.indexingDirection,
          statusPurpose: statusList2021Entity.statusPurpose,
        },
      }
    }
  }

  async createCredentialStatus(args: {
    statusList: StatusListEntity
    statusListEntry: IStatusListEntryEntity | IBitstringStatusListEntryEntity
    statusListIndex: number
  }): Promise<StatusList2021EntryCredentialStatus> {
    const { statusList, statusListIndex } = args

    // Cast to StatusList2021Entity to access specific properties
    const statusList2021 = statusList as StatusList2021Entity

    return {
      id: `${statusList.id}#${statusListIndex}`,
      type: 'StatusList2021Entry',
      statusPurpose: statusList2021.statusPurpose ?? 'revocation',
      statusListIndex: '' + statusListIndex,
      statusListCredential: statusList.id,
    }
  }

  private async createVerifiableCredential(
    args: {
      id: string
      issuer: string | IIssuer
      encodedList: string
      proofFormat: VeramoProofFormat
      keyRef?: string
    },
    context: IAgentContext<IVcdmCredentialPlugin & IIdentifierResolution>,
  ): Promise<StatusListCredential> {
    const identifier = await context.agent.identifierManagedGet({
      identifier: typeof args.issuer === 'string' ? args.issuer : args.issuer.id,
      vmRelationship: 'assertionMethod',
      offlineWhenNoDIDRegistered: true,
    })

    const credential = {
      '@context': ['https://www.w3.org/2018/credentials/v1', 'https://w3id.org/vc/status-list/2021/v1'],
      id: args.id,
      issuer: args.issuer,
      type: ['VerifiableCredential', 'StatusList2021Credential'],
      credentialSubject: {
        id: args.id,
        type: 'StatusList2021',
        statusPurpose: 'revocation',
        encodedList: args.encodedList,
      },
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
