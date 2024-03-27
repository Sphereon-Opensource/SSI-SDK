import {
  Connection,
  ConnectionConfig,
  Contact,
  CorrelationIdentifier,
  DidAuthConfig,
  ElectronicAddress,
  Identity,
  IdentityOrigin,
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
  NonPersistedPhysicalAddress, NonPersistedStudent,
  OpenIdConfig,
  Organization,
  Party,
  PartyRelationship,
  PartyType,
  PhysicalAddress, Student,
} from '../../types'
import {PartyEntity} from '../../entities/contact/PartyEntity'
import {IdentityEntity} from '../../entities/contact/IdentityEntity'
import {ElectronicAddressEntity} from '../../entities/contact/ElectronicAddressEntity'
import {PartyRelationshipEntity} from '../../entities/contact/PartyRelationshipEntity'
import {BaseContactEntity} from '../../entities/contact/BaseContactEntity'
import {NaturalPersonEntity} from '../../entities/contact/NaturalPersonEntity'
import {OrganizationEntity} from '../../entities/contact/OrganizationEntity'
import {ConnectionEntity} from '../../entities/contact/ConnectionEntity'
import {BaseConfigEntity} from '../../entities/contact/BaseConfigEntity'
import {CorrelationIdentifierEntity} from '../../entities/contact/CorrelationIdentifierEntity'
import {DidAuthConfigEntity} from '../../entities/contact/DidAuthConfigEntity'
import {IdentityMetadataItemEntity} from '../../entities/contact/IdentityMetadataItemEntity'
import {OpenIdConfigEntity} from '../../entities/contact/OpenIdConfigEntity'
import {PartyTypeEntity} from '../../entities/contact/PartyTypeEntity'
import {PhysicalAddressEntity} from '../../entities/contact/PhysicalAddressEntity'
import {StudentEntity} from "../../entities/contact/StudentEntity";

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
  return {
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
}

export const contactEntityFrom = (contact: NonPersistedContact): BaseContactEntity => {
  if (isNaturalPerson(contact)) {
    return naturalPersonEntityFrom(<NonPersistedNaturalPerson>contact)
  } else if (isOrganization(contact)) {
    return organizationEntityFrom(<NonPersistedOrganization>contact)
  } else if (isStudent(contact)) {
    return studentEntityFrom(<NonPersistedStudent>contact)
  }

  throw new Error('Contact not supported')
}

export const contactFrom = (contact: BaseContactEntity): Contact => {
  if (isNaturalPerson(contact)) {
    return naturalPersonFrom(<NaturalPersonEntity>contact)
  } else if (isOrganization(contact)) {
    return organizationFrom(<OrganizationEntity>contact)
  } else if (isStudent(contact)) {
    return studentFrom(<StudentEntity>contact)
  }

  throw new Error(`Contact type not supported`)
}

export const isNaturalPerson = (contact: NonPersistedContact | BaseContactEntity): contact is NonPersistedNaturalPerson | NaturalPersonEntity =>
  'firstName' in contact && 'lastName' in contact && !('grade' in contact) && !('dateOfBirth' in contact)

export const isOrganization = (contact: NonPersistedContact | BaseContactEntity): contact is NonPersistedOrganization | OrganizationEntity =>
  'legalName' in contact

export const isStudent = (contact: NonPersistedContact | BaseContactEntity): contact is NonPersistedStudent | StudentEntity =>
    'grade' in contact && 'dateOfBirth' in contact

export const connectionEntityFrom = (connection: NonPersistedConnection): ConnectionEntity => {
  const connectionEntity: ConnectionEntity = new ConnectionEntity()
  connectionEntity.type = connection.type
  connectionEntity.config = configEntityFrom(connection.config)
  connectionEntity.ownerId = connection.ownerId
  connectionEntity.tenantId = connection.tenantId

  return connectionEntity
}

export const connectionFrom = (connection: ConnectionEntity): Connection => {
  return {
    id: connection.id,
    type: connection.type,
    ownerId: connection.ownerId,
    tenantId: connection.tenantId,
    config: configFrom(connection.config),
  }
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
  return {
    id: identifier.id,
    type: identifier.type,
    correlationId: identifier.correlationId,
    ownerId: identifier.ownerId,
    tenantId: identifier.tenantId,
  }
}

