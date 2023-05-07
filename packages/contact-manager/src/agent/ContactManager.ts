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
} from '../types/IContactManager'
import { IContact, IIdentity, AbstractContactStore } from '@sphereon/ssi-sdk.data-store'

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
  private async cmGetIdentities(args: IGetIdentitiesArgs, context: IRequiredContext): Promise<Array<IIdentity>> {
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
    return this.store.removeIdentity(args).then(() => true) // TODO
  }
}
