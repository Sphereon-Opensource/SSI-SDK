import { BaseConfigEntity } from './entities/contact/BaseConfigEntity'
import { ConnectionEntity, connectionEntityFrom } from './entities/contact/ConnectionEntity'
import { ContactEntity, contactEntityFrom } from './entities/contact/ContactEntity'
import { CorrelationIdentifierEntity, correlationIdentifierEntityFrom } from './entities/contact/CorrelationIdentifierEntity'
import { DidAuthConfigEntity, didAuthConfigEntityFrom } from './entities/contact/DidAuthConfigEntity'
import { IdentityEntity, identityEntityFrom } from './entities/contact/IdentityEntity'
import { IdentityMetadataItemEntity, metadataItemEntityFrom } from './entities/contact/IdentityMetadataItemEntity'
import { OpenIdConfigEntity, openIdConfigEntityFrom } from './entities/contact/OpenIdConfigEntity'

export { ContactStore } from './contact/ContactStore'
export { AbstractContactStore } from './contact/AbstractContactStore'

export const DataStoreContactEntities = [
  BaseConfigEntity,
  ConnectionEntity,
  ContactEntity,
  IdentityEntity,
  IdentityMetadataItemEntity,
  CorrelationIdentifierEntity,
  DidAuthConfigEntity,
  OpenIdConfigEntity,
]

export {
  BaseConfigEntity,
  ConnectionEntity,
  ContactEntity,
  CorrelationIdentifierEntity,
  DidAuthConfigEntity,
  IdentityEntity,
  IdentityMetadataItemEntity,
  OpenIdConfigEntity,
  metadataItemEntityFrom,
  connectionEntityFrom,
  contactEntityFrom,
  correlationIdentifierEntityFrom,
  identityEntityFrom,
  didAuthConfigEntityFrom,
  openIdConfigEntityFrom,
}

export * from './types/contact'
export * from './types/IAbstractContactStore'

export { DataStoreMigrations } from './migrations'
