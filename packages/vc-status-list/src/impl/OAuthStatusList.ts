import { IAgentContext, ICredentialPlugin, IKeyManager } from '@veramo/core'
import { CompactJWT, CWT, ProofFormat, StatusListType } from '@sphereon/ssi-types'
import {
  CheckStatusIndexArgs,
  CreateStatusListArgs,
  SignedStatusListData,
  StatusListResult,
  StatusOAuth,
  ToStatusListDetailsArgs,
  UpdateStatusListFromEncodedListArgs,
  UpdateStatusListIndexArgs,
} from '../types'
import { determineProofFormat, getAssertedValue, getAssertedValues } from '../utils'
import { IStatusList } from './IStatusList'
import { StatusList } from '@sd-jwt/jwt-status-list'
import { IJwtService } from '@sphereon/ssi-sdk-ext.jwt-service'
import { IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { createSignedJwt, decodeStatusListJWT } from './encoding/jwt'
import { createSignedCbor, decodeStatusListCWT } from './encoding/cbor'

type IRequiredContext = IAgentContext<ICredentialPlugin & IJwtService & IIdentifierResolution & IKeyManager>

export const DEFAULT_BITS_PER_STATUS = 2 // 2 bits are sufficient for 0x00 - "VALID"  0x01 - "INVALID" & 0x02 - "SUSPENDED"
export const DEFAULT_LIST_LENGTH = 250000
export const DEFAULT_PROOF_FORMAT = 'jwt' as ProofFormat

export class OAuthStatusListImplementation implements IStatusList {
  async createNewStatusList(args: CreateStatusListArgs, context: IRequiredContext): Promise<StatusListResult> {
    if (!args.oauthStatusList) {
      throw new Error('OAuthStatusList options are required for type OAuthStatusList')
    }

    const proofFormat = args?.proofFormat ?? DEFAULT_PROOF_FORMAT
    const { issuer, id, oauthStatusList, keyRef } = args
    const { bitsPerStatus, expiresAt } = oauthStatusList
    const length = args.length ?? DEFAULT_LIST_LENGTH
    const issuerString = typeof issuer === 'string' ? issuer : issuer.id
    const correlationId = getAssertedValue('correlationId', args.correlationId)

    const statusList = new StatusList(new Array(length).fill(0), bitsPerStatus ?? DEFAULT_BITS_PER_STATUS)
    const encodedList = statusList.compressStatusList()
    const { statusListCredential } = await this.createSignedStatusList(proofFormat, context, statusList, issuerString, id, expiresAt, keyRef)

    return {
      encodedList,
      statusListCredential,
      oauthStatusList: { bitsPerStatus },
      length,
      type: StatusListType.OAuthStatusList,
      proofFormat,
      id,
      correlationId,
      issuer,
    }
  }

  async updateStatusListIndex(args: UpdateStatusListIndexArgs, context: IRequiredContext): Promise<StatusListResult> {
    const { statusListCredential, value, expiresAt, keyRef } = args
    if (typeof statusListCredential !== 'string') {
      return Promise.reject('statusListCredential in neither JWT nor CWT')
    }

    const proofFormat = determineProofFormat(statusListCredential)
    const decoded = proofFormat === 'jwt' ? decodeStatusListJWT(statusListCredential) : decodeStatusListCWT(statusListCredential)
    const { statusList, issuer, id } = decoded

    const index = typeof args.statusListIndex === 'number' ? args.statusListIndex : parseInt(args.statusListIndex)
    if (index < 0 || index >= statusList.statusList.length) {
      throw new Error('Status list index out of bounds')
    }

    statusList.setStatus(index, value)
    const { statusListCredential: signedCredential, encodedList } = await this.createSignedStatusList(
      proofFormat,
      context,
      statusList,
      issuer,
      id,
      expiresAt,
      keyRef,
    )

    return {
      statusListCredential: signedCredential,
      encodedList,
      oauthStatusList: {
        bitsPerStatus: statusList.getBitsPerStatus(),
      },
      length: statusList.statusList.length,
      type: StatusListType.OAuthStatusList,
      proofFormat,
      id,
      issuer,
    }
  }

  async updateStatusListFromEncodedList(args: UpdateStatusListFromEncodedListArgs, context: IRequiredContext): Promise<StatusListResult> {
    if (!args.oauthStatusList) {
      throw new Error('OAuthStatusList options are required for type OAuthStatusList')
    }
    const { proofFormat, oauthStatusList, keyRef } = args
    const { bitsPerStatus, expiresAt } = oauthStatusList

    const { issuer, id } = getAssertedValues(args)
    const issuerString = typeof issuer === 'string' ? issuer : issuer.id

    const listToUpdate = StatusList.decompressStatusList(args.encodedList, bitsPerStatus ?? DEFAULT_BITS_PER_STATUS)
    const index = typeof args.statusListIndex === 'number' ? args.statusListIndex : parseInt(args.statusListIndex)
    listToUpdate.setStatus(index, args.value ? 1 : 0)

    const { statusListCredential, encodedList } = await this.createSignedStatusList(
      proofFormat ?? DEFAULT_PROOF_FORMAT,
      context,
      listToUpdate,
      issuerString,
      id,
      expiresAt,
      keyRef,
    )

    return {
      encodedList,
      statusListCredential,
      oauthStatusList: {
        bitsPerStatus,
        expiresAt,
      },
      length: listToUpdate.statusList.length,
      type: StatusListType.OAuthStatusList,
      proofFormat: proofFormat ?? DEFAULT_PROOF_FORMAT,
      id,
      issuer,
    }
  }

  async checkStatusIndex(args: CheckStatusIndexArgs): Promise<number | StatusOAuth> {
    const { statusListCredential, statusListIndex } = args
    if (typeof statusListCredential !== 'string') {
      return Promise.reject('statusListCredential in neither JWT nor CWT')
    }

    const proofFormat = determineProofFormat(statusListCredential)
    const { statusList } = proofFormat === 'jwt' ? decodeStatusListJWT(statusListCredential) : decodeStatusListCWT(statusListCredential)

    const index = typeof statusListIndex === 'number' ? statusListIndex : parseInt(statusListIndex)
    if (index < 0 || index >= statusList.statusList.length) {
      throw new Error('Status list index out of bounds')
    }

    return statusList.getStatus(index)
  }

  async toStatusListDetails(args: ToStatusListDetailsArgs): Promise<StatusListResult> {
    const { statusListPayload } = args as { statusListPayload: CompactJWT | CWT }
    const proofFormat = determineProofFormat(statusListPayload)
    const decoded = proofFormat === 'jwt' ? decodeStatusListJWT(statusListPayload) : decodeStatusListCWT(statusListPayload)
    const { statusList, issuer, id, exp } = decoded

    return {
      id,
      encodedList: statusList.compressStatusList(),
      issuer,
      type: StatusListType.OAuthStatusList,
      proofFormat,
      length: statusList.statusList.length,
      statusListCredential: statusListPayload,
      oauthStatusList: {
        bitsPerStatus: statusList.getBitsPerStatus(),
        ...(exp && { expiresAt: new Date(exp * 1000) }),
      },
      ...(args.correlationId && { correlationId: args.correlationId }),
      ...(args.driverType && { driverType: args.driverType }),
    }
  }

  private async createSignedStatusList(
    proofFormat: 'jwt' | 'lds' | 'EthereumEip712Signature2021' | 'cbor',
    context: IAgentContext<ICredentialPlugin & IJwtService & IIdentifierResolution & IKeyManager>,
    statusList: StatusList,
    issuerString: string,
    id: string,
    expiresAt?: Date,
    keyRef?: string,
  ): Promise<SignedStatusListData> {
    switch (proofFormat) {
      case 'jwt': {
        return await createSignedJwt(context, statusList, issuerString, id, expiresAt, keyRef)
      }
      case 'cbor': {
        return await createSignedCbor(context, statusList, issuerString, id, expiresAt, keyRef)
      }
      default:
        throw new Error(`Invalid proof format '${proofFormat}' for OAuthStatusList`)
    }
  }
}
