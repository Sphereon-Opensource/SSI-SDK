import {
  IContact,
  IIdentity,
  IAddIdentityArgs,
  IGetIdentityArgs,
  IGetIdentitiesArgs,
  IGetContactArgs,
  IRemoveIdentityArgs,
  IUpdateIdentityArgs,
  IAddContactArgs,
  IGetContactsArgs,
  IRemoveContactArgs,
  IUpdateContactArgs,
} from '../types/index.mjs'

export abstract class AbstractContactStore {
  abstract getContact(args: IGetContactArgs): Promise<IContact>
  abstract getContacts(args?: IGetContactsArgs): Promise<Array<IContact>>
  abstract addContact(args: IAddContactArgs): Promise<IContact>
  abstract updateContact(args: IUpdateContactArgs): Promise<IContact>
  abstract removeContact(args: IRemoveContactArgs): Promise<void>
  abstract getIdentity(args: IGetIdentityArgs): Promise<IIdentity>
  abstract getIdentities(args: IGetIdentitiesArgs): Promise<Array<IIdentity>>
  abstract addIdentity(args: IAddIdentityArgs): Promise<IIdentity>
  abstract updateIdentity(args: IUpdateIdentityArgs): Promise<IIdentity>
  abstract removeIdentity(args: IRemoveIdentityArgs): Promise<void>
}
