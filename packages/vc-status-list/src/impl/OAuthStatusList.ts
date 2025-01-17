import { IAgentContext, ICredentialPlugin } from '@veramo/core'
import { ProofFormat, StatusListType, StatusListVerifiableCredential } from '@sphereon/ssi-types'
import {
  CheckStatusIndexArgs,
  CreateStatusListArgs,
  StatusListResult,
  StatusOAuth,
  UpdateStatusListFromEncodedListArgs,
  UpdateStatusListIndexArgs,
} from '../types'
import { determineProofFormat, getAssertedValue, getAssertedValues } from '../utils'
import { IStatusList } from './IStatusList'
import { StatusList, StatusListJWTHeaderParameters } from '@sd-jwt/jwt-status-list'
import { IJwtService } from '@sphereon/ssi-sdk-ext.jwt-service'
import { IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { createSignedJwt, decodeStatusListJWT } from './encoding/jwt'
import { createSignedCbor, decodeStatusListCWT } from './encoding/cbor'

type IRequiredContext = IAgentContext<ICredentialPlugin & IJwtService & IIdentifierResolution>

export const BITS_PER_STATUS_DEFAULT = 2 // 2 bits are sufficient for 0x00 - "VALID"  0x01 - "INVALID" & 0x02 - "SUSPENDED"
export const DEFAULT_LIST_LENGTH = 250000
export const DEFAULT_PROOF_FORMAT = 'jwt' as ProofFormat
export const STATUS_LIST_JWT_HEADER: StatusListJWTHeaderParameters = {
  alg: 'EdDSA',
  typ: 'statuslist+jwt',
}

export class OAuthStatusListImplementation implements IStatusList {
  async createNewStatusList(args: CreateStatusListArgs, context: IRequiredContext): Promise<StatusListResult> {
    if (!args.oauthStatusList) {
      throw new Error('OAuthStatusList options are required for type OAuthStatusList')
    }

    const proofFormat = args?.proofFormat ?? DEFAULT_PROOF_FORMAT
    const { issuer, id } = args
    const length = args.length ?? DEFAULT_LIST_LENGTH
    const bitsPerStatus = args.oauthStatusList.bitsPerStatus ?? BITS_PER_STATUS_DEFAULT
    const issuerString = typeof issuer === 'string' ? issuer : issuer.id
    const correlationId = getAssertedValue('correlationId', args.correlationId)

    const statusList = new StatusList(new Array(length).fill(0), bitsPerStatus)
    const encodedList = statusList.compressStatusList()
    let statusListCredential: StatusListVerifiableCredential

    switch (proofFormat) {
      case 'jwt': {
        const { statusListCredential: slJwt } = await createSignedJwt(context, statusList, issuerString, id, args.keyRef)
        statusListCredential = slJwt
        break
      }
      case 'cbor': {
        const { statusListCredential: slCbor } = await createSignedCbor(context, statusList, issuerString, id, args.keyRef)
        statusListCredential = slCbor
        break
      }
      default:
        throw new Error(`Invalid proof format '${proofFormat}' for OAuthStatusList`)
    }

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
    const { statusListCredential, value } = args
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
    const result =
      proofFormat === 'jwt'
        ? await createSignedJwt(context, statusList, issuer, id, args.keyRef)
        : await createSignedCbor(context, statusList, issuer, id, args.keyRef)

    return {
      ...result,
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

    const proofFormat = args.proofFormat ?? DEFAULT_PROOF_FORMAT
    const { issuer, id } = getAssertedValues(args)
    const bitsPerStatus = args.oauthStatusList.bitsPerStatus ?? BITS_PER_STATUS_DEFAULT
    const issuerString = typeof issuer === 'string' ? issuer : issuer.id

    const listToUpdate = StatusList.decompressStatusList(args.encodedList, bitsPerStatus)
    const index = typeof args.statusListIndex === 'number' ? args.statusListIndex : parseInt(args.statusListIndex)
    listToUpdate.setStatus(index, args.value ? 1 : 0)

    let result: { statusListCredential: StatusListVerifiableCredential; encodedList: string }

    switch (proofFormat) {
      case 'jwt':
        result = await createSignedJwt(context, listToUpdate, issuerString, id, args.keyRef)
        break
      case 'cbor':
        result = await createSignedCbor(context, listToUpdate, issuerString, id, args.keyRef)
        break
      default:
        throw new Error(`Invalid proof format '${proofFormat}' for OAuthStatusList`)
    }

    return {
      encodedList: result.encodedList,
      statusListCredential: result.statusListCredential,
      oauthStatusList: {
        bitsPerStatus,
      },
      length: listToUpdate.statusList.length,
      type: StatusListType.OAuthStatusList,
      proofFormat,
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
}
