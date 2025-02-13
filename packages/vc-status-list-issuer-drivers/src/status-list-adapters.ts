import { StatusListType } from '@sphereon/ssi-types'
import { OAuthStatusListEntity, StatusList2021Entity } from '@sphereon/ssi-sdk.data-store/dist/entities/statusList/StatusListEntities'
import { StatusListResult } from '@sphereon/ssi-sdk.vc-status-list'

export function statusListResultToEntity(result: StatusListResult): StatusList2021Entity | OAuthStatusListEntity {
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
  }
  throw new Error(`Unsupported status list type: ${result.type}`)
}
