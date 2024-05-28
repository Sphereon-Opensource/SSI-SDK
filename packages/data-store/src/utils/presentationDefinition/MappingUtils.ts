import { PresentationDefinitionItemEntity } from '../../entities/presentationDefinition/PresentationDefinitionItemEntity'
import { IPresentationDefinition } from '@sphereon/pex'
import { PartialPresentationDefinitionItem, PresentationDefinitionItem } from '../../types'
import { createHash } from 'crypto'

export const presentationDefinitionItemFrom = (entity: PresentationDefinitionItemEntity) => {
  return {
    id: entity.id,
    tenantId: entity.tenantId,
    definitionId: entity.definitionId,
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
  entity.definitionId = item.definitionId!
  entity.version = item.version!
  entity.purpose = item.purpose
  entity.definitionPayload = JSON.stringify(item.definitionPayload!)
  entity.createdAt = item.createdAt!
  entity.lastUpdatedAt = item.lastUpdatedAt!
  return entity
}

function hashPayload(payload: IPresentationDefinition): string {
  return createHash('md5').update(JSON.stringify(payload)).digest('hex')
}

export function isPresentationDefinitionEqual(left: PartialPresentationDefinitionItem, right: PartialPresentationDefinitionItem): boolean {
  if (
    left.definitionId !== right.definitionId ||
    left.tenantId != right.tenantId ||
    left.version !== right.version ||
    left.purpose != right.purpose
  ) {
    return false
  }

  if (left.definitionPayload && right.definitionPayload) {
    return hashPayload(left.definitionPayload) === hashPayload(right.definitionPayload)
  }

  return left.definitionPayload == right.definitionPayload
}
