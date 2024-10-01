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
import { MachineStateInfoEntity } from './entities/machineState/MachineStateInfoEntity'
import { IStatusListEntity, IStatusListEntryEntity } from './types'
import { PartyRelationshipEntity } from './entities/contact/PartyRelationshipEntity'
import { PartyTypeEntity } from './entities/contact/PartyTypeEntity'
import { OrganizationEntity } from './entities/contact/OrganizationEntity'
import { NaturalPersonEntity } from './entities/contact/NaturalPersonEntity'
import { ElectronicAddressEntity } from './entities/contact/ElectronicAddressEntity'
import { PhysicalAddressEntity } from './entities/contact/PhysicalAddressEntity'
export { ContactStore } from './contact/ContactStore'
export { AbstractContactStore } from './contact/AbstractContactStore'
export { AbstractDigitalCredentialStore } from './digitalCredential/AbstractDigitalCredentialStore'
export { DigitalCredentialStore } from './digitalCredential/DigitalCredentialStore'
export { AbstractIssuanceBrandingStore } from './issuanceBranding/AbstractIssuanceBrandingStore'
export { IssuanceBrandingStore } from './issuanceBranding/IssuanceBrandingStore'
export { StatusListStore } from './statusList/StatusListStore'
import { AuditEventEntity, auditEventEntityFrom } from './entities/eventLogger/AuditEventEntity'
import { DigitalCredentialEntity } from './entities/digitalCredential/DigitalCredentialEntity'
import { digitalCredentialFrom, digitalCredentialsFrom, nonPersistedDigitalCredentialEntityFromAddArgs } from './utils/digitalCredential/MappingUtils'
import { isPresentationDefinitionEqual } from './utils/presentationDefinition/MappingUtils'
import { PresentationDefinitionItemEntity } from './entities/presentationDefinition/PresentationDefinitionItemEntity'
import { ContactMetadataItemEntity } from './entities/contact/ContactMetadataItemEntity'
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

export const DataStorePresentationDefinitionEntities = [PresentationDefinitionItemEntity]

export const DataStoreStatusListEntities = [StatusListEntity, StatusListEntryEntity]

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
  AuditEventEntity,
  auditEventEntityFrom,
  DigitalCredentialEntity,
  digitalCredentialFrom,
  digitalCredentialsFrom,
  nonPersistedDigitalCredentialEntityFromAddArgs,
  MachineStateInfoEntity,
  PresentationDefinitionItemEntity,
  isPresentationDefinitionEqual,
  ContactMetadataItemEntity,
}

export * from './utils/hasher'
