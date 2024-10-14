import {
  MetadataTypes,
  Connection,
  ConnectionConfig,
  Contact,
  CorrelationIdentifier,
  DidAuthConfig,
  ElectronicAddress,
  Identity,
  MetadataItem,
  NaturalPerson,
  NonPersistedConnection,
  NonPersistedConnectionConfig,
  NonPersistedContact,
  NonPersistedCorrelationIdentifier,
  NonPersistedDidAuthConfig,
  NonPersistedElectronicAddress,
  NonPersistedIdentity,
  NonPersistedMetadataItem,
  NonPersistedNaturalPerson,
  NonPersistedOpenIdConfig,
  NonPersistedOrganization,
  NonPersistedParty,
  NonPersistedPartyRelationship,
  NonPersistedPartyType,
  NonPersistedPhysicalAddress,
  OpenIdConfig,
  Organization,
  Party,
  PartyRelationship,
  PartyType,
  PhysicalAddress,
} from '../../types'
import { PartyEntity } from '../../entities/contact/PartyEntity'
import { IdentityEntity } from '../../entities/contact/IdentityEntity'
import { ElectronicAddressEntity } from '../../entities/contact/ElectronicAddressEntity'
import { PartyRelationshipEntity } from '../../entities/contact/PartyRelationshipEntity'
import { BaseContactEntity } from '../../entities/contact/BaseContactEntity'
import { NaturalPersonEntity } from '../../entities/contact/NaturalPersonEntity'
import { OrganizationEntity } from '../../entities/contact/OrganizationEntity'
import { ConnectionEntity } from '../../entities/contact/ConnectionEntity'
import { BaseConfigEntity } from '../../entities/contact/BaseConfigEntity'
import { CorrelationIdentifierEntity } from '../../entities/contact/CorrelationIdentifierEntity'
import { DidAuthConfigEntity } from '../../entities/contact/DidAuthConfigEntity'
import { IdentityMetadataItemEntity } from '../../entities/contact/IdentityMetadataItemEntity'
import { OpenIdConfigEntity } from '../../entities/contact/OpenIdConfigEntity'
import { PartyTypeEntity } from '../../entities/contact/PartyTypeEntity'
import { PhysicalAddressEntity } from '../../entities/contact/PhysicalAddressEntity'
import { ContactMetadataItemEntity } from '../../entities/contact/ContactMetadataItemEntity'
import { replaceNullWithUndefined } from '../FormattingUtils'

export const partyEntityFrom = (party: NonPersistedParty): PartyEntity => {
  const partyEntity: PartyEntity = new PartyEntity()
  partyEntity.uri = party.uri
  partyEntity.identities = party.identities ? party.identities.map((identity: NonPersistedIdentity) => identityEntityFrom(identity)) : []
  partyEntity.electronicAddresses = party.electronicAddresses
    ? party.electronicAddresses.map((electronicAddress: NonPersistedElectronicAddress) => electronicAddressEntityFrom(electronicAddress))
    : []
  partyEntity.physicalAddresses = party.physicalAddresses
    ? party.physicalAddresses.map((physicalAddress: NonPersistedPhysicalAddress) => physicalAddressEntityFrom(physicalAddress))
    : []
  partyEntity.partyType = partyTypeEntityFrom(party.partyType)
  partyEntity.contact = contactEntityFrom(party.contact)
  partyEntity.ownerId = party.ownerId
  partyEntity.tenantId = party.tenantId

  return partyEntity
}

export const partyFrom = (party: PartyEntity): Party => {
  const result: Party = {
    id: party.id,
    uri: party.uri,
    roles: [...new Set(party.identities?.flatMap((identity: IdentityEntity) => identity.roles))] ?? [],
    identities: party.identities ? party.identities.map((identity: IdentityEntity) => identityFrom(identity)) : [],
    electronicAddresses: party.electronicAddresses
      ? party.electronicAddresses.map((electronicAddress: ElectronicAddressEntity) => electronicAddressFrom(electronicAddress))
      : [],
    physicalAddresses: party.physicalAddresses
      ? party.physicalAddresses.map((physicalAddress: PhysicalAddressEntity) => physicalAddressFrom(physicalAddress))
      : [],
    relationships: party.relationships ? party.relationships.map((relationship: PartyRelationshipEntity) => partyRelationshipFrom(relationship)) : [],
    partyType: partyTypeFrom(party.partyType),
    contact: contactFrom(party.contact),
    ownerId: party.ownerId,
    tenantId: party.tenantId,
    createdAt: party.createdAt,
    lastUpdatedAt: party.lastUpdatedAt,
  }

  return replaceNullWithUndefined(result)
}

