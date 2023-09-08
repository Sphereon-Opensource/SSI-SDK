import { IAgentPlugin } from '@veramo/core'
import { schema } from '../index'
import {
  AddContactArgs,
  UpdateContactArgs,
  GetIdentitiesArgs,
  RemoveContactArgs,
  AddIdentityArgs,
  IContactManager,
  GetIdentityArgs,
  RemoveIdentityArgs,
  RequiredContext,
  UpdateIdentityArgs,
  GetContactsArgs,
  GetContactArgs,
  AddRelationshipArgs,
  RemoveRelationshipArgs,
  GetRelationshipArgs,
  GetRelationshipsArgs,
  UpdateRelationshipArgs,
  AddContactTypeArgs,
  GetContactTypeArgs,
  GetContactTypesArgs,
  RemoveContactTypeArgs,
  UpdateContactTypeArgs,
} from '../types/IContactManager'
import {
  AbstractContactStore,
  Party as Contact,
  Identity,
  PartyRelationship as ContactRelationship,
  PartyType as ContactType,
  NonPersistedContact,
  isNaturalPerson,
  isOrganization,
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
    cmRemoveContactType: this.cmRemoveContactType.bind(this),
  }

  private readonly store: AbstractContactStore

  constructor(options: { store: AbstractContactStore }) {
    this.store = options.store
  }

  /** {@inheritDoc IContactManager.cmGetContact} */
  private async cmGetContact(args: GetContactArgs, context: RequiredContext): Promise<Contact> {
    return this.store.getParty({ partyId: args.contactId })
  }

  /** {@inheritDoc IContactManager.cmGetContacts} */
  private async cmGetContacts(args?: GetContactsArgs): Promise<Array<Contact>> {
    return this.store.getParties(args)
  }

  /** {@inheritDoc IContactManager.cmAddContact} */
  private async cmAddContact(args: AddContactArgs, context: RequiredContext): Promise<Contact> {
    return this.store.addParty({
      uri: args.uri,
      partyType: args.contactType,
      contact: this.getContactInformationFrom(args),
      identities: args.identities,
      electronicAddresses: args.electronicAddresses,
    })
  }

  /** {@inheritDoc IContactManager.cmUpdateContact} */
  private async cmUpdateContact(args: UpdateContactArgs, context: RequiredContext): Promise<Contact> {
    return this.store.updateParty({ party: args.contact })
  }

  /** {@inheritDoc IContactManager.cmRemoveContact} */
  private async cmRemoveContact(args: RemoveContactArgs, context: RequiredContext): Promise<boolean> {
    return this.store.removeParty({ partyId: args.contactId }).then(() => true)
  }

  /** {@inheritDoc IContactManager.cmGetIdentity} */
  private async cmGetIdentity(args: GetIdentityArgs, context: RequiredContext): Promise<Identity> {
    return this.store.getIdentity(args)
  }

  /** {@inheritDoc IContactManager.cmGetIdentities} */
  private async cmGetIdentities(args?: GetIdentitiesArgs): Promise<Array<Identity>> {
    return this.store.getIdentities(args)
  }

  /** {@inheritDoc IContactManager.cmAddIdentity} */
  private async cmAddIdentity(args: AddIdentityArgs, context: RequiredContext): Promise<Identity> {
    return this.store.addIdentity({ partyId: args.contactId, identity: args.identity })
  }

  /** {@inheritDoc IContactManager.cmUpdateIdentity} */
  private async cmUpdateIdentity(args: UpdateIdentityArgs, context: RequiredContext): Promise<Identity> {
    return this.store.updateIdentity(args)
  }

  /** {@inheritDoc IContactManager.cmRemoveIdentity} */
  private async cmRemoveIdentity(args: RemoveIdentityArgs, context: RequiredContext): Promise<boolean> {
    return this.store.removeIdentity(args).then(() => true)
  }

  /** {@inheritDoc IContactManager.cmAddRelationship} */
  private async cmAddRelationship(args: AddRelationshipArgs, context: RequiredContext): Promise<ContactRelationship> {
    return this.store.addRelationship(args)
  }

  /** {@inheritDoc IContactManager.cmRemoveRelationship} */
  private async cmRemoveRelationship(args: RemoveRelationshipArgs, context: RequiredContext): Promise<boolean> {
    return this.store.removeRelationship(args).then(() => true)
  }

  /** {@inheritDoc IContactManager.cmGetRelationship} */
  private async cmGetRelationship(args: GetRelationshipArgs, context: RequiredContext): Promise<ContactRelationship> {
    return this.store.getRelationship(args)
  }

  /** {@inheritDoc IContactManager.cmGetRelationships} */
  private async cmGetRelationships(args?: GetRelationshipsArgs): Promise<Array<ContactRelationship>> {
    return this.store.getRelationships(args)
  }

  /** {@inheritDoc IContactManager.cmUpdateRelationship} */
  private async cmUpdateRelationship(args: UpdateRelationshipArgs, context: RequiredContext): Promise<ContactRelationship> {
    return this.store.updateRelationship(args)
  }

  /** {@inheritDoc IContactManager.cmGetContactType} */
  private async cmGetContactType(args: GetContactTypeArgs, context: RequiredContext): Promise<ContactType> {
    return this.store.getPartyType({ partyTypeId: args.contactTypeId })
  }

  /** {@inheritDoc IContactManager.cmGetContactTypes} */
  private async cmGetContactTypes(args?: GetContactTypesArgs): Promise<Array<ContactType>> {
    return this.store.getPartyTypes(args)
  }

  /** {@inheritDoc IContactManager.cmAddContactType} */
  private async cmAddContactType(args: AddContactTypeArgs, context: RequiredContext): Promise<ContactType> {
    return this.store.addPartyType(args)
  }

  /** {@inheritDoc IContactManager.cmUpdateContactType} */
  private async cmUpdateContactType(args: UpdateContactTypeArgs, context: RequiredContext): Promise<ContactType> {
    return this.store.updatePartyType({ partyType: args.contactType })
  }

  /** {@inheritDoc IContactManager.cmRemoveContactType} */
  private async cmRemoveContactType(args: RemoveContactTypeArgs, context: RequiredContext): Promise<boolean> {
    return this.store.removePartyType({ partyTypeId: args.contactTypeId }).then(() => true)
  }

  private getContactInformationFrom(contact: any): NonPersistedContact {
    if (isNaturalPerson(contact)) {
      return { firstName: contact.firstName, middleName: contact.middleName, lastName: contact.lastName, displayName: contact.displayName }
    } else if (isOrganization(contact)) {
      return { legalName: contact.legalName, displayName: contact.displayName }
    }

    throw new Error('Contact not supported')
  }

}
