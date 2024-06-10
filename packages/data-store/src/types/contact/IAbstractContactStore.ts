import {
  ElectronicAddress,
  Identity,
  NonPersistedContact,
  NonPersistedElectronicAddress,
  NonPersistedIdentity,
  NonPersistedPartyType,
  NonPersistedPhysicalAddress,
  PartialElectronicAddress,
  PartialIdentity,
  PartialParty,
  PartialPartyRelationship,
  PartialPartyType,
  PartialPhysicalAddress,
  Party,
  PartyOrigin,
  PartyRelationship,
  PartyType,
  PartyTypeType,
  PhysicalAddress,
} from './contact'

export type FindPartyArgs = Array<PartialParty>
export type FindIdentityArgs = Array<PartialIdentity>
export type FindPartyTypeArgs = Array<PartialPartyType>
export type FindRelationshipArgs = Array<PartialPartyRelationship>
export type FindElectronicAddressArgs = Array<PartialElectronicAddress>
export type FindPhysicalAddressArgs = Array<PartialPhysicalAddress>

export type GetPartyArgs = {
  partyId: string
}

export type GetPartiesArgs = {
  filter?: FindPartyArgs
}

export type AddPartyArgs = {
  uri?: string
  partyType: NonPersistedPartyType
  contact: NonPersistedContact
  identities?: Array<NonPersistedIdentity>
  electronicAddresses?: Array<NonPersistedElectronicAddress>
  physicalAddresses?: Array<NonPersistedPhysicalAddress>
}

export type UpdatePartyArgs = {
  party: Omit<Party, 'identities' | 'electronicAddresses' | 'partyType' | 'createdAt' | 'lastUpdatedAt'>
}

export type RemovePartyArgs = {
  partyId: string
}

export type GetIdentityArgs = {
  identityId: string
}

export type GetIdentitiesArgs = {
  filter?: FindIdentityArgs
}

export type AddIdentityArgs = {
  partyId: string
  identity: NonPersistedIdentity
}

export type UpdateIdentityArgs = {
  identity: Identity
}

export type RemoveIdentityArgs = {
  identityId: string
}

export type RemoveRelationshipArgs = {
  relationshipId: string
}

export type AddRelationshipArgs = {
  leftId: string
  rightId: string
}

export type GetRelationshipArgs = {
  relationshipId: string
}

export type GetRelationshipsArgs = {
  filter: FindRelationshipArgs
}

export type UpdateRelationshipArgs = {
  relationship: Omit<PartyRelationship, 'createdAt' | 'lastUpdatedAt'>
}

export type AddPartyTypeArgs = {
  type: PartyTypeType
  origin: PartyOrigin
  name: string
  tenantId: string
  description?: string
}

export type GetPartyTypeArgs = {
  partyTypeId: string
}

export type GetPartyTypesArgs = {
  filter?: FindPartyTypeArgs
}

export type UpdatePartyTypeArgs = {
  partyType: Omit<PartyType, 'createdAt' | 'lastUpdatedAt'>
}

export type RemovePartyTypeArgs = {
  partyTypeId: string
}

export type GetElectronicAddressArgs = {
  electronicAddressId: string
}

export type GetElectronicAddressesArgs = {
  filter?: FindElectronicAddressArgs
}

export type AddElectronicAddressArgs = {
  partyId: string
  electronicAddress: NonPersistedElectronicAddress
}

export type UpdateElectronicAddressArgs = {
  electronicAddress: ElectronicAddress
}

export type RemoveElectronicAddressArgs = {
  electronicAddressId: string
}

export type GetPhysicalAddressArgs = {
  physicalAddressId: string
}

export type GetPhysicalAddressesArgs = {
  filter?: FindPhysicalAddressArgs
}

export type AddPhysicalAddressArgs = {
  partyId: string
  physicalAddress: NonPersistedPhysicalAddress
}

export type UpdatePhysicalAddressArgs = {
  physicalAddress: PhysicalAddress
}

export type RemovePhysicalAddressArgs = {
  physicalAddressId: string
}
