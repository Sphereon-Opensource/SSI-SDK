import type { IAgentContext, IKeyManager } from '@veramo/core'
import { type CompactJWT, type CredentialProofFormat, type CWT, StatusListType } from '@sphereon/ssi-types'
import type {
  CheckStatusIndexArgs,
  CreateStatusListArgs,
  IMergeDetailsWithEntityArgs,
  IToDetailsFromCredentialArgs,
  SignedStatusListData,
  StatusListOAuthEntryCredentialStatus,
  StatusListResult,
  StatusOAuth,
  UpdateStatusListFromEncodedListArgs,
  UpdateStatusListIndexArgs,
} from '../types'
import { determineProofFormat, ensureDate, getAssertedValue, getAssertedValues } from '../utils'
import type { IExtractedCredentialDetails, IOAuthStatusListImplementationResult, IStatusList } from './IStatusList'
import { StatusList } from '@sd-jwt/jwt-status-list'
import type { IJwtService } from '@sphereon/ssi-sdk-ext.jwt-service'
import type { IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { createSignedJwt, decodeStatusListJWT } from './encoding/jwt'
import { createSignedCbor, decodeStatusListCWT } from './encoding/cbor'
import { IBitstringStatusListEntryEntity, IStatusListEntryEntity, OAuthStatusListEntity, StatusListEntity } from '@sphereon/ssi-sdk.data-store'
import { IVcdmCredentialPlugin } from '@sphereon/ssi-sdk.credential-vcdm'

type IRequiredContext = IAgentContext<IVcdmCredentialPlugin & IJwtService & IIdentifierResolution & IKeyManager>

export const DEFAULT_BITS_PER_STATUS = 1 // 1 bit is sufficient for 0x00 - "VALID" 0x01 - "INVALID" saving space in the process
export const DEFAULT_LIST_LENGTH = 250000
export const DEFAULT_PROOF_FORMAT = 'jwt' as CredentialProofFormat

export class OAuthStatusListImplementation implements IStatusList {
  async createNewStatusList(args: CreateStatusListArgs, context: IRequiredContext): Promise<StatusListResult> {
    if (!args.oauthStatusList) {
      throw new Error('OAuthStatusList options are required for type OAuthStatusList')
    }

    const proofFormat = args?.proofFormat ?? DEFAULT_PROOF_FORMAT
    const { issuer, id, oauthStatusList, keyRef } = args
    const { bitsPerStatus } = oauthStatusList
    const expiresAt = ensureDate(oauthStatusList.expiresAt)
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
      statuslistContentType: this.buildContentType(proofFormat),
    }
  }

  async updateStatusListIndex(args: UpdateStatusListIndexArgs, context: IRequiredContext): Promise<StatusListResult> {
    const { statusListCredential, value, keyRef } = args
    const expiresAt = ensureDate(args.expiresAt)
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

    if (typeof value !== 'number') {
      throw new Error('Status list values should be of type number')
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
      statuslistContentType: this.buildContentType(proofFormat),
    }
  }

  // FIXME: This still assumes only two values (boolean), whilst this list supports 8 bits max
  async updateStatusListFromEncodedList(args: UpdateStatusListFromEncodedListArgs, context: IRequiredContext): Promise<StatusListResult> {
    if (!args.oauthStatusList) {
      throw new Error('OAuthStatusList options are required for type OAuthStatusList')
    }
    const { proofFormat, oauthStatusList, keyRef } = args
    const { bitsPerStatus } = oauthStatusList
    const expiresAt = ensureDate(oauthStatusList.expiresAt)

    const { issuer, id } = getAssertedValues(args)
    const issuerString = typeof issuer === 'string' ? issuer : issuer.id

    const listToUpdate = StatusList.decompressStatusList(args.encodedList, bitsPerStatus ?? DEFAULT_BITS_PER_STATUS)
    const index = typeof args.statusListIndex === 'number' ? args.statusListIndex : parseInt(args.statusListIndex)
    listToUpdate.setStatus(index, args.value)

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
      statuslistContentType: this.buildContentType(proofFormat),
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
      throw new Error(`Status list index out of bounds, has ${statusList.statusList.length} items, requested ${index}`)
    }

    return statusList.getStatus(index)
  }

  async extractCredentialDetails(credential: CompactJWT | CWT): Promise<IExtractedCredentialDetails> {
    if (typeof credential !== 'string') {
      return Promise.reject('statusListCredential must be a JWT or CWT string')
    }

    const proofFormat = determineProofFormat(credential)
    const decoded = proofFormat === 'jwt' ? decodeStatusListJWT(credential) : decodeStatusListCWT(credential)

    return {
      id: decoded.id,
      issuer: decoded.issuer,
      encodedList: decoded.statusList.compressStatusList(),
      decodedPayload: decoded,
    }
  }

  // For CREATE and READ contexts
  async toStatusListDetails(args: IToDetailsFromCredentialArgs): Promise<StatusListResult & IOAuthStatusListImplementationResult>
  // For UPDATE contexts
  async toStatusListDetails(args: IMergeDetailsWithEntityArgs): Promise<StatusListResult & IOAuthStatusListImplementationResult>
  async toStatusListDetails(
    args: IToDetailsFromCredentialArgs | IMergeDetailsWithEntityArgs,
  ): Promise<StatusListResult & IOAuthStatusListImplementationResult> {
    if ('statusListCredential' in args) {
      // CREATE/READ context
      const { statusListCredential, bitsPerStatus, correlationId, driverType } = args
      if (!bitsPerStatus || bitsPerStatus < 1) {
        return Promise.reject(Error('bitsPerStatus must be set for OAuth status lists and must be 1 or higher'))
      }

      const proofFormat = determineProofFormat(statusListCredential as string)
      const decoded =
        proofFormat === 'jwt' ? decodeStatusListJWT(statusListCredential as string) : decodeStatusListCWT(statusListCredential as string)
      const { statusList, issuer, id, exp } = decoded
      const expiresAt = exp ? new Date(exp * 1000) : undefined

      return {
        id,
        encodedList: statusList.compressStatusList(),
        issuer,
        type: StatusListType.OAuthStatusList,
        proofFormat,
        length: statusList.statusList.length,
        statusListCredential: statusListCredential as CompactJWT | CWT,
        statuslistContentType: this.buildContentType(proofFormat),
        correlationId,
        driverType,
        bitsPerStatus,
        ...(expiresAt && { expiresAt }),
        oauthStatusList: {
          bitsPerStatus,
          ...(expiresAt && { expiresAt }),
        },
      }
    } else {
      // UPDATE context
      const { extractedDetails, statusListEntity } = args
      const oauthEntity = statusListEntity as OAuthStatusListEntity
      const decoded = extractedDetails.decodedPayload as { statusList: StatusList; exp?: number }

      const proofFormat = determineProofFormat(statusListEntity.statusListCredential as string)
      const expiresAt = decoded.exp ? new Date(decoded.exp * 1000) : undefined

      return {
        id: extractedDetails.id,
        encodedList: extractedDetails.encodedList,
        issuer: extractedDetails.issuer,
        type: StatusListType.OAuthStatusList,
        proofFormat,
        length: decoded.statusList.statusList.length,
        statusListCredential: statusListEntity.statusListCredential!,
        statuslistContentType: this.buildContentType(proofFormat),
        correlationId: statusListEntity.correlationId,
        driverType: statusListEntity.driverType,
        bitsPerStatus: oauthEntity.bitsPerStatus,
        ...(expiresAt && { expiresAt }),
        oauthStatusList: {
          bitsPerStatus: oauthEntity.bitsPerStatus,
          ...(expiresAt && { expiresAt }),
        },
      }
    }
  }

  async createCredentialStatus(args: {
    statusList: StatusListEntity
    statusListEntry: IStatusListEntryEntity | IBitstringStatusListEntryEntity
    statusListIndex: number
  }): Promise<StatusListOAuthEntryCredentialStatus> {
    const { statusList, statusListIndex } = args

    // Cast to OAuthStatusListEntity to access specific properties
    const oauthStatusList = statusList as OAuthStatusListEntity

    return {
      id: `${statusList.id}#${statusListIndex}`,
      type: 'OAuthStatusListEntry',
      bitsPerStatus: oauthStatusList.bitsPerStatus,
      statusListIndex: '' + statusListIndex,
      statusListCredential: statusList.id,
      expiresAt: oauthStatusList.expiresAt,
    }
  }

  private buildContentType(proofFormat: CredentialProofFormat | undefined) {
    return `application/statuslist+${proofFormat === 'cbor' ? 'cwt' : 'jwt'}`
  }

  private async createSignedStatusList(
    proofFormat: CredentialProofFormat,
    context: IAgentContext<IVcdmCredentialPlugin & IJwtService & IIdentifierResolution & IKeyManager>,
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
