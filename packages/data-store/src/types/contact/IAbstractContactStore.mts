import { FindOptionsWhere } from 'typeorm'
import { ContactEntity } from '../../entities/contact/ContactEntity.mjs'
import { IdentityEntity } from '../../entities/contact/IdentityEntity.mjs'
import { IBasicIdentity, IContact, IIdentity } from './contact.mjs'

// TODO WAL-625 refactor types to use interfaces and not the entities as the store should be replaceable
export type FindContactArgs = FindOptionsWhere<ContactEntity>[]
export type FindIdentityArgs = FindOptionsWhere<IdentityEntity>[]

export interface IGetContactArgs {
  contactId: string
}

export interface IGetContactsArgs {
  filter?: FindContactArgs
}

export interface IAddContactArgs {
  name: string
  alias: string
  uri?: string
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
