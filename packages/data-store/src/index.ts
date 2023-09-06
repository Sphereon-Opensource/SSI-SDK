import { BaseConfigEntity } from './entities/contact/BaseConfigEntity'
import { BaseLocaleBrandingEntity } from './entities/issuanceBranding/BaseLocaleBrandingEntity'
import { ConnectionEntity, connectionEntityFrom } from './entities/contact/ConnectionEntity'
import { ContactEntity, contactEntityFrom } from './entities/contact/ContactEntity'
import { CorrelationIdentifierEntity, correlationIdentifierEntityFrom } from './entities/contact/CorrelationIdentifierEntity'
import { DidAuthConfigEntity, didAuthConfigEntityFrom } from './entities/contact/DidAuthConfigEntity'
import { IdentityEntity, identityEntityFrom } from './entities/contact/IdentityEntity'
import { IdentityMetadataItemEntity, metadataItemEntityFrom } from './entities/contact/IdentityMetadataItemEntity'
import { OpenIdConfigEntity, openIdConfigEntityFrom } from './entities/contact/OpenIdConfigEntity'
import { BackgroundAttributesEntity, backgroundAttributesEntityFrom } from './entities/issuanceBranding/BackgroundAttributesEntity'
import { CredentialBrandingEntity, credentialBrandingEntityFrom } from './entities/issuanceBranding/CredentialBrandingEntity'
import { CredentialLocaleBrandingEntity, credentialLocaleBrandingEntityFrom } from './entities/issuanceBranding/CredentialLocaleBrandingEntity'
import { ImageAttributesEntity, imageAttributesEntityFrom } from './entities/issuanceBranding/ImageAttributesEntity'
import { ImageDimensionsEntity, imageDimensionsEntityFrom } from './entities/issuanceBranding/ImageDimensionsEntity'
import { IssuerLocaleBrandingEntity, issuerLocaleBrandingEntityFrom } from './entities/issuanceBranding/IssuerLocaleBrandingEntity'
import { IssuerBrandingEntity, issuerBrandingEntityFrom } from './entities/issuanceBranding/IssuerBrandingEntity'
import { TextAttributesEntity, textAttributesEntityFrom } from './entities/issuanceBranding/TextAttributesEntity'
import { StatusListEntity } from './entities/statusList2021/StatusList2021Entity'
import { StatusListEntryEntity } from './entities/statusList2021/StatusList2021EntryEntity'
import { IStatusListEntity, IStatusListEntryEntity } from './types'

export { ContactStore } from './contact/ContactStore'
export { AbstractContactStore } from './contact/AbstractContactStore'
export { AbstractIssuanceBrandingStore } from './issuanceBranding/AbstractIssuanceBrandingStore'
export { IssuanceBrandingStore } from './issuanceBranding/IssuanceBrandingStore'
export { StatusListStore } from './statusList/StatusListStore'
export { DataStoreMigrations } from './migrations'
export * from './types'

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

export const DataStoreIssuanceBrandingEntities = [
  BackgroundAttributesEntity,
  CredentialBrandingEntity,
  ImageAttributesEntity,
  ImageDimensionsEntity,
  BaseLocaleBrandingEntity,
  IssuerBrandingEntity,
  TextAttributesEntity,
  CredentialLocaleBrandingEntity,
  IssuerLocaleBrandingEntity,
]

export const DataStoreStatusListEntities = [StatusListEntity, StatusListEntryEntity]

// All entities combined if a party wants to enable them all at once
export const DataStoreEntities = [...DataStoreContactEntities, ...DataStoreIssuanceBrandingEntities, ...DataStoreStatusListEntities]

export {
  BaseConfigEntity,
  ConnectionEntity,
  ContactEntity,
  CorrelationIdentifierEntity,
  DidAuthConfigEntity,
  IdentityEntity,
  IdentityMetadataItemEntity,
  OpenIdConfigEntity,
  BackgroundAttributesEntity,
  CredentialBrandingEntity,
  ImageAttributesEntity,
  ImageDimensionsEntity,
  BaseLocaleBrandingEntity,
  IssuerBrandingEntity,
  TextAttributesEntity,
  CredentialLocaleBrandingEntity,
  IssuerLocaleBrandingEntity,
  metadataItemEntityFrom,
  connectionEntityFrom,
  contactEntityFrom,
  correlationIdentifierEntityFrom,
  identityEntityFrom,
  didAuthConfigEntityFrom,
  openIdConfigEntityFrom,
  backgroundAttributesEntityFrom,
  credentialBrandingEntityFrom,
  imageAttributesEntityFrom,
  imageDimensionsEntityFrom,
  issuerBrandingEntityFrom,
  textAttributesEntityFrom,
  issuerLocaleBrandingEntityFrom,
  credentialLocaleBrandingEntityFrom,
  IStatusListEntity,
  IStatusListEntryEntity,
  StatusListEntity,
  StatusListEntryEntity,
}
