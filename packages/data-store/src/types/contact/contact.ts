import { IIdentifier } from '@veramo/core'

export type Party = {
  id: string
  uri?: string
  roles: Array<IdentityRole>
  identities: Array<Identity>
  electronicAddresses: Array<ElectronicAddress>
  physicalAddresses: Array<PhysicalAddress>
  contact: Contact
  partyType: PartyType
  relationships: Array<PartyRelationship>
  createdAt: Date
  lastUpdatedAt: Date
}
export type NonPersistedParty = Omit<
  Party,
  | 'id'
  | 'identities'
  | 'electronicAddresses'
  | 'physicalAddresses'
  | 'contact'
  | 'roles'
  | 'partyType'
  | 'relationships'
  | 'createdAt'
  | 'lastUpdatedAt'
> & {
  identities?: Array<NonPersistedIdentity>
  electronicAddresses?: Array<NonPersistedElectronicAddress>
  physicalAddresses?: Array<NonPersistedPhysicalAddress>
  contact: NonPersistedContact
  partyType: NonPersistedPartyType
  relationships?: Array<NonPersistedPartyRelationship>
}
export type PartialParty = Partial<
  Omit<Party, 'identities' | 'electronicAddresses' | 'physicalAddresses' | 'contact' | 'partyType' | 'relationships'>
> & {
  identities?: PartialIdentity
  electronicAddresses?: PartialElectronicAddress
  physicalAddresses?: PartialPhysicalAddress
  contact?: PartialContact
  partyType?: PartialPartyType
  relationships?: PartialPartyRelationship
}

export type Identity = {
  id: string
  alias: string
  roles: Array<IdentityRole>
  identifier: CorrelationIdentifier
  connection?: Connection
  metadata?: Array<MetadataItem>
  createdAt: Date
  lastUpdatedAt: Date
}
export type NonPersistedIdentity = Omit<Identity, 'id' | 'identifier' | 'connection' | 'metadata' | 'createdAt' | 'lastUpdatedAt'> & {
  identifier: NonPersistedCorrelationIdentifier
  connection?: NonPersistedConnection
  metadata?: Array<NonPersistedMetadataItem>
}
export type PartialIdentity = Partial<Omit<Identity, 'identifier' | 'connection' | 'metadata' | 'roles'>> & {
  identifier?: PartialCorrelationIdentifier
  connection?: PartialConnection
  metadata?: PartialMetadataItem
  roles?: IdentityRole
  partyId?: string
}

export type MetadataItem = {
  id: string
  label: string
  value: string
}
export type NonPersistedMetadataItem = Omit<MetadataItem, 'id'>
export type PartialMetadataItem = Partial<MetadataItem>

export type CorrelationIdentifier = {
  id: string
  type: CorrelationIdentifierType
  correlationId: string
}
export type NonPersistedCorrelationIdentifier = Omit<CorrelationIdentifier, 'id'>
export type PartialCorrelationIdentifier = Partial<CorrelationIdentifier>

export type Connection = {
  id: string
  type: ConnectionType
  config: ConnectionConfig
}
export type NonPersistedConnection = Omit<Connection, 'id' | 'config'> & {
  config: NonPersistedConnectionConfig
}
export type PartialConnection = Partial<Omit<Connection, 'config'>> & {
  config: PartialConnectionConfig
}

export type OpenIdConfig = {
  id: string
  clientId: string
  clientSecret: string
  scopes: Array<string>
  issuer: string
  redirectUrl: string
  dangerouslyAllowInsecureHttpRequests: boolean
  clientAuthMethod: 'basic' | 'post' | undefined
}
export type NonPersistedOpenIdConfig = Omit<OpenIdConfig, 'id'>
export type PartialOpenIdConfig = Partial<OpenIdConfig>

