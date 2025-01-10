import { IAgentContext, ICredentialPlugin, ProofFormat } from '@veramo/core'
import { CompactJWT, IIssuer } from '@sphereon/ssi-types'
import { StatusListDetails, StatusListResult, StatusListType, UpdateStatusListFromEncodedListArgs } from '../types'
import { decodeStatusListJWT, getAssertedValue, getAssertedValues } from '../utils'
import { IStatusList } from './IStatusList'
import { createHeaderAndPayload, StatusList, StatusListJWTHeaderParameters, StatusListJWTPayload } from '@sd-jwt/jwt-status-list'
import { JWTPayload } from 'did-jwt'
import { IJwtService } from '@sphereon/ssi-sdk-ext.jwt-service'
import { IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'

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
    },
    context: IAgentContext<ICredentialPlugin & IJwtService & IIdentifierResolution>,
  ): Promise<StatusListResult> {
    const proofFormat = args?.proofFormat ?? 'jwt'
    if (proofFormat !== 'jwt') {
      throw new Error(`Invalid proof format '${proofFormat}' for OAuthStatusList`)
    }

    const { issuer, id } = args

    const issuerString = typeof args.issuer === 'string' ? args.issuer : args.issuer.id
    const identifier = await this.resolveIdentifier(context, issuerString, args.keyRef)

    const correlationId = getAssertedValue('correlationId', args.correlationId)
    const length = args.length ?? 100 // Default length if not specified

    // Initialize a status list with the specified length, all set to 0 (not revoked)
    const initialStatuses = new Array(length).fill(0)
    const statusList = new StatusList(initialStatuses, 1) // TODO bits per status config
    const encodedList = statusList.compressStatusList()
    const payload: JWTPayload = {
      iss: issuerString,
      sub: id,
      iat: Math.floor(new Date().getTime() / 1000),
    }
    const header: StatusListJWTHeaderParameters = {
      alg: 'EdDSA',
      typ: 'statuslist+jwt',
    }
    const values = createHeaderAndPayload(statusList, payload, header)
    const signedPayload = await context.agent.jwtCreateJwsCompactSignature({
      issuer: { ...identifier, noIssPayloadUpdate: false },
      protectedHeader: values.header,
      payload: values.payload,
    })

    return {
      encodedList,
      statusListCredential: signedPayload.jwt,
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

  private async resolveIdentifier(context: IAgentContext<ICredentialPlugin & IJwtService & IIdentifierResolution>, issuer: string, keyRef?: string) {
    const identifier = keyRef
      ? await context.agent.identifierManagedGetByKid({
          identifier: keyRef,
        })
      : await context.agent.identifierManagedGet({
          identifier: issuer,
          vmRelationship: 'assertionMethod',
          offlineWhenNoDIDRegistered: true,
        })
    return identifier
  }

  async updateStatusListIndex(
    args: {
      statusListCredential: CompactJWT
      keyRef?: string
      statusListIndex: number | string
      value: boolean
    },
    context: IAgentContext<ICredentialPlugin & IJwtService & IIdentifierResolution>,
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
    const updatedEncodedList = await statusList.compressStatusList()
    const identifier = await this.resolveIdentifier(context, issuer, args.keyRef)

    const payload: JWTPayload = {
      iss: issuer,
      sub: id,
      iat: Math.floor(new Date().getTime() / 1000),
    }
    const header: StatusListJWTHeaderParameters = {
      alg: 'EdDSA',
      typ: 'statuslist+jwt',
    }
    const values = createHeaderAndPayload(statusList, payload, header)
    const signedPayload = await context.agent.jwtCreateJwsCompactSignature({
      issuer: { ...identifier, noIssPayloadUpdate: false },
      protectedHeader: values.header,
      payload: values.payload,
    })

    // Return details without credential-specific fields
    return {
      encodedList: updatedEncodedList,
      statusListCredential: signedPayload.jwt,
      length: statusList.statusList.length,
      type: StatusListType.OAuthStatusList,
      proofFormat: 'jwt',
      id,
      issuer,
      statusPurpose: 'active',
      indexingDirection: 'rightToLeft',
    }
  }

  async updateStatusListFromEncodedList(
    args: UpdateStatusListFromEncodedListArgs,
    context: IAgentContext<ICredentialPlugin>,
  ): Promise<StatusListDetails> {
    if (!args.oauthStatusList) {
      throw new Error('OAuthStatusList options are required for type OAuthStatusList')
    }

    const { statusPurpose } = args.oauthStatusList
    const { issuer, id } = getAssertedValues(args)

    const decodedList = StatusList.decompressStatusList(args.encodedList, 1)
    const updatedEncodedList = await decodedList.compressStatusList()

    return {
      encodedList: updatedEncodedList,
      statusListCredential: {
        encodedList: updatedEncodedList,
        issuer,
        id,
        statusPurpose,
      },
      length: decodedList.statusList.length,
      type: StatusListType.OAuthStatusList,
      proofFormat: args.proofFormat ?? 'jwt',
      id,
      issuer,
      statusPurpose,
      indexingDirection: 'rightToLeft',
    }
  }

  async checkStatusIndex(args: { statusListCredential: CompactJWT; statusListIndex: string | number }): Promise<boolean> {
    const { statusListCredential, statusListIndex } = args

    const statusList = StatusList.decompressStatusList(statusListCredential, 1)
    const index = typeof statusListIndex === 'number' ? statusListIndex : parseInt(statusListIndex)

    if (index < 0 || index >= statusList.statusList.length) {
      throw new Error('Status list index out of bounds')
    }

    return statusList.getStatus(index) === 1
  }
}