export const contactEntityFrom = (contact: NonPersistedContact): BaseContactEntity => {
  if (isNaturalPerson(contact)) {
    return naturalPersonEntityFrom(<NonPersistedNaturalPerson>contact)
  } else if (isOrganization(contact)) {
    return organizationEntityFrom(<NonPersistedOrganization>contact)
  }

  throw new Error('Contact not supported')
}

export const contactFrom = (contact: BaseContactEntity): Contact => {
  if (isNaturalPerson(contact)) {
    return naturalPersonFrom(<NaturalPersonEntity>contact)
  } else if (isOrganization(contact)) {
    return organizationFrom(<OrganizationEntity>contact)
  }

  throw new Error(`Contact type not supported`)
}

export const isNaturalPerson = (contact: NonPersistedContact | BaseContactEntity): contact is NonPersistedNaturalPerson | NaturalPersonEntity =>
  'firstName' in contact && 'lastName' in contact

export const isOrganization = (contact: NonPersistedContact | BaseContactEntity): contact is NonPersistedOrganization | OrganizationEntity =>
  'legalName' in contact

export const connectionEntityFrom = (connection: NonPersistedConnection): ConnectionEntity => {
  const connectionEntity: ConnectionEntity = new ConnectionEntity()
  connectionEntity.type = connection.type
  connectionEntity.config = configEntityFrom(connection.config)
  connectionEntity.ownerId = connection.ownerId
  connectionEntity.tenantId = connection.tenantId

  return connectionEntity
}

export const connectionFrom = (connection: ConnectionEntity): Connection => {
  const result: Connection = {
    id: connection.id,
    type: connection.type,
    ownerId: connection.ownerId,
    tenantId: connection.tenantId,
    config: configFrom(connection.config),
  }

  return replaceNullWithUndefined(result)
}

const configEntityFrom = (config: NonPersistedConnectionConfig): BaseConfigEntity => {
  if (isOpenIdConfig(config)) {
    return openIdConfigEntityFrom(<NonPersistedOpenIdConfig>config)
  } else if (isDidAuthConfig(config)) {
    return didAuthConfigEntityFrom(<NonPersistedDidAuthConfig>config)
  }

  throw new Error('config type not supported')
}

export const correlationIdentifierEntityFrom = (identifier: NonPersistedCorrelationIdentifier): CorrelationIdentifierEntity => {
  const identifierEntity: CorrelationIdentifierEntity = new CorrelationIdentifierEntity()
  identifierEntity.type = identifier.type
  identifierEntity.correlationId = identifier.correlationId
  identifierEntity.ownerId = identifier.ownerId
  identifierEntity.tenantId = identifier.tenantId

  return identifierEntity
}

export const correlationIdentifierFrom = (identifier: CorrelationIdentifierEntity): CorrelationIdentifier => {
  const result: CorrelationIdentifier = {
    id: identifier.id,
    type: identifier.type,
    correlationId: identifier.correlationId,
    ownerId: identifier.ownerId,
    tenantId: identifier.tenantId,
  }

  return replaceNullWithUndefined(result)
}

export const didAuthConfigEntityFrom = (config: NonPersistedDidAuthConfig): DidAuthConfigEntity => {
  let identifier: string | undefined = undefined
  if (typeof config.idOpts.identifier === 'string') {
    identifier = config.idOpts.identifier
  } else if (typeof config.idOpts.identifier === 'object') {
    if ('did' in config.idOpts.identifier && typeof config.idOpts.identifier.did === 'string') {
      identifier = config.idOpts.identifier.did
    }
  }
  if (!identifier) {
    throw Error(`Identifier method ${config.idOpts.method} not yet supported`)
  }
  const didAuthConfig: DidAuthConfigEntity = new DidAuthConfigEntity()
  didAuthConfig.identifier = identifier
  didAuthConfig.redirectUrl = config.redirectUrl
  didAuthConfig.sessionId = config.sessionId
  didAuthConfig.ownerId = config.ownerId
  didAuthConfig.tenantId = config.tenantId
  return didAuthConfig
}

export const electronicAddressEntityFrom = (electronicAddress: NonPersistedElectronicAddress): ElectronicAddressEntity => {
  const electronicAddressEntity: ElectronicAddressEntity = new ElectronicAddressEntity()
  electronicAddressEntity.type = electronicAddress.type
  electronicAddressEntity.electronicAddress = electronicAddress.electronicAddress
  electronicAddressEntity.ownerId = electronicAddress.ownerId
  electronicAddressEntity.tenantId = electronicAddress.tenantId

  return electronicAddressEntity
}

