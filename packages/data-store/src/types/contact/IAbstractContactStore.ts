import {
  NonPersistedPartyType,
  NonPersistedContact,
  NonPersistedIdentity,
  Party,
  Identity,
  PartialParty,
  PartialIdentity,
  PartyTypeEnum,
  PartyType,
  PartyRelationship,
  PartialPartyRelationship,
  PartialPartyType,
  NonPersistedElectronicAddress,
} from './contact'

export type FindPartyArgs = Array<PartialParty>
export type FindIdentityArgs = Array<PartialIdentity>
export type FindPartyTypeArgs = Array<PartialPartyType>
export type FindRelationshipArgs = Array<PartialPartyRelationship>

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
  type: PartyTypeEnum
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
