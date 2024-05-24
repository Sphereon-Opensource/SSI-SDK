import { PresentationDefinitionItemEntity } from '../../entities/presentationDefinitions/PresentationDefinitionItemEntity'
import { IPresentationDefinition } from '@sphereon/pex'
import { PartialPresentationDefinitionItem, PresentationDefinitionItem } from '../../types'

export const presentationDefinitionItemFrom = (entity: PresentationDefinitionItemEntity) => {
  return {
    id: entity.id,
    tenantId: entity.tenantId,
    pdId: entity.pdId,
    version: entity.version,
    purpose: entity.purpose,
    definitionPayload: JSON.parse(entity.definitionPayload) as IPresentationDefinition,
    createdAt: entity.createdAt,
    lastUpdatedAt: entity.lastUpdatedAt,
  } as PresentationDefinitionItem
}

export const presentationDefinitionEntityItemFrom = (item: PartialPresentationDefinitionItem) => {
  const entity = new PresentationDefinitionItemEntity()
  if (item.id) {
    entity.id = item.id
  }

  entity.tenantId = item.tenantId!
  entity.pdId = item.pdId!
  entity.version = item.version!
  entity.purpose = item.purpose
  entity.definitionPayload = JSON.stringify(item.definitionPayload!)
  entity.createdAt = item.createdAt!
  entity.lastUpdatedAt = item.lastUpdatedAt!
  return entity
}
