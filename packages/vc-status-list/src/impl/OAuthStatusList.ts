import { IAgentContext, ICredentialPlugin } from '@veramo/core'
import { CredentialMapper, StatusListType } from '@sphereon/ssi-types'
import {
  CheckStatusIndexArgs,
  CreateStatusListArgs,
  StatusListResult,
  StatusOAuth,
  UpdateStatusListFromEncodedListArgs,
  UpdateStatusListIndexArgs,
} from '../types'
import { decodeStatusListJWT, getAssertedValue, getAssertedValues } from '../utils'
import { IStatusList } from './IStatusList'
import { createHeaderAndPayload, StatusList, StatusListJWTHeaderParameters, StatusListJWTPayload } from '@sd-jwt/jwt-status-list'
import { JWTPayload } from 'did-jwt'
import { IJwtService } from '@sphereon/ssi-sdk-ext.jwt-service'
import { IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'

type IRequiredContext = IAgentContext<ICredentialPlugin & IJwtService & IIdentifierResolution>

export const BITS_PER_STATUS_DEFAULT = 2 // 2 bits are sufficient for 0x00 - "VALID"  0x01 - "INVALID" & 0x02 - "SUSPENDED"
export const DEFAULT_LIST_LENGTH = 250000
export const DEFAULT_PROOF_FORMAT = 'jwt' as const
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
    if (proofFormat !== DEFAULT_PROOF_FORMAT) {
      throw new Error(`Invalid proof format '${proofFormat}' for OAuthStatusList`)
    }

    const { issuer, id } = args
    const length = args.length ?? DEFAULT_LIST_LENGTH
    const bitsPerStatus = args.oauthStatusList.bitsPerStatus ?? BITS_PER_STATUS_DEFAULT
    const issuerString = typeof issuer === 'string' ? issuer : issuer.id
    const correlationId = getAssertedValue('correlationId', args.correlationId)

    const initialStatuses = new Array(length).fill(0)
    const statusList = new StatusList(initialStatuses, bitsPerStatus)
    const encodedList = statusList.compressStatusList()
    const { jwt } = await this.createSignedPayload(context, statusList, issuerString, id, args.keyRef)

    return {
      encodedList,
      statusListCredential: jwt,
      oauthStatusList: {
        bitsPerStatus,
      },
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
    if (!CredentialMapper.isJwtEncoded(statusListCredential) && !CredentialMapper.isMsoMdocOid4VPEncoded(statusListCredential)) {
      return Promise.reject(new Error('statusListCredential is neither a JWT nor an MDOC document'))
    }
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
      oauthStatusList: {
        bitsPerStatus: statusListContainer.bits,
      },
      length: statusList.statusList.length,
      type: StatusListType.OAuthStatusList,
      proofFormat: DEFAULT_PROOF_FORMAT,
      id,
      issuer,
    }
  }

  async updateStatusListFromEncodedList(args: UpdateStatusListFromEncodedListArgs, context: IRequiredContext): Promise<StatusListResult> {
    if (!args.oauthStatusList) {
      throw new Error('OAuthStatusList options are required for type OAuthStatusList')
    }

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
      oauthStatusList: {
        bitsPerStatus,
      },
      length: listToUpdate.statusList.length,
      type: StatusListType.OAuthStatusList,
      proofFormat: args.proofFormat ?? DEFAULT_PROOF_FORMAT,
      id,
      issuer,
    }
  }

  async checkStatusIndex(args: CheckStatusIndexArgs): Promise<number | StatusOAuth> {
    const { statusListCredential, statusListIndex } = args
    if (!CredentialMapper.isJwtEncoded(statusListCredential) && !CredentialMapper.isMsoMdocOid4VPEncoded(statusListCredential)) {
      return Promise.reject(new Error('statusListCredential is neither a JWT nor an MDOC document'))
    }
    const sourcePayload = decodeStatusListJWT(statusListCredential)
    const statusListContainer = sourcePayload.status_list
    const statusList = StatusList.decompressStatusList(statusListContainer.lst, statusListContainer.bits)

    const index = typeof statusListIndex === 'number' ? statusListIndex : parseInt(statusListIndex)

    if (index < 0 || index >= statusList.statusList.length) {
      throw new Error('Status list index out of bounds')
    }

    return statusList.getStatus(index)
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
