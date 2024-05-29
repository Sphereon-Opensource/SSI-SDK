import {
  AbstractContactStore,
  BaseContactEntity,
  ElectronicAddress,
  Identity,
  NonPersistedContact,
  Party as Contact,
  PartyRelationship as ContactRelationship,
  PartyType as ContactType,
  PhysicalAddress,
  isNaturalPerson,
  isOrganization,
} from '@sphereon/ssi-sdk.data-store'
import { IAgentPlugin } from '@veramo/core'
import { schema } from '../index'
import {
  AddContactArgs,
  AddContactTypeArgs,
  AddElectronicAddressArgs,
  AddIdentityArgs,
  AddPhysicalAddressArgs,
  AddRelationshipArgs,
  GetContactArgs,
  GetContactTypeArgs,
  GetContactTypesArgs,
  GetContactsArgs,
  GetElectronicAddressArgs,
  GetElectronicAddressesArgs,
  GetIdentitiesArgs,
  GetIdentityArgs,
  GetPhysicalAddressArgs,
  GetPhysicalAddressesArgs,
  GetRelationshipArgs,
  GetRelationshipsArgs,
  IContactManager,
  RemoveContactArgs,
  RemoveContactTypeArgs,
  RemoveElectronicAddressArgs,
  RemoveIdentityArgs,
  RemovePhysicalAddressArgs,
  RemoveRelationshipArgs,
  RequiredContext,
  UpdateContactArgs,
  UpdateContactTypeArgs,
  UpdateElectronicAddressArgs,
  UpdateIdentityArgs,
  UpdatePhysicalAddressArgs,
  UpdateRelationshipArgs,
} from '../types/IContactManager'

