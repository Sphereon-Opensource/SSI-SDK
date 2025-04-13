import { BaseConfigEntity } from './entities/contact/BaseConfigEntity.js'
import { BaseLocaleBrandingEntity } from './entities/issuanceBranding/BaseLocaleBrandingEntity.js'
import { BaseContactEntity } from './entities/contact/BaseContactEntity.js'
import { ConnectionEntity } from './entities/contact/ConnectionEntity.js'
import { PartyEntity } from './entities/contact/PartyEntity.js'
import { CorrelationIdentifierEntity } from './entities/contact/CorrelationIdentifierEntity.js'
import { DidAuthConfigEntity } from './entities/contact/DidAuthConfigEntity.js'
import { IdentityEntity } from './entities/contact/IdentityEntity.js'
import { IdentityMetadataItemEntity } from './entities/contact/IdentityMetadataItemEntity.js'
import { OpenIdConfigEntity } from './entities/contact/OpenIdConfigEntity.js'
import { BackgroundAttributesEntity } from './entities/issuanceBranding/BackgroundAttributesEntity.js'
import { CredentialBrandingEntity } from './entities/issuanceBranding/CredentialBrandingEntity.js'
import { CredentialLocaleBrandingEntity } from './entities/issuanceBranding/CredentialLocaleBrandingEntity.js'
import { ImageAttributesEntity } from './entities/issuanceBranding/ImageAttributesEntity.js'
import { ImageDimensionsEntity } from './entities/issuanceBranding/ImageDimensionsEntity.js'
import { IssuerLocaleBrandingEntity } from './entities/issuanceBranding/IssuerLocaleBrandingEntity.js'
import { IssuerBrandingEntity } from './entities/issuanceBranding/IssuerBrandingEntity.js'
import { TextAttributesEntity } from './entities/issuanceBranding/TextAttributesEntity.js'
import { OAuthStatusListEntity, StatusList2021Entity, StatusListEntity } from './entities/statusList/StatusListEntities.js'
import { StatusListEntryEntity } from './entities/statusList/StatusList2021EntryEntity.js'
import { MachineStateInfoEntity } from './entities/machineState/MachineStateInfoEntity.js'
// import { IStatusListEntity, IStatusListEntryEntity } from './types.'
import { PartyRelationshipEntity } from './entities/contact/PartyRelationshipEntity.js'
import { PartyTypeEntity } from './entities/contact/PartyTypeEntity.js'
import { OrganizationEntity } from './entities/contact/OrganizationEntity.js'
import { NaturalPersonEntity } from './entities/contact/NaturalPersonEntity.js'
import { ElectronicAddressEntity } from './entities/contact/ElectronicAddressEntity.js'
import { PhysicalAddressEntity } from './entities/contact/PhysicalAddressEntity.js'
import { AuditEventEntity } from './entities/eventLogger/AuditEventEntity.js'
import { DigitalCredentialEntity } from './entities/digitalCredential/DigitalCredentialEntity.js'
import { PresentationDefinitionItemEntity } from './entities/presentationDefinition/PresentationDefinitionItemEntity.js'
import { ContactMetadataItemEntity } from './entities/contact/ContactMetadataItemEntity.js'
import { CredentialClaimsEntity } from './entities/issuanceBranding/CredentialClaimsEntity.js'

import { Oid4vcStateEntity } from './entities/oid4vcState/Oid4vcStateEntity.js'
import { ElectronicAddressType, PhysicalAddressType } from './types/index.js'

export { ContactStore } from './contact/ContactStore.js'
export { AbstractContactStore } from './contact/AbstractContactStore.js'
export { AbstractDigitalCredentialStore } from './digitalCredential/AbstractDigitalCredentialStore.js'
export { DigitalCredentialStore } from './digitalCredential/DigitalCredentialStore.js'
export { AbstractIssuanceBrandingStore } from './issuanceBranding/AbstractIssuanceBrandingStore.js'
export { IssuanceBrandingStore } from './issuanceBranding/IssuanceBrandingStore.js'
export { StatusListStore } from './statusList/StatusListStore.js'
export { AbstractEventLoggerStore } from './eventLogger/AbstractEventLoggerStore.js'
export { EventLoggerStore } from './eventLogger/EventLoggerStore.js'
export { IAbstractMachineStateStore } from './machineState/IAbstractMachineStateStore.js'
export { MachineStateStore } from './machineState/MachineStateStore.js'
export { AbstractPDStore } from './presentationDefinition/AbstractPDStore.js'
export { PDStore } from './presentationDefinition/PDStore.js'
export {
  DataStoreMigrations,
  DataStoreEventLoggerMigrations,
  DataStoreContactMigrations,
  DataStoreDigitalCredentialMigrations,
  DataStoreIssuanceBrandingMigrations,
  DataStoreStatusListMigrations,
  DataStoreMachineStateMigrations,
  DataStorePresentationDefinitionMigrations,
} from './migrations/index.js'
export * from './types/index.js'
export * from './utils/contact/MappingUtils.js'
export * from './utils/digitalCredential/MappingUtils.js'
export * from './utils/eventLogger/MappingUtils.js'
export * from './utils/issuanceBranding/MappingUtils.js'
export * from './utils/presentationDefinition/MappingUtils.js'

export const DataStoreContactEntities = [
  BaseConfigEntity,
  ConnectionEntity,
  PartyEntity,
  IdentityEntity,
  IdentityMetadataItemEntity,
  CorrelationIdentifierEntity,
  DidAuthConfigEntity,
  OpenIdConfigEntity,
  PartyRelationshipEntity,
  PartyTypeEntity,
  BaseContactEntity,
  OrganizationEntity,
  NaturalPersonEntity,
  ElectronicAddressEntity,
  PhysicalAddressEntity,
  ContactMetadataItemEntity,
]

export const DataStoreOid4vcStateEntities = [Oid4vcStateEntity]
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
  CredentialClaimsEntity,
]

export const DataStorePresentationDefinitionEntities = [PresentationDefinitionItemEntity]

export const DataStoreStatusListEntities = [StatusListEntity, StatusList2021Entity, OAuthStatusListEntity, StatusListEntryEntity]

export const DataStoreEventLoggerEntities = [AuditEventEntity]

export const DataStoreDigitalCredentialEntities = [DigitalCredentialEntity]

export const DataStoreMachineStateEntities = [MachineStateInfoEntity]

// All entities combined if a party wants to enable them all at once
export const DataStoreEntities = [
  ...DataStoreContactEntities,
  ...DataStoreIssuanceBrandingEntities,
  ...DataStoreStatusListEntities,
  ...DataStoreEventLoggerEntities,
  ...DataStoreDigitalCredentialEntities,
  ...DataStoreMachineStateEntities,
  ...DataStorePresentationDefinitionEntities,
  // ...DataStoreOid4vcStateEntities,
]

export {
  BaseConfigEntity,
  ConnectionEntity,
  PartyEntity,
  BaseContactEntity,
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
  ElectronicAddressEntity,
  PhysicalAddressEntity,
  // IStatusListEntity,
  // IStatusListEntryEntity,
  StatusListEntity,
  StatusListEntryEntity,
  AuditEventEntity,
  DigitalCredentialEntity,
  MachineStateInfoEntity,
  PresentationDefinitionItemEntity,
  ContactMetadataItemEntity,
  CredentialClaimsEntity,
  Oid4vcStateEntity,
}
export type { PhysicalAddressType, ElectronicAddressType }
