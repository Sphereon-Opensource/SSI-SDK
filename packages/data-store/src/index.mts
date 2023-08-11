import { BaseConfigEntity } from './entities/contact/BaseConfigEntity.mjs'
import { BaseLocaleBrandingEntity } from './entities/issuanceBranding/BaseLocaleBrandingEntity.mjs'
import { ConnectionEntity, connectionEntityFrom } from './entities/contact/ConnectionEntity.mjs'
import { ContactEntity, contactEntityFrom } from './entities/contact/ContactEntity.mjs'
import { CorrelationIdentifierEntity, correlationIdentifierEntityFrom } from './entities/contact/CorrelationIdentifierEntity.mjs'
import { DidAuthConfigEntity, didAuthConfigEntityFrom } from './entities/contact/DidAuthConfigEntity.mjs'
import { IdentityEntity, identityEntityFrom } from './entities/contact/IdentityEntity.mjs'
import { IdentityMetadataItemEntity, metadataItemEntityFrom } from './entities/contact/IdentityMetadataItemEntity.mjs'
import { OpenIdConfigEntity, openIdConfigEntityFrom } from './entities/contact/OpenIdConfigEntity.mjs'
import { BackgroundAttributesEntity, backgroundAttributesEntityFrom } from './entities/issuanceBranding/BackgroundAttributesEntity.mjs'
import { CredentialBrandingEntity, credentialBrandingEntityFrom } from './entities/issuanceBranding/CredentialBrandingEntity.mjs'
import { CredentialLocaleBrandingEntity, credentialLocaleBrandingEntityFrom } from './entities/issuanceBranding/CredentialLocaleBrandingEntity.mjs'
import { ImageAttributesEntity, imageAttributesEntityFrom } from './entities/issuanceBranding/ImageAttributesEntity.mjs'
import { ImageDimensionsEntity, imageDimensionsEntityFrom } from './entities/issuanceBranding/ImageDimensionsEntity.mjs'
import { IssuerLocaleBrandingEntity, issuerLocaleBrandingEntityFrom } from './entities/issuanceBranding/IssuerLocaleBrandingEntity.mjs'
import { IssuerBrandingEntity, issuerBrandingEntityFrom } from './entities/issuanceBranding/IssuerBrandingEntity.mjs'
import { TextAttributesEntity, textAttributesEntityFrom } from './entities/issuanceBranding/TextAttributesEntity.mjs'

export { ContactStore } from './contact/ContactStore.mjs'
export { AbstractContactStore } from './contact/AbstractContactStore.mjs'
export { AbstractIssuanceBrandingStore } from './issuanceBranding/AbstractIssuanceBrandingStore.mjs'
export { IssuanceBrandingStore } from './issuanceBranding/IssuanceBrandingStore.mjs'
export { DataStoreMigrations } from './migrations/index.mjs'
export * from './types/index.mjs'

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
}
