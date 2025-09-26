import type { IPresentationDefinition } from '@sphereon/pex'
import type { DcqlQueryItem, NonPersistedDcqlQueryItem, PartialDcqlQueryItem } from '@sphereon/ssi-sdk.data-store-types'
import * as blakepkg from 'blakejs'
import { DcqlQuery } from 'dcql'
import { DcqlQueryItemEntity } from '../../entities/presentationDefinition/DcqlQueryItemEntity'
import { replaceNullWithUndefined } from '../FormattingUtils'

export const dcqlQueryItemFrom = (entity: DcqlQueryItemEntity): DcqlQueryItem => {
  const result: DcqlQueryItem = {
    id: entity.id,
    tenantId: entity.tenantId,
    queryId: entity.queryId,
    version: entity.version,
    name: entity.name,
    purpose: entity.purpose,
    query: DcqlQuery.parse(JSON.parse(entity.query)),
    createdAt: entity.createdAt,
    lastUpdatedAt: entity.lastUpdatedAt,
  }

  if (result.query) {
    DcqlQuery.validate(result.query)
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
  if (item.query) {
    const dcqlQuery = DcqlQuery.parse(item.query)
    DcqlQuery.validate(dcqlQuery)
    entity.query = JSON.stringify(item.query)
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

  if (base.query && compare.query) {
    if (hashPayload(base.query) !== hashPayload(compare.query)) {
      return false
    }
  } else if (base.query || compare.query) {
    return false
  }

  return true
}
