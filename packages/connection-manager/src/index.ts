/**
 * @public
 */
import { BaseConfigEntity } from './entities/BaseConfigEntity'
import { ConnectionEntity } from './entities/ConnectionEntity'
import { ConnectionIdentifierEntity } from './entities/ConnectionIdentifierEntity'
import { DidAuthConfigEntity } from './entities/DidAuthConfigEntity'
import { MetadataItemEntity } from './entities/MetadataItemEntity'
import { OpenIdConfigEntity } from './entities/OpenIdConfigEntity'
import { PartyEntity } from './entities/PartyEntity'

const schema = require('../plugin.schema.json')
export { schema }
export { ConnectionManager } from './agent/ConnectionManager'
export { ConnectionStore } from './store/ConnectionStore'
export const Entities = [
  BaseConfigEntity,
  ConnectionEntity,
  OpenIdConfigEntity,
  DidAuthConfigEntity,
  PartyEntity,
  MetadataItemEntity,
  ConnectionIdentifierEntity
]
export * from './types/IConnectionManager'


