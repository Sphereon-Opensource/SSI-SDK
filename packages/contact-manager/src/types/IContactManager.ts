import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import {
  Identity,
  NonPersistedIdentity,
  FindRelationshipArgs,
  FindIdentityArgs,
  NonPersistedContact,
  PartyTypeEnum as ContactTypeEnum,
  NonPersistedPartyType as NonPersistedContactType,
  FindPartyTypeArgs as FindContactTypeArgs,
  FindPartyArgs as FindContactArgs,
  PartyRelationship as ContactRelationship,
  PartyType as ContactType,
  Party as Contact,
  NonPersistedParty,
} from '@sphereon/ssi-sdk.data-store'

export interface IContactManager extends IPluginMethodMap {
  cmGetContact(args: GetContactArgs, context: RequiredContext): Promise<Contact>
  cmGetContacts(args?: GetContactsArgs): Promise<Array<Contact>>
  cmAddContact(args: AddContactArgs, context: RequiredContext): Promise<Contact>
  cmUpdateContact(args: UpdateContactArgs, context: RequiredContext): Promise<Contact>
  cmRemoveContact(args: RemoveContactArgs, context: RequiredContext): Promise<boolean>
  cmGetIdentity(args: GetIdentityArgs, context: RequiredContext): Promise<Identity>
  cmGetIdentities(args?: GetIdentitiesArgs): Promise<Array<Identity>>
  cmAddIdentity(args: AddIdentityArgs, context: RequiredContext): Promise<Identity>
  cmUpdateIdentity(args: UpdateIdentityArgs, context: RequiredContext): Promise<Identity>
  cmRemoveIdentity(args: RemoveIdentityArgs, context: RequiredContext): Promise<boolean>
  cmGetRelationship(args: GetRelationshipArgs, context: RequiredContext): Promise<ContactRelationship>
  cmGetRelationships(args?: GetRelationshipsArgs): Promise<Array<ContactRelationship>>
  cmUpdateRelationship(args: UpdateRelationshipArgs, context: RequiredContext): Promise<ContactRelationship>
  cmAddRelationship(args: AddRelationshipArgs, context: RequiredContext): Promise<ContactRelationship>
  cmRemoveRelationship(args: RemoveRelationshipArgs, context: RequiredContext): Promise<boolean>
  cmGetContactType(args: GetContactTypeArgs, context: RequiredContext): Promise<ContactType>
  cmGetContactTypes(args?: GetContactTypesArgs): Promise<Array<ContactType>>
  cmAddContactType(args: AddContactTypeArgs, context: RequiredContext): Promise<ContactType>
  cmUpdateContactType(args: UpdateContactTypeArgs, context: RequiredContext): Promise<ContactType>
  cmRemoveContactType(args: RemoveContactTypeArgs, context: RequiredContext): Promise<boolean>
}

export type GetContactArgs = {
  contactId: string
}

export type GetContactsArgs = {
  filter?: FindContactArgs
}

// export type AddContactArgs = {
//   uri?: string
//   contactType: NonPersistedContactType
//   identities?: Array<NonPersistedIdentity>
// } & NonPersistedNaturalPerson | NonPersistedOrganization

export type AddContactArgs = Omit<NonPersistedParty, 'contact' | 'partyType'> &
  NonPersistedContact & {
    contactType: NonPersistedContactType
  }

export type UpdateContactArgs = {
  contact: Contact
}

export type RemoveContactArgs = {
  contactId: string
}

export type GetIdentityArgs = {
  identityId: string
}

export type GetIdentitiesArgs = {
  filter?: FindIdentityArgs
}

export type AddIdentityArgs = {
  contactId: string
  identity: NonPersistedIdentity
}

export type UpdateIdentityArgs = {
  identity: Identity
}

export type RemoveIdentityArgs = {
  identityId: string
}

export type AddRelationshipArgs = {
  leftId: string
  rightId: string
}

export type RemoveRelationshipArgs = {
  relationshipId: string
}

export type GetRelationshipArgs = {
  relationshipId: string
}

export type GetRelationshipsArgs = {
  filter: FindRelationshipArgs
}

export type UpdateRelationshipArgs = {
  relationship: Omit<ContactRelationship, 'createdAt' | 'lastUpdatedAt'>
}

export type AddContactTypeArgs = {
  type: ContactTypeEnum
  name: string
  tenantId: string
  description?: string
}

export type GetContactTypeArgs = {
  contactTypeId: string
}

export type GetContactTypesArgs = {
  filter?: FindContactTypeArgs
}

export type UpdateContactTypeArgs = {
  contactType: Omit<ContactType, 'createdAt' | 'lastUpdatedAt'>
}

export type RemoveContactTypeArgs = {
  contactTypeId: string
}

export type RequiredContext = IAgentContext<never>
