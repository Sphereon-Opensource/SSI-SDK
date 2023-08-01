import { IAgentPlugin } from '@veramo/core'
import { schema } from '../index'
import {
  IAddContactArgs,
  IUpdateContactArgs,
  IGetIdentitiesArgs,
  IRemoveContactArgs,
  IAddIdentityArgs,
  IContactManager,
  IGetIdentityArgs,
  IRemoveIdentityArgs,
  IRequiredContext,
  IUpdateIdentityArgs,
  IGetContactsArgs,
  IGetContactArgs,
  IAddRelationshipArgs,
  IRemoveRelationshipArgs,
  IGetRelationshipArgs,
  IGetRelationshipsArgs,
  IUpdateRelationshipArgs,
  IAddContactTypeArgs,
  IGetContactTypeArgs,
  IGetContactTypesArgs,
  IRemoveContactTypeArgs,
  IUpdateContactTypeArgs,
} from '../types/IContactManager'
import {
  IContact,
  IIdentity,
  AbstractContactStore,
  IContactRelationship,
  IContactType
} from '@sphereon/ssi-sdk.data-store'

/**
 * {@inheritDoc IContactManager}
 */
export class ContactManager implements IAgentPlugin {
  readonly schema = schema.IContactManager
  readonly methods: IContactManager = {
    cmGetContact: this.cmGetContact.bind(this),
    cmGetContacts: this.cmGetContacts.bind(this),
    cmAddContact: this.cmAddContact.bind(this),
    cmUpdateContact: this.cmUpdateContact.bind(this),
    cmRemoveContact: this.cmRemoveContact.bind(this),
    cmGetIdentity: this.cmGetIdentity.bind(this),
    cmGetIdentities: this.cmGetIdentities.bind(this),
    cmAddIdentity: this.cmAddIdentity.bind(this),
    cmUpdateIdentity: this.cmUpdateIdentity.bind(this),
    cmRemoveIdentity: this.cmRemoveIdentity.bind(this),
    cmAddRelationship: this.cmAddRelationship.bind(this),
    cmRemoveRelationship: this.cmRemoveRelationship.bind(this),
    cmGetRelationship: this.cmGetRelationship.bind(this),
    cmGetRelationships: this.cmGetRelationships.bind(this),
    cmUpdateRelationship: this.cmUpdateRelationship.bind(this),
    cmGetContactType: this.cmGetContactType.bind(this),
    cmGetContactTypes: this.cmGetContactTypes.bind(this),
    cmAddContactType: this.cmAddContactType.bind(this),
    cmUpdateContactType: this.cmUpdateContactType.bind(this),
    cmRemoveContactType: this.cmRemoveContactType.bind(this)
  }

  private readonly store: AbstractContactStore

  constructor(options: { store: AbstractContactStore }) {
    this.store = options.store
  }

  /** {@inheritDoc IContactManager.cmGetContact} */
  private async cmGetContact(args: IGetContactArgs, context: IRequiredContext): Promise<IContact> {
    return this.store.getContact(args)
  }

  /** {@inheritDoc IContactManager.cmGetContacts} */
  private async cmGetContacts(args?: IGetContactsArgs): Promise<Array<IContact>> {
    return this.store.getContacts(args)
  }

  /** {@inheritDoc IContactManager.cmAddContact} */
  private async cmAddContact(args: IAddContactArgs, context: IRequiredContext): Promise<IContact> {
    return this.store.addContact(args)
  }

  /** {@inheritDoc IContactManager.cmUpdateContact} */
  private async cmUpdateContact(args: IUpdateContactArgs, context: IRequiredContext): Promise<IContact> {
    return this.store.updateContact(args)
  }

  /** {@inheritDoc IContactManager.cmRemoveContact} */
  private async cmRemoveContact(args: IRemoveContactArgs, context: IRequiredContext): Promise<boolean> {
    return this.store.removeContact(args).then(() => true)
  }

  /** {@inheritDoc IContactManager.cmGetIdentity} */
  private async cmGetIdentity(args: IGetIdentityArgs, context: IRequiredContext): Promise<IIdentity> {
    return this.store.getIdentity(args)
  }

  /** {@inheritDoc IContactManager.cmGetIdentities} */
  private async cmGetIdentities(args?: IGetIdentitiesArgs): Promise<Array<IIdentity>> {
    return this.store.getIdentities(args)
  }

  /** {@inheritDoc IContactManager.cmAddIdentity} */
  private async cmAddIdentity(args: IAddIdentityArgs, context: IRequiredContext): Promise<IIdentity> {
    return this.store.addIdentity(args)
  }

  /** {@inheritDoc IContactManager.cmUpdateIdentity} */
  private async cmUpdateIdentity(args: IUpdateIdentityArgs, context: IRequiredContext): Promise<IIdentity> {
    return this.store.updateIdentity(args)
  }

  /** {@inheritDoc IContactManager.cmRemoveIdentity} */
  private async cmRemoveIdentity(args: IRemoveIdentityArgs, context: IRequiredContext): Promise<boolean> {
    return this.store.removeIdentity(args).then(() => true)
  }

  /** {@inheritDoc IContactManager.cmAddRelationship} */
  private async cmAddRelationship(args: IAddRelationshipArgs, context: IRequiredContext): Promise<IContactRelationship> {
    return this.store.addRelationship(args)
  }

  /** {@inheritDoc IContactManager.cmRemoveRelationship} */
  private async cmRemoveRelationship(args: IRemoveRelationshipArgs, context: IRequiredContext): Promise<boolean> {
    return this.store.removeRelationship(args).then(() => true)
  }

  /** {@inheritDoc IContactManager.cmGetRelationship} */
  private async cmGetRelationship(args: IGetRelationshipArgs, context: IRequiredContext): Promise<IContactRelationship> {
    return this.store.getRelationship(args)
  }

  /** {@inheritDoc IContactManager.cmGetRelationships} */
  private async cmGetRelationships(args?: IGetRelationshipsArgs): Promise<Array<IContactRelationship>> {
    return this.store.getRelationships(args)
  }

  /** {@inheritDoc IContactManager.cmUpdateRelationship} */
  private async cmUpdateRelationship(args: IUpdateRelationshipArgs, context: IRequiredContext): Promise<IContactRelationship> {
    return this.store.updateRelationship(args)
  }

  /** {@inheritDoc IContactManager.cmGetContactType} */
  private async cmGetContactType(args: IGetContactTypeArgs, context: IRequiredContext): Promise<IContactType> {
    return this.store.getContactType(args)
  }

  /** {@inheritDoc IContactManager.cmGetContactTypes} */
  private async cmGetContactTypes(args?: IGetContactTypesArgs): Promise<Array<IContactType>> {
    return this.store.getContactTypes(args)
  }

  /** {@inheritDoc IContactManager.cmAddContactType} */
  private async cmAddContactType(args: IAddContactTypeArgs, context: IRequiredContext): Promise<IContactType> {
    return this.store.addContactType(args)
  }

  /** {@inheritDoc IContactManager.cmUpdateContactType} */
  private async cmUpdateContactType(args: IUpdateContactTypeArgs, context: IRequiredContext): Promise<IContactType> {
    return this.store.updateContactType(args)
  }

  /** {@inheritDoc IContactManager.cmRemoveContactType} */
  private async cmRemoveContactType(args: IRemoveContactTypeArgs, context: IRequiredContext): Promise<boolean> {
    return this.store.removeContactType(args).then(() => true)
  }
}
