import { StatusListType } from '@sphereon/ssi-types'
import { BitstringStatusListEntity, OAuthStatusListEntity, StatusList2021Entity } from '@sphereon/ssi-sdk.data-store'
import { StatusListResult } from '@sphereon/ssi-sdk.vc-status-list'

export function statusListResultToEntity(result: StatusListResult): StatusList2021Entity | OAuthStatusListEntity | BitstringStatusListEntity {
  const baseFields = {
    id: result.id,
    correlationId: result.correlationId,
    driverType: result.driverType,
    credentialIdMode: result.credentialIdMode,
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
    return Object.assign(new StatusList2021Entity(), {
      ...baseFields,
      indexingDirection: result.statusList2021.indexingDirection,
      statusPurpose: result.statusList2021.statusPurpose,
    })
  } else if (result.type === StatusListType.OAuthStatusList) {
    if (!result.oauthStatusList) {
      throw new Error('Missing oauthStatusList details')
    }
    return Object.assign(new OAuthStatusListEntity(), {
      ...baseFields,
      bitsPerStatus: result.oauthStatusList.bitsPerStatus,
      expiresAt: result.oauthStatusList.expiresAt,
    })
  } else if (result.type === StatusListType.BitstringStatusList) {
    if (!result.bitstringStatusList) {
      throw new Error('Missing bitstringStatusList details')
    }
    return Object.assign(new BitstringStatusListEntity(), {
      ...baseFields,
      statusPurpose: result.bitstringStatusList.statusPurpose,
      ttl: result.bitstringStatusList.ttl,
      validFrom: result.bitstringStatusList.validFrom,
      validUntil: result.bitstringStatusList.validUntil,
    })
  }
  throw new Error(`Unsupported status list type: ${result.type}`)
}
