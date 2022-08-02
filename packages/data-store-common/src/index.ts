import { BaseConfigEntity } from './entities/connection/BaseConfigEntity'
import { ConnectionEntity, connectionEntityFrom } from './entities/connection/ConnectionEntity'
import { ConnectionIdentifierEntity } from './entities/connection/ConnectionIdentifierEntity'
import { DidAuthConfigEntity } from './entities/connection/DidAuthConfigEntity'
import { MetadataItemEntity } from './entities/connection/MetadataItemEntity'
import { OpenIdConfigEntity } from './entities/connection/OpenIdConfigEntity'
import { PartyEntity, partyEntityFrom } from './entities/connection/PartyEntity'

export const DataStoreConnectionEntities = [
  BaseConfigEntity,
  ConnectionEntity,
  ConnectionIdentifierEntity,
  DidAuthConfigEntity,
  MetadataItemEntity,
  OpenIdConfigEntity,
  PartyEntity,
]

export {
  BaseConfigEntity,
  ConnectionEntity,
  ConnectionIdentifierEntity,
  DidAuthConfigEntity,
  MetadataItemEntity,
  OpenIdConfigEntity,
  PartyEntity,
  partyEntityFrom,
  connectionEntityFrom,
}

export * from './types/connections'

export { DataStoreMigrations } from './migrations'
