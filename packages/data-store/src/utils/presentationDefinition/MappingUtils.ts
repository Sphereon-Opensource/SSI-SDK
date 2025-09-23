import type { IPresentationDefinition } from '@sphereon/pex'
import * as blakepkg from 'blakejs'
import { DcqlQuery } from 'dcql'
import { DcqlQueryItemEntity } from '../../entities/presentationDefinition/DcqlQueryItemEntity'
import type { NonPersistedDcqlQueryItem, PartialDcqlQueryItem, DcqlQueryItem } from '../../types'
import { replaceNullWithUndefined } from '../FormattingUtils'

export const dcqlQueryItemFrom = (entity: DcqlQueryItemEntity): DcqlQueryItem => {
  const result: DcqlQueryItem = {
    id: entity.id,
    tenantId: entity.tenantId,
    queryId: entity.queryId,
    version: entity.version,
    name: entity.name,
    purpose: entity.purpose,
    dcqlQuery: DcqlQuery.parse(JSON.parse(entity.dcqlPayload)),
    createdAt: entity.createdAt,
    lastUpdatedAt: entity.lastUpdatedAt,
  }

  if (result.dcqlQuery) {
    DcqlQuery.validate(result.dcqlQuery)
  }
  return replaceNullWithUndefined(result)
}

export const dcqlQueryEntityItemFrom = (item: NonPersistedDcqlQueryItem): DcqlQueryItemEntity => {
  const entity = new DcqlQueryItemEntity()

  entity.tenantId = item.tenantId
  entity.queryId = item.queryId!
  entity.version = item.version
  entity.name = item.name
  entity.purpose = item.purpose
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

export function isPresentationDefinitionEqual(base: PartialDcqlQueryItem, compare: PartialDcqlQueryItem): boolean {
  if (
    base.queryId !== compare.queryId ||
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

  return true
}
