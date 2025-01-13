import { IAgentContext, ICredentialPlugin, ProofFormat } from '@veramo/core'
import { CompactJWT, IIssuer } from '@sphereon/ssi-types'
import { StatusListDetails, StatusListResult, StatusListType, UpdateStatusListFromEncodedListArgs } from '../types'
import { decodeStatusListJWT, getAssertedValue, getAssertedValues } from '../utils'
import { IStatusList } from './IStatusList'
import { createHeaderAndPayload, StatusList, StatusListJWTHeaderParameters, StatusListJWTPayload } from '@sd-jwt/jwt-status-list'
import { JWTPayload } from 'did-jwt'
import { IJwtService } from '@sphereon/ssi-sdk-ext.jwt-service'
import { IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { BitsPerStatus } from '@sd-jwt/jwt-status-list/dist'

type IRequiredContext = IAgentContext<ICredentialPlugin & IJwtService & IIdentifierResolution>

export const BITS_PER_STATUS_DEFAULT = 1
export const DEFAULT_LIST_LENGTH = 65536
export const DEFAULT_PROOF_FORMAT = 'jwt' as const
export const STATUS_LIST_JWT_HEADER: StatusListJWTHeaderParameters = {
  alg: 'EdDSA',
  typ: 'statuslist+jwt',
}

export class OAuthStatusListImplementation implements IStatusList {
  async createNewStatusList(
    args: {
      issuer: string | IIssuer
      id: string
      proofFormat?: ProofFormat
      keyRef?: string
      correlationId?: string
      expiresAt?: string
      length?: number
      bitsPerStatus?: BitsPerStatus
    },
    context: IRequiredContext,
  ): Promise<StatusListResult> {
    const proofFormat = args?.proofFormat ?? DEFAULT_PROOF_FORMAT
    if (proofFormat !== DEFAULT_PROOF_FORMAT) {
      throw new Error(`Invalid proof format '${proofFormat}' for OAuthStatusList`)
    }

    const { issuer, id } = args
    const length = args.length ?? DEFAULT_LIST_LENGTH
    const bitsPerStatus = args.bitsPerStatus ?? BITS_PER_STATUS_DEFAULT
    const issuerString = typeof issuer === 'string' ? issuer : issuer.id
    const correlationId = getAssertedValue('correlationId', args.correlationId)

    const initialStatuses = new Array(length).fill(0)
    const statusList = new StatusList(initialStatuses, bitsPerStatus)
    const encodedList = statusList.compressStatusList()
    const { jwt } = await this.createSignedPayload(context, statusList, issuerString, id, args.keyRef)

    return {
      encodedList,
      statusListCredential: jwt,
      length,
      type: StatusListType.OAuthStatusList,
      proofFormat,
      id,
      correlationId,
      issuer,
      statusPurpose: 'active',
      indexingDirection: 'rightToLeft',
    }
  }

  async updateStatusListIndex(
    args: {
      statusListCredential: CompactJWT
      keyRef?: string
      statusListIndex: number | string
      value: boolean
    },
    context: IRequiredContext,
  ): Promise<StatusListDetails> {
    const { statusListCredential, value } = args
    const sourcePayload = decodeStatusListJWT(statusListCredential)
    if (!('iss' in sourcePayload)) {
      throw new Error('issuer (iss) is missing in the status list JWT')
    }
    if (!('sub' in sourcePayload)) {
      throw new Error('List id (sub) is missing in the status list JWT')
    }
    const { iss: issuer, sub: id } = sourcePayload as StatusListJWTPayload & { iss: string; sub: string }

    const statusListContainer = sourcePayload.status_list
    const statusList = StatusList.decompressStatusList(statusListContainer.lst, statusListContainer.bits)

    const index = typeof args.statusListIndex === 'number' ? args.statusListIndex : parseInt(args.statusListIndex)
    if (index < 0 || index >= statusList.statusList.length) {
      throw new Error('Status list index out of bounds')
    }

    statusList.setStatus(index, value ? 1 : 0)
    const { jwt, encodedList } = await this.createSignedPayload(context, statusList, issuer, id, args.keyRef)

    return {
      encodedList,
      statusListCredential: jwt,
      length: statusList.statusList.length,
      type: StatusListType.OAuthStatusList,
      proofFormat: DEFAULT_PROOF_FORMAT,
      id,
      issuer,
      statusPurpose: 'active',
      indexingDirection: 'rightToLeft',
    }
  }

  async updateStatusListFromEncodedList(args: UpdateStatusListFromEncodedListArgs, context: IRequiredContext): Promise<StatusListDetails> {
    if (!args.oauthStatusList) {
      throw new Error('OAuthStatusList options are required for type OAuthStatusList')
    }

    const { statusPurpose } = args.oauthStatusList
    const { issuer, id } = getAssertedValues(args)
    const bitsPerStatus = args.oauthStatusList.bitsPerStatus ?? BITS_PER_STATUS_DEFAULT
    const issuerString = typeof issuer === 'string' ? issuer : issuer.id

    const listToUpdate = StatusList.decompressStatusList(args.encodedList, bitsPerStatus)
    const index = typeof args.statusListIndex === 'number' ? args.statusListIndex : parseInt(args.statusListIndex)
    listToUpdate.setStatus(index, args.value ? 1 : 0)

    const { jwt, encodedList } = await this.createSignedPayload(context, listToUpdate, issuerString, id, args.keyRef)

    return {
      encodedList,
      statusListCredential: jwt,
      length: listToUpdate.statusList.length,
      type: StatusListType.OAuthStatusList,
      proofFormat: args.proofFormat ?? DEFAULT_PROOF_FORMAT,
      id,
      issuer,
      statusPurpose,
      indexingDirection: 'rightToLeft',
    }
  }

  async checkStatusIndex(args: { statusListCredential: CompactJWT; statusListIndex: string | number }): Promise<boolean> {
    const { statusListCredential, statusListIndex } = args
    const statusList = StatusList.decompressStatusList(statusListCredential, BITS_PER_STATUS_DEFAULT)
    const index = typeof statusListIndex === 'number' ? statusListIndex : parseInt(statusListIndex)

    if (index < 0 || index >= statusList.statusList.length) {
      throw new Error('Status list index out of bounds')
    }

    return statusList.getStatus(index) === 1
  }

  private async createSignedPayload(context: IRequiredContext, statusList: StatusList, issuerString: string, id: string, keyRef?: string) {
    const identifier = await this.resolveIdentifier(context, issuerString, keyRef)
    const payload: JWTPayload = {
      iss: issuerString,
      sub: id,
      iat: Math.floor(new Date().getTime() / 1000),
    }
    const values = createHeaderAndPayload(statusList, payload, STATUS_LIST_JWT_HEADER)
    const signedJwt = await context.agent.jwtCreateJwsCompactSignature({
      issuer: { ...identifier, noIssPayloadUpdate: false },
      protectedHeader: values.header,
      payload: values.payload,
    })

    return {
      jwt: signedJwt.jwt,
      encodedList: (values.payload as StatusListJWTPayload).status_list.lst,
    }
  }

  private async resolveIdentifier(context: IRequiredContext, issuer: string, keyRef?: string) {
    return keyRef
      ? await context.agent.identifierManagedGetByKid({
          identifier: keyRef,
        })
      : await context.agent.identifierManagedGet({
          identifier: issuer,
          vmRelationship: 'assertionMethod',
          offlineWhenNoDIDRegistered: true,
        })
  }
}
