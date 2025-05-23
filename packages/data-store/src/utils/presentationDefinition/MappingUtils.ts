import { PresentationDefinitionItemEntity } from '../../entities/presentationDefinition/PresentationDefinitionItemEntity'
import type { IPresentationDefinition } from '@sphereon/pex'
import type { NonPersistedPresentationDefinitionItem, PartialPresentationDefinitionItem, PresentationDefinitionItem } from '../../types'
import * as blakepkg from 'blakejs'
import { replaceNullWithUndefined } from '../FormattingUtils'
import type { DcqlQueryREST } from '@sphereon/ssi-types'

export const presentationDefinitionItemFrom = (entity: PresentationDefinitionItemEntity): PresentationDefinitionItem => {
  const result: PresentationDefinitionItem = {
    id: entity.id,
    tenantId: entity.tenantId,
    definitionId: entity.definitionId,
    version: entity.version,
    name: entity.name,
    purpose: entity.purpose,
    definitionPayload: JSON.parse(entity.definitionPayload) as IPresentationDefinition,
    dcqlPayload: JSON.parse(entity.dcqlPayload) as DcqlQueryREST,
    createdAt: entity.createdAt,
    lastUpdatedAt: entity.lastUpdatedAt,
  }

  return replaceNullWithUndefined(result)
}

export const presentationDefinitionEntityItemFrom = (item: NonPersistedPresentationDefinitionItem): PresentationDefinitionItemEntity => {
  const entity = new PresentationDefinitionItemEntity()

  entity.tenantId = item.tenantId
  entity.definitionId = item.definitionId!
  entity.version = item.version
  entity.name = item.name
  entity.purpose = item.purpose
  entity.definitionPayload = JSON.stringify(item.definitionPayload!)
  entity.dcqlPayload = JSON.stringify(item.dcqlPayload!)
  return entity
}

function hashPayload(payload: IPresentationDefinition): string {
  return blakepkg.blake2bHex(JSON.stringify(payload))
}

export function isPresentationDefinitionEqual(base: PartialPresentationDefinitionItem, compare: PartialPresentationDefinitionItem): boolean {
  if (
    base.definitionId !== compare.definitionId ||
    base.tenantId != compare.tenantId ||
    base.version !== compare.version ||
    base.name != compare.name ||
    base.purpose != compare.purpose
  ) {
    return false
  }

  if (base.definitionPayload && compare.definitionPayload) {
    return hashPayload(base.definitionPayload) === hashPayload(compare.definitionPayload)
  }

  return false
}