// Exposing the methods here for any REST implementation
export const contactManagerMethods: Array<string> = [
  'cmGetContact',
  'cmGetContacts',
  'cmAddContact',
  'cmUpdateContact',
  'cmRemoveContact',
  'cmGetIdentity',
  'cmGetIdentities',
  'cmAddIdentity',
  'cmUpdateIdentity',
  'cmRemoveIdentity',
  'cmAddRelationship',
  'cmRemoveRelationship',
  'cmGetRelationship',
  'cmGetRelationships',
  'cmUpdateRelationship',
  'cmGetContactType',
  'cmGetContactTypes',
  'cmAddContactType',
  'cmUpdateContactType',
  'cmRemoveContactType',
  'cmGetElectronicAddress',
  'cmGetElectronicAddresses',
  'cmAddElectronicAddress',
  'cmUpdateElectronicAddress',
  'cmRemoveElectronicAddress',
  'cmGetPhysicalAddress',
  'cmGetPhysicalAddresses',
  'cmAddPhysicalAddress',
  'cmUpdatePhysicalAddress',
  'cmRemovePhysicalAddress',
]

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
    cmGetElectronicAddress: this.cmGetElectronicAddress.bind(this),
    cmGetElectronicAddresses: this.cmGetElectronicAddresses.bind(this),
    cmAddElectronicAddress: this.cmAddElectronicAddress.bind(this),
    cmUpdateElectronicAddress: this.cmUpdateElectronicAddress.bind(this),
    cmRemoveElectronicAddress: this.cmRemoveElectronicAddress.bind(this),
    cmGetPhysicalAddress: this.cmGetPhysicalAddress.bind(this),
    cmGetPhysicalAddresses: this.cmGetPhysicalAddresses.bind(this),
    cmAddPhysicalAddress: this.cmAddPhysicalAddress.bind(this),
    cmUpdatePhysicalAddress: this.cmUpdatePhysicalAddress.bind(this),
    cmRemovePhysicalAddress: this.cmRemovePhysicalAddress.bind(this),
  }

  private readonly store: AbstractContactStore

  constructor(options: { store: AbstractContactStore }) {
    this.store = options.store
  }

  /** {@inheritDoc IContactManager.cmGetContact} */
  private async cmGetContact(args: GetContactArgs, context: RequiredContext): Promise<Contact> {
    const { contactId } = args
    return this.store.getParty({ partyId: contactId })
  }

  /** {@inheritDoc IContactManager.cmGetContacts} */
  private async cmGetContacts(args?: GetContactsArgs): Promise<Array<Contact>> {
    return this.store.getParties(args)
  }

  /** {@inheritDoc IContactManager.cmAddContact} */
  private async cmAddContact(args: AddContactArgs, context: RequiredContext): Promise<Contact> {
    const { uri, contactType, identities, electronicAddresses, physicalAddresses } = args

    return this.store.addParty({
      uri,
      partyType: contactType,
      contact: this.getContactInformationFrom(args),
      identities,
      electronicAddresses,
      physicalAddresses,
    })
  }

  /** {@inheritDoc IContactManager.cmUpdateContact} */
  private async cmUpdateContact(args: UpdateContactArgs, context: RequiredContext): Promise<Contact> {
    const { contact } = args
    return this.store.updateParty({ party: contact })
  }

  /** {@inheritDoc IContactManager.cmRemoveContact} */
  private async cmRemoveContact(args: RemoveContactArgs, context: RequiredContext): Promise<boolean> {
    const { contactId } = args
    return this.store.removeParty({ partyId: contactId }).then((): boolean => true)
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
    const { contactId, identity } = args
    return this.store.addIdentity({ partyId: contactId, identity })
  }

  /** {@inheritDoc IContactManager.cmUpdateIdentity} */
  private async cmUpdateIdentity(args: UpdateIdentityArgs, context: RequiredContext): Promise<Identity> {
    return this.store.updateIdentity(args)
  }

  /** {@inheritDoc IContactManager.cmRemoveIdentity} */
  private async cmRemoveIdentity(args: RemoveIdentityArgs, context: RequiredContext): Promise<boolean> {
    return this.store.removeIdentity(args).then((): boolean => true)
  }

  /** {@inheritDoc IContactManager.cmAddRelationship} */
  private async cmAddRelationship(args: AddRelationshipArgs, context: RequiredContext): Promise<ContactRelationship> {
    return this.store.addRelationship(args)
  }

  /** {@inheritDoc IContactManager.cmRemoveRelationship} */
  private async cmRemoveRelationship(args: RemoveRelationshipArgs, context: RequiredContext): Promise<boolean> {
    return this.store.removeRelationship(args).then((): boolean => true)
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
    const { contactTypeId } = args
    return this.store.getPartyType({ partyTypeId: contactTypeId })
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
    const { contactType } = args
    return this.store.updatePartyType({ partyType: contactType })
  }

  /** {@inheritDoc IContactManager.cmRemoveContactType} */
  private async cmRemoveContactType(args: RemoveContactTypeArgs, context: RequiredContext): Promise<boolean> {
    const { contactTypeId } = args
    return this.store.removePartyType({ partyTypeId: contactTypeId }).then((): boolean => true)
  }

  /** {@inheritDoc IContactManager.cmGetElectronicAddress} */
  private async cmGetElectronicAddress(args: GetElectronicAddressArgs, context: RequiredContext): Promise<ElectronicAddress> {
    return this.store.getElectronicAddress(args)
  }

  /** {@inheritDoc IContactManager.cmGetElectronicAddresses} */
  private async cmGetElectronicAddresses(args?: GetElectronicAddressesArgs): Promise<Array<ElectronicAddress>> {
    return this.store.getElectronicAddresses(args)
  }

  /** {@inheritDoc IContactManager.cmAddElectronicAddress} */
  private async cmAddElectronicAddress(args: AddElectronicAddressArgs): Promise<ElectronicAddress> {
    const { contactId, electronicAddress } = args
    return this.store.addElectronicAddress({ partyId: contactId, electronicAddress })
  }

  /** {@inheritDoc IContactManager.cmUpdateElectronicAddress} */
  private async cmUpdateElectronicAddress(args: UpdateElectronicAddressArgs): Promise<ElectronicAddress> {
    return this.store.updateElectronicAddress(args)
  }

  /** {@inheritDoc IContactManager.cmRemoveElectronicAddress} */
  private async cmRemoveElectronicAddress(args: RemoveElectronicAddressArgs): Promise<boolean> {
    return this.store.removeElectronicAddress(args).then((): boolean => true)
  }

  /** {@inheritDoc IContactManager.cmGetPhysicalAddress} */
  private async cmGetPhysicalAddress(args: GetPhysicalAddressArgs): Promise<PhysicalAddress> {
    return this.store.getPhysicalAddress(args)
  }

  /** {@inheritDoc IContactManager.cmGetPhysicalAddresses} */
  private async cmGetPhysicalAddresses(args?: GetPhysicalAddressesArgs): Promise<Array<PhysicalAddress>> {
    return this.store.getPhysicalAddresses(args)
  }

  /** {@inheritDoc IContactManager.cmAddPhysicalAddress} */
  private async cmAddPhysicalAddress(args: AddPhysicalAddressArgs): Promise<PhysicalAddress> {
    const { contactId, physicalAddress } = args
    return this.store.addPhysicalAddress({ partyId: contactId, physicalAddress })
  }

  /** {@inheritDoc IContactManager.cmUpdatePhysicalAddress} */
  private async cmUpdatePhysicalAddress(args: UpdatePhysicalAddressArgs): Promise<PhysicalAddress> {
    return this.store.updatePhysicalAddress(args)
  }

  /** {@inheritDoc IContactManager.cmRemovePhysicalAddress} */
  private async cmRemovePhysicalAddress(args: RemovePhysicalAddressArgs): Promise<boolean> {
    return this.store.removePhysicalAddress(args).then((): boolean => true)
  }

  private getContactInformationFrom(contact: NonPersistedContact | BaseContactEntity): NonPersistedContact {
    if (isNaturalPerson(contact)) {
      return { firstName: contact.firstName, middleName: contact.middleName, lastName: contact.lastName, displayName: contact.displayName }
    } else if (isOrganization(contact)) {
      return { legalName: contact.legalName, displayName: contact.displayName }
    }

    throw new Error('Contact not supported')
  }
}
