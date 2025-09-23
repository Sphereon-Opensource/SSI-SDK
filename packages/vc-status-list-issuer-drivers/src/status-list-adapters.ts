import { StatusListType } from '@sphereon/ssi-types'
import { BitstringStatusListEntity, OAuthStatusListEntity, StatusList2021Entity } from '@sphereon/ssi-sdk.data-store'
import { StatusListResult } from '@sphereon/ssi-sdk.vc-status-list'

export function statusListResultToEntity(result: StatusListResult): StatusList2021Entity | OAuthStatusListEntity | BitstringStatusListEntity {
  const baseFields = {
    id: result.id,
    correlationId: result.correlationId,
    driverType: result.driverType,
    length: result.length,
    issuer: result.issuer,
    type: result.type,
    proofFormat: result.proofFormat,
    statusListCredential: result.statusListCredential,
  }

  if (result.type === StatusListType.StatusList2021) {
    if (!result.statusList2021) {
      throw new Error('Missing statusList2021 details')
    }
    const entity = new StatusList2021Entity()
    Object.assign(entity, baseFields, {
      indexingDirection: result.statusList2021.indexingDirection,
      statusPurpose: result.statusList2021.statusPurpose,
      credentialIdMode: result.statusList2021.credentialIdMode,
    })
    return entity
  } else if (result.type === StatusListType.OAuthStatusList) {
    if (!result.oauthStatusList) {
      throw new Error('Missing oauthStatusList details')
    }
    const entity = new OAuthStatusListEntity()
    Object.assign(entity, baseFields, {
      bitsPerStatus: result.oauthStatusList.bitsPerStatus,
      expiresAt: result.oauthStatusList.expiresAt,
    })
    return entity
  } else if (result.type === StatusListType.BitstringStatusList) {
    if (!result.bitstringStatusList) {
      throw new Error('Missing bitstringStatusList details')
    }
    const entity = new BitstringStatusListEntity()
    Object.assign(entity, baseFields, {
      statusPurpose: result.bitstringStatusList.statusPurpose,
      ttl: result.bitstringStatusList.ttl,
      bitsPerStatus: result.bitstringStatusList.bitsPerStatus,
      validFrom: result.bitstringStatusList.validFrom,
      validUntil: result.bitstringStatusList.validUntil,
    })
    return entity
  }
  throw new Error(`Unsupported status list type: ${result.type}`)
}
