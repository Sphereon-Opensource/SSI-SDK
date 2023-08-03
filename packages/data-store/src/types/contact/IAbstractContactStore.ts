import {
  BasicContactType,
  BasicContactOwner,
  IBasicIdentity,
  IContact,
  IIdentity,
  IPartialContact,
  IPartialIdentity,
  ContactTypeEnum,
  IContactType,
  IContactRelationship,
  IPartialContactRelationship,
  IPartialContactType,
} from './contact'

export type FindContactArgs = Array<IPartialContact>
export type FindIdentityArgs = Array<IPartialIdentity>
export type FindContactTypeArgs = Array<IPartialContactType>
export type FindRelationshipArgs = Array<IPartialContactRelationship>

export interface IGetContactArgs {
  contactId: string
}

export interface IGetContactsArgs {
  filter?: FindContactArgs
}

export interface IAddContactArgs {
  uri?: string
  contactType: BasicContactType
  contactOwner: BasicContactOwner
  identities?: Array<IBasicIdentity>
}

export interface IUpdateContactArgs {
  contact: Omit<IContact, 'identities' | 'contactType' | 'createdAt' | 'lastUpdatedAt'>
}

export interface IRemoveContactArgs {
  contactId: string
}

export interface IGetIdentityArgs {
  identityId: string
}

export interface IGetIdentitiesArgs {
  filter?: FindIdentityArgs
}

export interface IAddIdentityArgs {
  contactId: string
  identity: IBasicIdentity
}

export interface IUpdateIdentityArgs {
  identity: IIdentity
}

export interface IRemoveIdentityArgs {
  identityId: string
}

export interface IRemoveRelationshipArgs {
  relationshipId: string
}

export interface IAddRelationshipArgs {
  leftId: string
  rightId: string
}

export interface IGetRelationshipArgs {
  relationshipId: string
}

export interface IGetRelationshipsArgs {
  filter: FindRelationshipArgs
}

export interface IUpdateRelationshipArgs {
  relationship: Omit<IContactRelationship, 'createdAt' | 'lastUpdatedAt'>
}

export interface IAddContactTypeArgs {
  type: ContactTypeEnum
  name: string
  tenantId: string
  description?: string
}

export interface IGetContactTypeArgs {
  contactTypeId: string
}

export interface IGetContactTypesArgs {
  filter?: FindContactTypeArgs
}

export interface IUpdateContactTypeArgs {
  contactType: Omit<IContactType, 'createdAt' | 'lastUpdatedAt'>
}

export interface IRemoveContactTypeArgs {
  contactTypeId: string
}