export const electronicAddressFrom = (electronicAddress: ElectronicAddressEntity): ElectronicAddress => {
  const result: ElectronicAddress = {
    id: electronicAddress.id,
    type: electronicAddress.type,
    electronicAddress: electronicAddress.electronicAddress,
    ownerId: electronicAddress.ownerId,
    tenantId: electronicAddress.tenantId,
    createdAt: electronicAddress.createdAt,
    lastUpdatedAt: electronicAddress.lastUpdatedAt,
  }

  return replaceNullWithUndefined(result)
}

export const physicalAddressEntityFrom = (physicalAddress: NonPersistedPhysicalAddress): PhysicalAddressEntity => {
  const physicalAddressEntity: PhysicalAddressEntity = new PhysicalAddressEntity()
  physicalAddressEntity.type = physicalAddress.type
  physicalAddressEntity.streetName = physicalAddress.streetName
  physicalAddressEntity.streetNumber = physicalAddress.streetNumber
  physicalAddressEntity.postalCode = physicalAddress.postalCode
  physicalAddressEntity.cityName = physicalAddress.cityName
  physicalAddressEntity.provinceName = physicalAddress.provinceName
  physicalAddressEntity.countryCode = physicalAddress.countryCode
  physicalAddressEntity.buildingName = physicalAddress.buildingName
  physicalAddressEntity.ownerId = physicalAddress.ownerId
  physicalAddressEntity.tenantId = physicalAddress.tenantId

  return physicalAddressEntity
}

export const physicalAddressFrom = (physicalAddress: PhysicalAddressEntity): PhysicalAddress => {
  const result: PhysicalAddress = {
    id: physicalAddress.id,
    type: physicalAddress.type,
    streetName: physicalAddress.streetName,
    streetNumber: physicalAddress.streetNumber,
    postalCode: physicalAddress.postalCode,
    cityName: physicalAddress.cityName,
    provinceName: physicalAddress.provinceName,
    countryCode: physicalAddress.countryCode,
    buildingName: physicalAddress.buildingName,
    ownerId: physicalAddress.ownerId,
    tenantId: physicalAddress.tenantId,
    createdAt: physicalAddress.createdAt,
    lastUpdatedAt: physicalAddress.lastUpdatedAt,
  }

  return replaceNullWithUndefined(result)
}

export const identityEntityFrom = (entity: NonPersistedIdentity): IdentityEntity => {
  const identityEntity: IdentityEntity = new IdentityEntity()
  identityEntity.alias = entity.alias
  identityEntity.origin = entity.origin
  identityEntity.ownerId = entity.ownerId
  identityEntity.tenantId = entity.tenantId
  identityEntity.roles = entity.roles
  identityEntity.identifier = correlationIdentifierEntityFrom(entity.identifier)
  identityEntity.connection = entity.connection ? connectionEntityFrom(entity.connection) : undefined
  identityEntity.metadata = entity.metadata
    ? entity.metadata.map(identityMetadataItemEntityFrom).filter((entity): entity is IdentityMetadataItemEntity => entity !== undefined)
    : []
  return identityEntity
}

export const identityFrom = (identity: IdentityEntity): Identity => {
  const result: Identity = {
    id: identity.id,
    alias: identity.alias,
    origin: identity.origin,
    roles: identity.roles,
    tenantId: identity.tenantId,
    ownerId: identity.ownerId,
    identifier: correlationIdentifierFrom(identity.identifier),
    ...(identity.connection && { connection: connectionFrom(identity.connection) }),
    metadata: identity.metadata ? identity.metadata.map((item: IdentityMetadataItemEntity) => metadataItemFrom(item)) : [],
    createdAt: identity.createdAt,
    lastUpdatedAt: identity.createdAt,
  }

  return replaceNullWithUndefined(result)
}

const metadataItemEntityFrom = <T extends MetadataTypes, U extends { new (): any }>(item: NonPersistedMetadataItem<T>, EntityClass: U): InstanceType<U> | undefined => {
  const { label, value } = item

  if (value === null || value === undefined) {
    return undefined
  }

  const metadataItemEntity = new EntityClass()
  metadataItemEntity.label = label
  metadataItemEntity.valueType = typeof value

  switch (typeof value) {
    case 'undefined':
      return undefined
    case 'string':
      metadataItemEntity.stringValue = value
      break
    case 'number':
      metadataItemEntity.numberValue = value
      break
    case 'boolean':
      metadataItemEntity.boolValue = value
      break
    case 'object':
      metadataItemEntity.valueType = Object.prototype.toString.call(value).slice(8, -1)
      if (value instanceof Date) {
        metadataItemEntity.dateValue = value
      } else {
        // For now, we only support / implement not-primitive type Date in the entity
        throw new Error(`Unsupported object type: ${metadataItemEntity.valueType} for value ${value}`)
      }
      break
  }
  return metadataItemEntity
}

