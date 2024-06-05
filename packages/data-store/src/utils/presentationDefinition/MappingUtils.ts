import { PresentationDefinitionItemEntity } from '../../entities/presentationDefinition/PresentationDefinitionItemEntity'
import { IPresentationDefinition } from '@sphereon/pex'
import { PartialPresentationDefinitionItem, PresentationDefinitionItem } from '../../types'
import md5 from 'md5'

export const presentationDefinitionItemFrom = (entity: PresentationDefinitionItemEntity) => {
  const item: PresentationDefinitionItem = {
    id: entity.id,
    tenantId: entity.tenantId,
    definitionId: entity.definitionId,
    version: entity.version,
    name: entity.name,
    purpose: entity.purpose,
    definitionPayload: JSON.parse(entity.definitionPayload) as IPresentationDefinition,
    createdAt: entity.createdAt,
    lastUpdatedAt: entity.lastUpdatedAt,
  }
  return item
}

export const presentationDefinitionEntityItemFrom = (item: PartialPresentationDefinitionItem) => {
  const entity = new PresentationDefinitionItemEntity()
  if (item.id) {
    entity.id = item.id
  }

  entity.tenantId = item.tenantId
  entity.definitionId = item.definitionId!
  entity.version = item.version!
  entity.name = item.name
  entity.purpose = item.purpose
  entity.definitionPayload = JSON.stringify(item.definitionPayload!)
  entity.createdAt = item.createdAt!
  entity.lastUpdatedAt = item.lastUpdatedAt!
  return entity
}

function hashPayload(payload: IPresentationDefinition): string {
  return md5(JSON.stringify(payload))
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

  // return false when either or both are null or undefined
  return base.definitionPayload == compare.definitionPayload
}
