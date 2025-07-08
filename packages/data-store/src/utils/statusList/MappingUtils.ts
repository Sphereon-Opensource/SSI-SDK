import { IBitstringStatusListEntity, IOAuthStatusListEntity, IStatusList2021Entity, IStatusListEntity } from '../../types'
import {
  BitstringStatusListEntity,
  OAuthStatusListEntity,
  StatusList2021Entity,
  StatusListEntity,
} from '../../entities/statusList/StatusListEntities'
import { StatusListType } from '@sphereon/ssi-types'
import { replaceNullWithUndefined } from '../FormattingUtils'

export const statusListEntityFrom = (args: IStatusListEntity): StatusListEntity => {
  if (args.type === StatusListType.StatusList2021) {
    const entity = new StatusList2021Entity()
    const sl2021 = args as IStatusList2021Entity
    entity.indexingDirection = sl2021.indexingDirection
    entity.statusPurpose = sl2021.statusPurpose
    setBaseFields(entity, args)
    Object.defineProperty(entity, 'type', {
      value: StatusListType.StatusList2021,
      enumerable: true,
      configurable: true,
    })
    return entity
  }

  if (args.type === StatusListType.OAuthStatusList) {
    const entity = new OAuthStatusListEntity()
    const oauthSl = args as IOAuthStatusListEntity
    entity.bitsPerStatus = oauthSl.bitsPerStatus
    entity.expiresAt = oauthSl.expiresAt
    setBaseFields(entity, args)
    Object.defineProperty(entity, 'type', {
      value: StatusListType.OAuthStatusList,
      enumerable: true,
      configurable: true,
    })
    return entity
  }

  if (args.type === StatusListType.BitstringStatusList) {
    const entity = new BitstringStatusListEntity()
    const bitstringsl = args as IBitstringStatusListEntity
    entity.statusPurpose = bitstringsl.statusPurpose
    entity.statusSize = bitstringsl.statusSize
    entity.validFrom = bitstringsl.validFrom
    entity.validUntil = bitstringsl.validUntil
    entity.ttl = bitstringsl.ttl
    setBaseFields(entity, args)
    Object.defineProperty(entity, 'type', {
      value: StatusListType.BitstringStatusList,
      enumerable: true,
      configurable: true,
    })
    return entity
  }

  throw new Error(`Invalid status list type ${args.type}`)
}

export const statusListFrom = (entity: StatusListEntity): IStatusListEntity => {
  if (entity instanceof StatusList2021Entity) {
    const result: IStatusList2021Entity = {
      ...getBaseFields(entity),
      type: StatusListType.StatusList2021,
      indexingDirection: entity.indexingDirection,
      statusPurpose: entity.statusPurpose,
    }
    return replaceNullWithUndefined(result)
  }

  if (entity instanceof OAuthStatusListEntity) {
    const result: IOAuthStatusListEntity = {
      ...getBaseFields(entity),
      type: StatusListType.OAuthStatusList,
      bitsPerStatus: entity.bitsPerStatus,
      expiresAt: entity.expiresAt,
    }
    return replaceNullWithUndefined(result)
  }

  if (entity instanceof BitstringStatusListEntity) {
    const result: IBitstringStatusListEntity = {
      ...getBaseFields(entity),
      type: StatusListType.BitstringStatusList,
      statusPurpose: entity.statusPurpose,
      statusSize: entity.statusSize,
      validFrom: entity.validFrom,
      validUntil: entity.validUntil,
      ttl: entity.ttl,
    }
    return replaceNullWithUndefined(result)
  }
  throw new Error(`Invalid status list type ${typeof entity}`)
}

const setBaseFields = (entity: StatusListEntity, args: IStatusListEntity) => {
  entity.id = args.id
  entity.correlationId = args.correlationId
  entity.length = args.length
  entity.issuer = args.issuer
  entity.driverType = args.driverType
  entity.credentialIdMode = args.credentialIdMode
  entity.proofFormat = args.proofFormat
  entity.statusListCredential = args.statusListCredential
}

const getBaseFields = (entity: StatusListEntity): Omit<IStatusListEntity, 'type'> => ({
  id: entity.id,
  correlationId: entity.correlationId,
  length: entity.length,
  issuer: entity.issuer,
  driverType: entity.driverType,
  credentialIdMode: entity.credentialIdMode,
  proofFormat: entity.proofFormat,
  statusListCredential: entity.statusListCredential,
})
