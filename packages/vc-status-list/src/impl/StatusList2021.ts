import { IAgentContext, ICredentialPlugin, ProofFormat } from '@veramo/core'
import { IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { CredentialMapper, DocumentFormat, IIssuer, StatusListVerifiableCredential, StatusListType } from '@sphereon/ssi-types'
import { StatusList } from '@sphereon/vc-status-list'
import { IStatusList } from './IStatusList'
import {
  CheckStatusIndexArgs,
  CreateStatusListArgs,
  Status2021,
  StatusListResult,
  UpdateStatusListFromEncodedListArgs,
  UpdateStatusListIndexArgs,
} from '../types'
import { getAssertedProperty, getAssertedValue, getAssertedValues } from '../utils'

export const DEFAULT_LIST_LENGTH = 250000

export class StatusList2021Implementation implements IStatusList {
  async createNewStatusList(
    args: CreateStatusListArgs,
    context: IAgentContext<ICredentialPlugin & IIdentifierResolution>,
  ): Promise<StatusListResult> {
    const length = args?.length ?? DEFAULT_LIST_LENGTH
    const proofFormat: ProofFormat = args?.proofFormat ?? 'lds'
    const { issuer, id } = args
    const correlationId = getAssertedValue('correlationId', args.correlationId)

    const list = new StatusList({ length })
    const encodedList = await list.encode()
    const statusPurpose = 'revocation'

    const statusListCredential = await this.createVerifiableCredential(
      {
        ...args,
        encodedList,
        proofFormat,
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
    const statusList = await StatusList.decode({ encodedList: origEncodedList })
    statusList.setStatus(index, args.value != 0)
    const encodedList = await statusList.encode()

    const updatedCredential = await this.createVerifiableCredential(
      {
        ...args,
        id,
        issuer,
        encodedList,
        proofFormat: CredentialMapper.detectDocumentType(credential) === DocumentFormat.JWT ? 'jwt' : 'lds',
      },
      context,
    )

    return {
      statusListCredential: updatedCredential,
      encodedList,
      statusList2021: {
        ...('statusPurpose' in credentialSubject ? { statusPurpose: credentialSubject.statusPurpose } : {}),
        indexingDirection: 'rightToLeft',
      },
      length: statusList.length - 1,
      type: StatusListType.StatusList2021,
      proofFormat: CredentialMapper.detectDocumentType(credential) === DocumentFormat.JWT ? 'jwt' : 'lds',
      id,
      issuer,
    }
  }

  async updateStatusListFromEncodedList(
    args: UpdateStatusListFromEncodedListArgs,
    context: IAgentContext<ICredentialPlugin & IIdentifierResolution>,
  ): Promise<StatusListResult> {
    if (!args.statusList2021) {
      throw new Error('statusList2021 options required for type StatusList2021')
    }
    const { issuer, id } = getAssertedValues(args)

    const statusList = await StatusList.decode({ encodedList: args.encodedList })
    const index = typeof args.statusListIndex === 'number' ? args.statusListIndex : parseInt(args.statusListIndex)
    statusList.setStatus(index, args.value)

    const newEncodedList = await statusList.encode()
    const credential = await this.createVerifiableCredential(
      {
        id,
        issuer,
        encodedList: newEncodedList,
        proofFormat: args.proofFormat,
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

  private async createVerifiableCredential(
    args: {
      id: string
      issuer: string | IIssuer
      encodedList: string
      proofFormat?: ProofFormat
      keyRef?: string
    },
    context: IAgentContext<ICredentialPlugin & IIdentifierResolution>,
  ): Promise<StatusListVerifiableCredential> {
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
      proofFormat: args.proofFormat ?? 'lds',
      fetchRemoteContexts: true,
    })

    return CredentialMapper.toWrappedVerifiableCredential(verifiableCredential as StatusListVerifiableCredential)
      .original as StatusListVerifiableCredential
  }
}