export const didAuthConfigEntityFrom = (config: NonPersistedDidAuthConfig): DidAuthConfigEntity => {
  const didAuthConfig: DidAuthConfigEntity = new DidAuthConfigEntity()
  didAuthConfig.identifier = config.identifier.did
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
  return {
    id: electronicAddress.id,
    type: electronicAddress.type,
    electronicAddress: electronicAddress.electronicAddress,
    ownerId: electronicAddress.ownerId,
    tenantId: electronicAddress.tenantId,
    createdAt: electronicAddress.createdAt,
    lastUpdatedAt: electronicAddress.lastUpdatedAt,
  }
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
  return {
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
}

export const identityEntityFrom = (args: NonPersistedIdentity): IdentityEntity => {
  const identityEntity: IdentityEntity = new IdentityEntity()
  identityEntity.alias = args.alias
  identityEntity.origin = args.origin ?? IdentityOrigin.EXTRERNAL
  identityEntity.ownerId = args.ownerId
  identityEntity.tenantId = args.tenantId
  identityEntity.roles = args.roles
  identityEntity.identifier = correlationIdentifierEntityFrom(args.identifier)
  identityEntity.connection = args.connection ? connectionEntityFrom(args.connection) : undefined
  identityEntity.metadata = args.metadata ? args.metadata.map((item: NonPersistedMetadataItem) => metadataItemEntityFrom(item)) : []

  return identityEntity
}

export const identityFrom = (identity: IdentityEntity): Identity => {
  return {
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
}

export const metadataItemEntityFrom = (item: NonPersistedMetadataItem): IdentityMetadataItemEntity => {
  const metadataItemEntity: IdentityMetadataItemEntity = new IdentityMetadataItemEntity()
  metadataItemEntity.label = item.label
  metadataItemEntity.value = item.value

  return metadataItemEntity
}

export const metadataItemFrom = (item: IdentityMetadataItemEntity): MetadataItem => {
  return {
    id: item.id,
    label: item.label,
    value: item.value,
  }
}

export const naturalPersonEntityFrom = (naturalPerson: NonPersistedNaturalPerson): NaturalPersonEntity => {
  const naturalPersonEntity: NaturalPersonEntity = new NaturalPersonEntity()
  naturalPersonEntity.firstName = naturalPerson.firstName
  naturalPersonEntity.middleName = naturalPerson.middleName
  naturalPersonEntity.lastName = naturalPerson.lastName
  naturalPersonEntity.displayName = naturalPerson.displayName
  naturalPersonEntity.ownerId = naturalPerson.ownerId
  naturalPersonEntity.tenantId = naturalPerson.tenantId

  return naturalPersonEntity
}

export const naturalPersonFrom = (naturalPerson: NaturalPersonEntity): NaturalPerson => {
  return {
    id: naturalPerson.id,
    firstName: naturalPerson.firstName,
    middleName: naturalPerson.middleName,
    lastName: naturalPerson.lastName,
    displayName: naturalPerson.displayName,
    ownerId: naturalPerson.ownerId,
    tenantId: naturalPerson.tenantId,
    createdAt: naturalPerson.createdAt,
    lastUpdatedAt: naturalPerson.lastUpdatedAt,
  }
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

  return organizationEntity
}

export const studentEntityFrom = (student: NonPersistedStudent): StudentEntity => {
  const studentEntity: StudentEntity = new StudentEntity()
  studentEntity.displayName = student.displayName
  studentEntity.firstName = student.firstName
  studentEntity.middleName = student.middleName
  studentEntity.lastName = student.lastName
  studentEntity.grade = student.grade
  studentEntity.dateOfBirth = student.dateOfBirth
  studentEntity.ownerId = student.ownerId
  studentEntity.tenantId = student.tenantId

  return studentEntity
}

export const studentFrom = (student: StudentEntity): Student => {
  return {
    id: student.id,
    displayName: student.displayName,
    firstName: student.firstName,
    middleName: student.middleName,
    lastName: student.lastName,
    grade: student.grade,
    dateOfBirth: student.dateOfBirth,
    ownerId: student.ownerId,
    tenantId: student.tenantId,
    createdAt: student.createdAt,
    lastUpdatedAt: student.lastUpdatedAt,
  }
}

export const organizationFrom = (organization: OrganizationEntity): Organization => {
  return {
    id: organization.id,
    legalName: organization.legalName,
    displayName: organization.displayName,
    ownerId: organization.ownerId,
    tenantId: organization.tenantId,
    createdAt: organization.createdAt,
    lastUpdatedAt: organization.lastUpdatedAt,
  }
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
  return {
    id: relationship.id,
    leftId: relationship.leftId,
    rightId: relationship.rightId,
    ownerId: relationship.ownerId,
    tenantId: relationship.tenantId,
    createdAt: relationship.createdAt,
    lastUpdatedAt: relationship.lastUpdatedAt,
  }
}

export const partyTypeEntityFrom = (args: NonPersistedPartyType): PartyTypeEntity => {
  const partyTypeEntity: PartyTypeEntity = new PartyTypeEntity()
  if (args.id) {
    partyTypeEntity.id = args.id
  }
  partyTypeEntity.type = args.type
  partyTypeEntity.name = args.name
  partyTypeEntity.description = args.description
  partyTypeEntity.tenantId = args.tenantId

  return partyTypeEntity
}

export const partyTypeFrom = (partyType: PartyTypeEntity): PartyType => {
  return {
    id: partyType.id,
    type: partyType.type,
    name: partyType.name,
    tenantId: partyType.tenantId,
    description: partyType.description,
    createdAt: partyType.createdAt,
    lastUpdatedAt: partyType.lastUpdatedAt,
  }
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
  return {
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
}

export const didAuthConfigFrom = (config: DidAuthConfigEntity): DidAuthConfig => {
  return {
    id: config.id,
    identifier: { did: config.identifier, provider: '', keys: [], services: [] },
    stateId: '', // FIXME
    redirectUrl: config.redirectUrl,
    sessionId: config.sessionId,
    ownerId: config.ownerId,
    tenantId: config.tenantId,
  }
}

export const isOpenIdConfig = (config: NonPersistedConnectionConfig | BaseConfigEntity): config is OpenIdConfig | OpenIdConfigEntity =>
  'clientSecret' in config && 'issuer' in config && 'redirectUrl' in config

export const isDidAuthConfig = (config: NonPersistedConnectionConfig | BaseConfigEntity): config is DidAuthConfig | DidAuthConfigEntity =>
  'identifier' in config && 'redirectUrl' in config && 'sessionId' in config
