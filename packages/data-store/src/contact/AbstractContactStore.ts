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
  IAddRelationshipArgs,
  IContactRelationship,
  IRemoveRelationshipArgs,
  IAddContactTypeArgs,
  IContactType,
  IGetContactTypeArgs,
  IUpdateContactTypeArgs,
  IGetContactTypesArgs,
  IRemoveContactTypeArgs,
  IGetRelationshipsArgs,
  IGetRelationshipArgs,
  IUpdateRelationshipArgs,
} from '../types'

export abstract class AbstractContactStore {
  abstract getContact(args: IGetContactArgs): Promise<IContact>
  abstract getContacts(args?: IGetContactsArgs): Promise<Array<IContact>>
  abstract addContact(args: IAddContactArgs): Promise<IContact>
  abstract updateContact(args: IUpdateContactArgs): Promise<IContact>
  abstract removeContact(args: IRemoveContactArgs): Promise<void>

  abstract getIdentity(args: IGetIdentityArgs): Promise<IIdentity>
  abstract getIdentities(args?: IGetIdentitiesArgs): Promise<Array<IIdentity>>
  abstract addIdentity(args: IAddIdentityArgs): Promise<IIdentity>
  abstract updateIdentity(args: IUpdateIdentityArgs): Promise<IIdentity>
  abstract removeIdentity(args: IRemoveIdentityArgs): Promise<void>

  abstract getRelationship(args: IGetRelationshipArgs): Promise<IContactRelationship>
  abstract getRelationships(args?: IGetRelationshipsArgs): Promise<Array<IContactRelationship>>
  abstract addRelationship(args: IAddRelationshipArgs): Promise<IContactRelationship>
  abstract updateRelationship(args: IUpdateRelationshipArgs): Promise<IContactRelationship>
  abstract removeRelationship(args: IRemoveRelationshipArgs): Promise<void>

  abstract getContactType(args: IGetContactTypeArgs): Promise<IContactType>
  abstract getContactTypes(args?: IGetContactTypesArgs): Promise<Array<IContactType>>
  abstract addContactType(args: IAddContactTypeArgs): Promise<IContactType>
  abstract updateContactType(args: IUpdateContactTypeArgs): Promise<IContactType>
  abstract removeContactType(args: IRemoveContactTypeArgs): Promise<void>
}