export const identityMetadataItemEntityFrom = (item: NonPersistedMetadataItem<MetadataTypes>): IdentityMetadataItemEntity | undefined => {
  return metadataItemEntityFrom(item, IdentityMetadataItemEntity)
}

export const contactMetadataItemEntityFrom = (item: NonPersistedMetadataItem<MetadataTypes>): ContactMetadataItemEntity | undefined => {
  return metadataItemEntityFrom(item, ContactMetadataItemEntity)
}

export const metadataItemFrom = (entity: IdentityMetadataItemEntity | ContactMetadataItemEntity): MetadataItem<MetadataTypes> => {
  const item: Partial<MetadataItem<MetadataTypes>> = {
    id: entity.id,
    label: entity.label,
  }
  switch (entity.valueType) {
    case 'string':
      item.value = entity.stringValue
      break
    case 'number':
      item.value = entity.numberValue
      break
    case 'Date':
      item.value = entity.dateValue
      break
    case 'boolean':
      item.value = entity.boolValue
      break
    default:
      throw new Error(`Unsupported valueType ${entity.valueType}`)
  }
  return item as MetadataItem<MetadataTypes>
}

export const naturalPersonEntityFrom = (naturalPerson: NonPersistedNaturalPerson): NaturalPersonEntity => {
  const naturalPersonEntity: NaturalPersonEntity = new NaturalPersonEntity()
  naturalPersonEntity.firstName = naturalPerson.firstName
  naturalPersonEntity.middleName = naturalPerson.middleName
  naturalPersonEntity.lastName = naturalPerson.lastName
  naturalPersonEntity.displayName = naturalPerson.displayName
  naturalPersonEntity.ownerId = naturalPerson.ownerId
  naturalPersonEntity.tenantId = naturalPerson.tenantId
  naturalPersonEntity.metadata = naturalPerson.metadata
    ? naturalPerson.metadata.map(contactMetadataItemEntityFrom).filter((entity): entity is ContactMetadataItemEntity => entity !== undefined)
    : []

  return naturalPersonEntity
}

export const naturalPersonFrom = (naturalPerson: NaturalPersonEntity): NaturalPerson => {
  const result: NaturalPerson = {
    id: naturalPerson.id,
    firstName: naturalPerson.firstName,
    middleName: naturalPerson.middleName,
    lastName: naturalPerson.lastName,
    displayName: naturalPerson.displayName,
    metadata: naturalPerson.metadata ? naturalPerson.metadata.map((item: ContactMetadataItemEntity) => metadataItemFrom(item)) : [],
    ownerId: naturalPerson.ownerId,
    tenantId: naturalPerson.tenantId,
    createdAt: naturalPerson.createdAt,
    lastUpdatedAt: naturalPerson.lastUpdatedAt,
  }

  return replaceNullWithUndefined(result)
}

export const openIdConfigEntityFrom = (config: NonPersistedOpenIdConfig): OpenIdConfigEntity => {
  const openIdConfig: OpenIdConfigEntity = new OpenIdConfigEntity()
  openIdConfig.clientId = config.clientId
  openIdConfig.clientSecret = config.clientSecret
  openIdConfig.scopes = config.scopes
  openIdConfig.issuer = config.issuer
  openIdConfig.redirectUrl = config.redirectUrl
  openIdConfig.dangerouslyAllowInsecureHttpRequests = config.dangerouslyAllowInsecureHttpRequests
  openIdConfig.clientAuthMethod = config.clientAuthMethod
  openIdConfig.ownerId = config.ownerId
  openIdConfig.tenantId = config.tenantId

  return openIdConfig
}

export const organizationEntityFrom = (organization: NonPersistedOrganization): OrganizationEntity => {
  const organizationEntity: OrganizationEntity = new OrganizationEntity()
  organizationEntity.legalName = organization.legalName
  organizationEntity.displayName = organization.displayName
  organizationEntity.ownerId = organization.ownerId
  organizationEntity.tenantId = organization.tenantId
  organizationEntity.metadata = organization.metadata
    ? organization.metadata.map(contactMetadataItemEntityFrom).filter((entity): entity is ContactMetadataItemEntity => entity !== undefined)
    : []

  return organizationEntity
}