export type DidAuthConfig = {
  id: string
  identifier: IIdentifier
  stateId: string
  redirectUrl: string
  sessionId: string
}
export type NonPersistedDidAuthConfig = Omit<DidAuthConfig, 'id'>
export type PartialDidAuthConfig = Partial<Omit<DidAuthConfig, 'identifier'>> & {
  identifier: Partial<IIdentifier> // TODO, we need to create partials for sub types in IIdentifier
}

export type ConnectionConfig = OpenIdConfig | DidAuthConfig
export type NonPersistedConnectionConfig = NonPersistedDidAuthConfig | NonPersistedOpenIdConfig
export type PartialConnectionConfig = PartialOpenIdConfig | PartialDidAuthConfig

export type NaturalPerson = {
  id: string
  firstName: string
  lastName: string
  middleName?: string
  displayName: string
  createdAt: Date
  lastUpdatedAt: Date
}
export type NonPersistedNaturalPerson = Omit<NaturalPerson, 'id' | 'createdAt' | 'lastUpdatedAt'>
export type PartialNaturalPerson = Partial<NaturalPerson>

export type Organization = {
  id: string
  legalName: string
  displayName: string
  createdAt: Date
  lastUpdatedAt: Date
}
export type NonPersistedOrganization = Omit<Organization, 'id' | 'createdAt' | 'lastUpdatedAt'>
export type PartialOrganization = Partial<Organization>

export type Contact = NaturalPerson | Organization
export type NonPersistedContact = NonPersistedNaturalPerson | NonPersistedOrganization
export type PartialContact = PartialNaturalPerson | PartialOrganization

export type PartyType = {
  id: string
  type: PartyTypeType
  origin: PartyOrigin
  name: string
  tenantId: string
  description?: string
  createdAt: Date
  lastUpdatedAt: Date
}
export type NonPersistedPartyType = Omit<PartyType, 'id' | 'createdAt' | 'lastUpdatedAt'> & {
  id?: string
}
export type PartialPartyType = Partial<PartyType>

export type PartyRelationship = {
  id: string
  leftId: string
  rightId: string
  createdAt: Date
  lastUpdatedAt: Date
}
export type NonPersistedPartyRelationship = Omit<PartyRelationship, 'id' | 'createdAt' | 'lastUpdatedAt'>
export type PartialPartyRelationship = Partial<PartyRelationship>

export type ElectronicAddress = {
  id: string
  type: ElectronicAddressType
  electronicAddress: string
  createdAt: Date
  lastUpdatedAt: Date
}
export type NonPersistedElectronicAddress = Omit<ElectronicAddress, 'id' | 'createdAt' | 'lastUpdatedAt'>
export type PartialElectronicAddress = Partial<ElectronicAddress> & {
  partyId?: string
}

export type PhysicalAddress = {
  id: string
  type: PhysicalAddressType
  streetName: string
  streetNumber: string
  postalCode: string
  cityName: string
  provinceName: string
  countryCode: string
  buildingName?: string
  createdAt: Date
  lastUpdatedAt: Date
}
export type NonPersistedPhysicalAddress = Omit<PhysicalAddress, 'id' | 'createdAt' | 'lastUpdatedAt'>
export type PartialPhysicalAddress = Partial<PhysicalAddress> & {
  partyId?: string
}

export type ElectronicAddressType = 'email' | 'phone'

export type PhysicalAddressType = 'home' | 'visit' | 'postal'

export enum IdentityRole {
  ISSUER = 'issuer',
  VERIFIER = 'verifier',
  HOLDER = 'holder',
}

export enum ConnectionType {
  OPENID_CONNECT = 'OIDC',
  SIOPv2 = 'SIOPv2',
  SIOPv2_OpenID4VP = 'SIOPv2+OpenID4VP',
}

export enum CorrelationIdentifierType {
  DID = 'did',
  URL = 'url',
}

export enum PartyTypeType {
  NATURAL_PERSON = 'naturalPerson',
  ORGANIZATION = 'organization',
}

export enum PartyOrigin {
  INTERNAL = 'INTERNAL',
  EXTERNAL = 'EXTERNAL',
}
