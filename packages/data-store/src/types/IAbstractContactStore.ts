import { FindOptionsWhere } from 'typeorm'
import { ContactEntity } from '../entities/contact/ContactEntity'
import { IBasicIdentity, IContact, IIdentity } from './contact'

export type FindContactArgs = FindOptionsWhere<ContactEntity>[]

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
  contactId: string
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