export const organizationFrom = (organization: OrganizationEntity): Organization => {
  const result: Organization = {
    id: organization.id,
    legalName: organization.legalName,
    displayName: organization.displayName,
    metadata: organization.metadata ? organization.metadata.map((item: ContactMetadataItemEntity) => metadataItemFrom(item)) : [],
    ownerId: organization.ownerId,
    tenantId: organization.tenantId,
    createdAt: organization.createdAt,
    lastUpdatedAt: organization.lastUpdatedAt,
  }

  return replaceNullWithUndefined(result)
}

export const partyRelationshipEntityFrom = (relationship: NonPersistedPartyRelationship): PartyRelationshipEntity => {
  const partyRelationshipEntity: PartyRelationshipEntity = new PartyRelationshipEntity()
  partyRelationshipEntity.leftId = relationship.leftId
  partyRelationshipEntity.rightId = relationship.rightId
  partyRelationshipEntity.ownerId = relationship.ownerId
  partyRelationshipEntity.tenantId = relationship.tenantId

  return partyRelationshipEntity
}

export const partyRelationshipFrom = (relationship: PartyRelationshipEntity): PartyRelationship => {
  const result: PartyRelationship = {
    id: relationship.id,
    leftId: relationship.leftId,
    rightId: relationship.rightId,
    ownerId: relationship.ownerId,
    tenantId: relationship.tenantId,
    createdAt: relationship.createdAt,
    lastUpdatedAt: relationship.lastUpdatedAt,
  }

  return replaceNullWithUndefined(result)
}

export const partyTypeEntityFrom = (args: NonPersistedPartyType): PartyTypeEntity => {
  const partyTypeEntity: PartyTypeEntity = new PartyTypeEntity()
  if (args.id) {
    partyTypeEntity.id = args.id
  }
  partyTypeEntity.type = args.type
  partyTypeEntity.origin = args.origin
  partyTypeEntity.name = args.name
  partyTypeEntity.description = args.description
  partyTypeEntity.tenantId = args.tenantId

  return partyTypeEntity
}

export const partyTypeFrom = (partyType: PartyTypeEntity): PartyType => {
  const result: PartyType = {
    id: partyType.id,
    type: partyType.type,
    origin: partyType.origin,
    name: partyType.name,
    tenantId: partyType.tenantId,
    description: partyType.description,
    createdAt: partyType.createdAt,
    lastUpdatedAt: partyType.lastUpdatedAt,
  }

  return replaceNullWithUndefined(result)
}

export const configFrom = (config: BaseConfigEntity): ConnectionConfig => {
  if (isOpenIdConfig(config)) {
    return openIdConfigFrom(<OpenIdConfigEntity>config)
  } else if (isDidAuthConfig(config)) {
    return didAuthConfigFrom(<DidAuthConfigEntity>config)
  }

  throw new Error('config type not supported')
}

export const openIdConfigFrom = (config: OpenIdConfigEntity): OpenIdConfig => {
  const result: OpenIdConfig = {
    id: config.id,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    scopes: config.scopes,
    issuer: config.issuer,
    redirectUrl: config.redirectUrl,
    dangerouslyAllowInsecureHttpRequests: config.dangerouslyAllowInsecureHttpRequests,
    clientAuthMethod: config.clientAuthMethod,
    ownerId: config.ownerId,
    tenantId: config.tenantId,
  }

  return replaceNullWithUndefined(result)
}

export const didAuthConfigFrom = (config: DidAuthConfigEntity): DidAuthConfig => {
  const result: DidAuthConfig = {
    id: config.id,
    idOpts: { identifier: config.identifier },
    stateId: '', // FIXME
    redirectUrl: config.redirectUrl,
    sessionId: config.sessionId,
    ownerId: config.ownerId,
    tenantId: config.tenantId,
  }

  return replaceNullWithUndefined(result)
}

export const isOpenIdConfig = (config: NonPersistedConnectionConfig | BaseConfigEntity): config is OpenIdConfig | OpenIdConfigEntity =>
  'clientSecret' in config && 'issuer' in config && 'redirectUrl' in config

export const isDidAuthConfig = (config: NonPersistedConnectionConfig | BaseConfigEntity): config is DidAuthConfig | DidAuthConfigEntity =>
  ('identifier' in config || ('idOpts' in config && 'identifier' in config.idOpts)) && 'redirectUrl' in config && 'sessionId' in config
