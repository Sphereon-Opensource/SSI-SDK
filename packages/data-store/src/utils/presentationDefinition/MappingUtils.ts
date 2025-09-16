import type { IPresentationDefinition } from '@sphereon/pex'
import * as blakepkg from 'blakejs'
import { DcqlQuery } from 'dcql'
import { PresentationDefinitionItemEntity } from '../../entities/presentationDefinition/PresentationDefinitionItemEntity'
import type { NonPersistedPresentationDefinitionItem, PartialPresentationDefinitionItem, PresentationDefinitionItem } from '../../types'
import { replaceNullWithUndefined } from '../FormattingUtils'

export const presentationDefinitionItemFrom = (entity: PresentationDefinitionItemEntity): PresentationDefinitionItem => {
  const result: PresentationDefinitionItem = {
    id: entity.id,
    tenantId: entity.tenantId,
    definitionId: entity.definitionId,
    version: entity.version,
    name: entity.name,
    purpose: entity.purpose,
    definitionPayload: JSON.parse(entity.definitionPayload) as IPresentationDefinition,
    ...(entity.dcqlPayload && {
      dcqlQuery: DcqlQuery.parse(JSON.parse(entity.dcqlPayload)),
    }),
    createdAt: entity.createdAt,
    lastUpdatedAt: entity.lastUpdatedAt,
  }

  if (result.dcqlQuery) {
    DcqlQuery.validate(result.dcqlQuery)
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
  if (item.definitionPayload) {
    entity.definitionPayload = JSON.stringify(item.definitionPayload)
  }
  if (item.dcqlQuery) {
    const dcqlQuery = DcqlQuery.parse(item.dcqlQuery)
    DcqlQuery.validate(dcqlQuery)
    entity.dcqlPayload = JSON.stringify(item.dcqlQuery)
  }
  return entity
}

function hashPayload(payload: IPresentationDefinition | DcqlQuery): string {
  return blakepkg.blake2bHex(JSON.stringify(payload))
}

export function isPresentationDefinitionEqual(base: PartialPresentationDefinitionItem, compare: PartialPresentationDefinitionItem): boolean {
  if (
    base.definitionId !== compare.definitionId ||
    base.tenantId !== compare.tenantId ||
    base.version !== compare.version ||
    base.name !== compare.name ||
    base.purpose !== compare.purpose
  ) {
    return false
  }

  if (base.dcqlQuery && compare.dcqlQuery) {
    if (hashPayload(base.dcqlQuery) !== hashPayload(compare.dcqlQuery)) {
      return false
    }
  } else if (base.dcqlQuery || compare.dcqlQuery) {
    return false
  }

  if (base.definitionPayload && compare.definitionPayload) {
    if (hashPayload(base.definitionPayload) !== hashPayload(compare.definitionPayload)) {
      return false
    }
  } else if (base.definitionPayload || compare.definitionPayload) {
    return false
  }

  return true
}
