import { IAgentContext, ICredentialPlugin, ProofFormat } from '@veramo/core'
import { IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { CredentialMapper, DocumentFormat, IIssuer, OriginalVerifiableCredential, StatusListType } from '@sphereon/ssi-types'
import { StatusList } from '@sphereon/vc-status-list'
import { IStatusList } from './IStatusList'
import { StatusListDetails, StatusListResult, UpdateStatusListFromEncodedListArgs } from '../types'
import { getAssertedValue, getAssertedValues } from '../utils'

export class StatusList2021Implementation implements IStatusList {
  async createNewStatusList(
    args: {
      issuer: string | IIssuer
      id: string
      proofFormat?: ProofFormat
      keyRef?: string
      correlationId?: string
      length?: number
    },
    context: IAgentContext<ICredentialPlugin & IIdentifierResolution>,
  ): Promise<StatusListResult> {
    const length = args?.length ?? 250000
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
      length,
      type: StatusListType.StatusList2021,
      proofFormat,
      id,
      correlationId,
      issuer,
      statusPurpose,
      indexingDirection: 'rightToLeft',
    }
  }

  async updateStatusListIndex(
    args: {
      statusListCredential: OriginalVerifiableCredential
      keyRef?: string
      statusListIndex: number | string
      value: boolean
    },
    context: IAgentContext<ICredentialPlugin & IIdentifierResolution>,
  ): Promise<StatusListDetails> {
    const credential = args.statusListCredential
    const uniform = CredentialMapper.toUniformCredential(credential)
    const { issuer, credentialSubject } = uniform
    const id = getAssertedValue('id', uniform.id)
    // @ts-ignore
    const origEncodedList = credentialSubject.encodedList

    const index = typeof args.statusListIndex === 'number' ? args.statusListIndex : parseInt(args.statusListIndex)
    const statusList = await StatusList.decode({ encodedList: origEncodedList })
    statusList.setStatus(index, args.value)
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
      encodedList,
      statusListCredential: updatedCredential,
      length: statusList.length - 1,
      type: StatusListType.StatusList2021,
      proofFormat: CredentialMapper.detectDocumentType(credential) === DocumentFormat.JWT ? 'jwt' : 'lds',
      id,
      issuer,
      // @ts-ignore
      statusPurpose: credentialSubject.statusPurpose,
      indexingDirection: 'rightToLeft',
    }
  }

  async updateStatusListFromEncodedList(
    args: UpdateStatusListFromEncodedListArgs,
    context: IAgentContext<ICredentialPlugin & IIdentifierResolution>,
  ): Promise<StatusListDetails> {
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
      encodedList: newEncodedList,
      statusListCredential: credential,
      length: statusList.length,
      type: StatusListType.StatusList2021,
      proofFormat: args.proofFormat ?? 'lds',
      id: id,
      issuer: issuer,
      statusPurpose: 'revocation',
      indexingDirection: 'rightToLeft',
    }
  }

  async checkStatusIndex(args: { statusListCredential: OriginalVerifiableCredential; statusListIndex: string | number }): Promise<boolean> {
    const uniform = CredentialMapper.toUniformCredential(args.statusListCredential)
    const { credentialSubject } = uniform
    // @ts-ignore
    const encodedList = getAssertedValue('encodedList', credentialSubject.encodedList)

    const statusList = await StatusList.decode({ encodedList })
    const status = statusList.getStatus(typeof args.statusListIndex === 'number' ? args.statusListIndex : parseInt(args.statusListIndex))
    return status
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
  ): Promise<OriginalVerifiableCredential> {
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

    return CredentialMapper.toWrappedVerifiableCredential(verifiableCredential as OriginalVerifiableCredential).original
  }
}
