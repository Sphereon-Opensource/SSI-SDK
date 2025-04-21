import { BaseConfigEntity } from './entities/contact/BaseConfigEntity'
import { BaseLocaleBrandingEntity } from './entities/issuanceBranding/BaseLocaleBrandingEntity'
import { BaseContactEntity } from './entities/contact/BaseContactEntity'
import { ConnectionEntity } from './entities/contact/ConnectionEntity'
import { PartyEntity } from './entities/contact/PartyEntity'
import { CorrelationIdentifierEntity } from './entities/contact/CorrelationIdentifierEntity'
import { DidAuthConfigEntity } from './entities/contact/DidAuthConfigEntity'
import { IdentityEntity } from './entities/contact/IdentityEntity'
import { IdentityMetadataItemEntity } from './entities/contact/IdentityMetadataItemEntity'
import { OpenIdConfigEntity } from './entities/contact/OpenIdConfigEntity'
import { BackgroundAttributesEntity } from './entities/issuanceBranding/BackgroundAttributesEntity'
import { CredentialBrandingEntity } from './entities/issuanceBranding/CredentialBrandingEntity'
import { CredentialLocaleBrandingEntity } from './entities/issuanceBranding/CredentialLocaleBrandingEntity'
import { ImageAttributesEntity } from './entities/issuanceBranding/ImageAttributesEntity'
import { ImageDimensionsEntity } from './entities/issuanceBranding/ImageDimensionsEntity'
import { IssuerLocaleBrandingEntity } from './entities/issuanceBranding/IssuerLocaleBrandingEntity'
import { IssuerBrandingEntity } from './entities/issuanceBranding/IssuerBrandingEntity'
import { TextAttributesEntity } from './entities/issuanceBranding/TextAttributesEntity'
import { OAuthStatusListEntity, StatusList2021Entity, StatusListEntity } from './entities/statusList/StatusListEntities'
import { StatusListEntryEntity } from './entities/statusList/StatusList2021EntryEntity'
import { MachineStateInfoEntity } from './entities/machineState/MachineStateInfoEntity'
// import { IStatusListEntity, IStatusListEntryEntity } from './types.'
import { PartyRelationshipEntity } from './entities/contact/PartyRelationshipEntity'
import { PartyTypeEntity } from './entities/contact/PartyTypeEntity'
import { OrganizationEntity } from './entities/contact/OrganizationEntity'
import { NaturalPersonEntity } from './entities/contact/NaturalPersonEntity'
import { ElectronicAddressEntity } from './entities/contact/ElectronicAddressEntity'
import { PhysicalAddressEntity } from './entities/contact/PhysicalAddressEntity'
import { AuditEventEntity } from './entities/eventLogger/AuditEventEntity'
import { DigitalCredentialEntity } from './entities/digitalCredential/DigitalCredentialEntity'
import { PresentationDefinitionItemEntity } from './entities/presentationDefinition/PresentationDefinitionItemEntity'
import { ContactMetadataItemEntity } from './entities/contact/ContactMetadataItemEntity'
import { CredentialClaimsEntity } from './entities/issuanceBranding/CredentialClaimsEntity'

import { Oid4vcStateEntity } from './entities/oid4vcState/Oid4vcStateEntity'
// import {PartyCorrelationType} from "@sphereon/ssi-sdk.core";

export { ContactStore } from './contact/ContactStore'
export { AbstractContactStore } from './contact/AbstractContactStore'
export { AbstractDigitalCredentialStore } from './digitalCredential/AbstractDigitalCredentialStore'
export { DigitalCredentialStore } from './digitalCredential/DigitalCredentialStore'
export { AbstractIssuanceBrandingStore } from './issuanceBranding/AbstractIssuanceBrandingStore'
export { IssuanceBrandingStore } from './issuanceBranding/IssuanceBrandingStore'
export { StatusListStore } from './statusList/StatusListStore'
export { AbstractEventLoggerStore } from './eventLogger/AbstractEventLoggerStore'
export { EventLoggerStore } from './eventLogger/EventLoggerStore'
export { IAbstractMachineStateStore } from './machineState/IAbstractMachineStateStore'
export { MachineStateStore } from './machineState/MachineStateStore'
export { AbstractPDStore } from './presentationDefinition/AbstractPDStore'
export { PDStore } from './presentationDefinition/PDStore'
export {
  DataStoreMigrations,
  DataStoreEventLoggerMigrations,
  DataStoreContactMigrations,
  DataStoreDigitalCredentialMigrations,
  DataStoreIssuanceBrandingMigrations,
  DataStoreStatusListMigrations,
  DataStoreMachineStateMigrations,
  DataStorePresentationDefinitionMigrations,
} from './migrations'
export * from './types'
export * from './utils/contact/MappingUtils'
export * from './utils/digitalCredential/MappingUtils'
export * from './utils/eventLogger/MappingUtils'
export * from './utils/issuanceBranding/MappingUtils'
export * from './utils/presentationDefinition/MappingUtils'

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
  CredentialClaimsEntity
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
  StatusListEntity,
  StatusListEntryEntity,
  OAuthStatusListEntity,
  StatusList2021Entity,
  AuditEventEntity,
  DigitalCredentialEntity,
  MachineStateInfoEntity,
  PresentationDefinitionItemEntity,
  ContactMetadataItemEntity,
  CredentialClaimsEntity,
  Oid4vcStateEntity,
}
