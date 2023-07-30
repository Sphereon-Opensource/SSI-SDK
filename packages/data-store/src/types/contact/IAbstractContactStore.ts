// import { FindOptionsWhere } from 'typeorm'
// import { ContactEntity } from '../../entities/contact/ContactEntity'
// import { IdentityEntity } from '../../entities/contact/IdentityEntity'
import { BasicContactType, BasicContactOwner, IBasicIdentity, IContact, IIdentity, IPartialContact, IPartialIdentity } from './contact'

// TODO WAL-625 refactor types to use interfaces and not the entities as the store should be replaceable
// export type FindContactArgs = FindOptionsWhere<ContactEntity>[]
// export type FindIdentityArgs = FindOptionsWhere<IdentityEntity>[]

export type FindContactArgs = Array<IPartialContact>
export type FindIdentityArgs = Array<IPartialIdentity>

export interface IGetContactArgs {
  contactId: string
}

export interface IGetContactsArgs {
  filter?: FindContactArgs
}

export interface IAddContactArgs {
  // name: string
  // alias: string
  uri?: string // TODO what we do with uri?
  contactType: BasicContactType // TODO we can have a situation where we want to add a contact to an existing type, so use BasicContactType | IContactType? also make a test for these 2 situations in the store
  contactOwner: BasicContactOwner
  identities?: Array<IBasicIdentity>
}

export interface IUpdateContactArgs {
  contact: Omit<IContact, 'identities' | 'createdAt' | 'lastUpdatedAt'>
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
  leftContactId: string
  rightContactId: string
}
