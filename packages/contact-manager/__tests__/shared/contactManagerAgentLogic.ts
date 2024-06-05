import { TAgent } from '@veramo/core'
import {
  CorrelationIdentifierType,
  ElectronicAddress,
  GetPartiesArgs,
  Identity,
  IdentityRole,
  NaturalPerson,
  NonPersistedElectronicAddress,
  NonPersistedIdentity,
  NonPersistedPhysicalAddress,
  Party,
  PartyOrigin,
  PartyRelationship,
  PartyTypeType,
  PhysicalAddress,
} from '../../../data-store/src'
import { AddContactArgs, IContactManager } from '../../src'

type ConfiguredAgent = TAgent<IContactManager>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }): void => {
  describe('Contact Manager Agent Plugin', (): void => {
    let agent: ConfiguredAgent
    let defaultContact: Party
    let defaultIdentity: Identity

    beforeAll(async (): Promise<void> => {
      await testContext.setup()
      agent = testContext.getAgent()

      const contact: AddContactArgs = {
        firstName: 'default_first_name',
        middleName: 'default_middle_name',
        lastName: 'default_last_name',
        displayName: 'default_display_name',
        contactType: {
          type: PartyTypeType.NATURAL_PERSON,
          origin: PartyOrigin.EXTERNAL,
          tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
          name: 'example_name',
        },
        uri: 'example.com',
      }
      const correlationId = 'default_example_did'
      const identity: NonPersistedIdentity = {
        alias: correlationId,
        roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
        identifier: {
          type: CorrelationIdentifierType.DID,
          correlationId,
        },
      }
      defaultContact = await agent.cmAddContact(contact)
      defaultIdentity = await agent.cmAddIdentity({ contactId: defaultContact.id, identity })
    })

    afterAll(testContext.tearDown)

    it('should get contact by id', async (): Promise<void> => {
      const result: Party = await agent.cmGetContact({ contactId: defaultContact.id })

      expect(result.id).toEqual(defaultContact.id)
    })

    it('should throw error when getting contact with unknown id', async (): Promise<void> => {
      const contactId = 'unknownContactId'

      await expect(agent.cmGetContact({ contactId })).rejects.toThrow(`No party found for id: ${contactId}`)
    })

    it('should get all contacts', async (): Promise<void> => {
      const result: Array<Party> = await agent.cmGetContacts()

      expect(result.length).toBeGreaterThan(0)
    })

    it('should get contacts by filter', async (): Promise<void> => {
      const args: GetPartiesArgs = {
        filter: [
          {
            partyType: {
              type: PartyTypeType.NATURAL_PERSON,
            },
          },
          {
            contact: {
              displayName: 'default_display_name',
            },
          },
          { uri: 'example.com' },
        ],
      }
      const result: Array<Party> = await agent.cmGetContacts(args)

      expect(result.length).toBe(1)
    })

    it('should get contacts by name', async (): Promise<void> => {
      const args: GetPartiesArgs = {
        filter: [
          { contact: { firstName: 'default_first_name' } },
          { contact: { middleName: 'default_middle_name' } },
          { contact: { lastName: 'default_last_name' } },
        ],
      }
      const result: Array<Party> = await agent.cmGetContacts(args)

      expect(result.length).toBe(1)
    })

    it('should get contacts by display name', async (): Promise<void> => {
      const args: GetPartiesArgs = {
        filter: [{ contact: { displayName: 'default_display_name' } }],
      }
      const result: Array<Party> = await agent.cmGetContacts(args)

      expect(result.length).toBe(1)
    })

    it('should get contacts by uri', async (): Promise<void> => {
      const args: GetPartiesArgs = {
        filter: [{ uri: 'example.com' }],
      }
      const result: Array<Party> = await agent.cmGetContacts(args)

      expect(result.length).toBe(1)
    })

    it('should return no contacts if filter does not match', async (): Promise<void> => {
      const args: GetPartiesArgs = {
        filter: [{ contact: { displayName: 'no_match_contact_display_name' } }, { uri: 'no_match_example.com' }],
      }
      const result: Array<Party> = await agent.cmGetContacts(args)

      expect(result.length).toBe(0)
    })

    it('should add contact', async (): Promise<void> => {
      const contact: AddContactArgs = {
        firstName: 'new_first_name',
        middleName: 'new_middle_name',
        lastName: 'new_last_name',
        displayName: 'new_display_name',
        contactType: {
          type: PartyTypeType.NATURAL_PERSON,
          origin: PartyOrigin.INTERNAL,
          tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
          name: 'new_name',
          description: 'new_description',
        },
        uri: 'example.com',
        electronicAddresses: [
          {
            type: 'email',
            electronicAddress: 'sphereon@sphereon.com',
          },
        ],
        physicalAddresses: [
          {
            type: 'home',
            streetName: 'example_street_name',
            streetNumber: 'example_street_number',
            buildingName: 'example_building_name',
            postalCode: 'example_postal_code',
            cityName: 'example_city_name',
            provinceName: 'example_province_name',
            countryCode: 'example_country_code',
          },
        ],
      }

      const result: Party = await agent.cmAddContact(contact)

      expect(result.partyType.type).toEqual(contact.contactType.type)
      expect(result.partyType.origin).toEqual(contact.contactType.origin)
      expect(result.partyType.name).toEqual(contact.contactType.name)
      expect(result.partyType.description).toEqual(contact.contactType.description)
      expect((<NaturalPerson>result.contact).firstName).toEqual(contact.firstName)
      expect((<NaturalPerson>result.contact).middleName).toEqual(contact.middleName)
      expect((<NaturalPerson>result.contact).lastName).toEqual(contact.lastName)
      expect((<NaturalPerson>result.contact).displayName).toEqual(contact.displayName)
      expect(result.uri).toEqual(contact.uri)
      expect(result.electronicAddresses).toBeDefined()
      expect(result.electronicAddresses.length).toEqual(1)
      expect(result.physicalAddresses).toBeDefined()
      expect(result.physicalAddresses.length).toEqual(1)
    })

    it('should update contact by id', async (): Promise<void> => {
      const contactFirstName = 'updated_contact_first_name'
      const contact: Party = {
        ...defaultContact,
        contact: {
          ...defaultContact.contact,
          firstName: contactFirstName,
        },
      }

      const result: Party = await agent.cmUpdateContact({ contact })

      expect((<NaturalPerson>result.contact).firstName).toEqual(contactFirstName)
    })

    it('should throw error when updating contact with unknown id', async (): Promise<void> => {
      const contactId = 'unknownContactId'
      const contact: Party = {
        ...defaultContact,
        id: contactId,
        contact: {
          ...defaultContact.contact,
          firstName: 'new_first_name',
        },
      }
      await expect(agent.cmUpdateContact({ contact })).rejects.toThrow(`No party found for id: ${contactId}`)
    })

    it('should get identity by id', async (): Promise<void> => {
      const result: Identity = await agent.cmGetIdentity({ identityId: defaultIdentity.id })

      expect(result.id).toEqual(defaultIdentity.id)
    })

    it('should throw error when getting identity with unknown id', async (): Promise<void> => {
      const identityId = 'b0b5b2f9-7d78-4533-8bc1-386e4f08dce1'

      await expect(
        agent.cmGetIdentity({
          identityId,
        }),
      ).rejects.toThrow(`No identity found for id: ${identityId}`)
    })

    it('should get all identities for contact', async (): Promise<void> => {
      const result: Array<Identity> = await agent.cmGetIdentities({ filter: [{ partyId: defaultContact.id }] })

      expect(result.length).toBeGreaterThan(0)
    })

    it('should add identity to contact', async (): Promise<void> => {
      const correlationId = 'new_example_did'
      const identity: NonPersistedIdentity = {
        alias: correlationId,
        roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
        identifier: {
          type: CorrelationIdentifierType.DID,
          correlationId,
        },
      }

      const result: Identity = await agent.cmAddIdentity({ contactId: defaultContact.id, identity })
      const contact: Party = await agent.cmGetContact({ contactId: defaultContact.id })

      expect(result).not.toBeNull()
      expect(contact.identities.length).toEqual(2)
    })

    it('should throw error when removing identity with unknown id', async (): Promise<void> => {
      const identityId = 'unknownIdentityId'

      await expect(agent.cmRemoveIdentity({ identityId })).rejects.toThrow(`No identity found for id: ${identityId}`)
    })

    it('should throw error when adding identity with invalid identifier', async (): Promise<void> => {
      const correlationId = 'missing_connection_add_example'
      const identity: NonPersistedIdentity = {
        alias: correlationId,
        roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
        identifier: {
          type: CorrelationIdentifierType.URL,
          correlationId,
        },
      }

      await expect(agent.cmAddIdentity({ contactId: defaultContact.id, identity })).rejects.toThrow(
        `Identity with correlation type url should contain a connection`,
      )
    })

    it('should throw error when updating identity with invalid identifier', async (): Promise<void> => {
      const correlationId = 'missing_connection_update_example'
      const identity: NonPersistedIdentity = {
        alias: correlationId,
        roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
        identifier: {
          type: CorrelationIdentifierType.DID,
          correlationId,
        },
      }
      const result: Identity = await agent.cmAddIdentity({ contactId: defaultContact.id, identity })
      result.identifier = { ...result.identifier, type: CorrelationIdentifierType.URL }

      await expect(agent.cmUpdateIdentity({ identity: result })).rejects.toThrow(`Identity with correlation type url should contain a connection`)
    })

    it('should update identity', async (): Promise<void> => {
      const correlationId = 'new_update_example_did'
      const identity: NonPersistedIdentity = {
        alias: 'update_example_did',
        roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
        identifier: {
          type: CorrelationIdentifierType.DID,
          correlationId: 'update_example_did',
        },
      }
      const result: Identity = await agent.cmAddIdentity({ contactId: defaultContact.id, identity })
      result.identifier = { ...result.identifier, correlationId }

      await agent.cmUpdateIdentity({ identity: result })
      const updatedIdentity: Identity = await agent.cmGetIdentity({ identityId: result.id })

      expect(updatedIdentity).not.toBeNull()
      expect(updatedIdentity.identifier.correlationId).toEqual(correlationId)
    })

    it('should add relationship', async (): Promise<void> => {
      const contact: AddContactArgs = {
        firstName: 'relation_first_name',
        middleName: 'relation_middle_name',
        lastName: 'relation_last_name',
        displayName: 'relation_display_name',
        contactType: {
          type: PartyTypeType.NATURAL_PERSON,
          origin: PartyOrigin.INTERNAL,
          tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d285',
          name: 'relation_contact_type_name',
          description: 'new_description',
        },
        uri: 'example.com',
      }

      const savedContact: Party = await agent.cmAddContact(contact)

      // FIXME why does this filter not work on only first name?
      const defaultContactFilter: GetPartiesArgs = {
        filter: [{ contact: { firstName: 'default_first_name' } }, { contact: { middleName: 'default_middle_name' } }],
      }
      const otherContacts: Array<Party> = await agent.cmGetContacts(defaultContactFilter)

      expect(otherContacts.length).toEqual(1)

      const relationship: PartyRelationship = await agent.cmAddRelationship({
        leftId: savedContact.id,
        rightId: otherContacts[0].id,
      })

      expect(relationship).toBeDefined()

      // FIXME why does this filter not work on only first name?
      const relationContactFilter: GetPartiesArgs = {
        filter: [{ contact: { firstName: 'relation_first_name' } }, { contact: { middleName: 'relation_middle_name' } }],
      }
      const result: Array<Party> = await agent.cmGetContacts(relationContactFilter)

      expect(result.length).toEqual(1)
      expect(result[0].relationships.length).toEqual(1)
      expect(result[0].relationships[0].leftId).toEqual(savedContact.id)
      expect(result[0].relationships[0].rightId).toEqual(otherContacts[0].id)
    })

    it('should remove relationship', async (): Promise<void> => {
      const contact: AddContactArgs = {
        firstName: 'remove_relation_first_name',
        middleName: 'remove_relation_middle_name',
        lastName: 'remove_relation_last_name',
        displayName: 'remove_relation_display_name',
        contactType: {
          type: PartyTypeType.NATURAL_PERSON,
          origin: PartyOrigin.EXTERNAL,
          tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d286',
          name: 'remove_relation_contact_type_name',
          description: 'new_description',
        },
        uri: 'example.com',
      }

      const savedContact: Party = await agent.cmAddContact(contact)

      // FIXME why does this filter not work on only first name?
      const defaultContactFilter: GetPartiesArgs = {
        filter: [{ contact: { firstName: 'default_first_name' } }, { contact: { middleName: 'default_middle_name' } }],
      }
      const otherContacts: Array<Party> = await agent.cmGetContacts(defaultContactFilter)

      expect(otherContacts.length).toEqual(1)

      const relationship: PartyRelationship = await agent.cmAddRelationship({
        leftId: savedContact.id,
        rightId: otherContacts[0].id,
      })

      expect(relationship).toBeDefined()

      // FIXME why does this filter not work on only first name?
      const relationContactFilter: GetPartiesArgs = {
        filter: [{ contact: { firstName: 'relation_first_name' } }, { contact: { middleName: 'relation_middle_name' } }],
      }
      const retrievedContact: Array<Party> = await agent.cmGetContacts(relationContactFilter)

      expect(retrievedContact.length).toEqual(1)
      expect(retrievedContact[0].relationships.length).toEqual(1)

      const removeRelationshipResult: boolean = await agent.cmRemoveRelationship({ relationshipId: relationship.id })
      expect(removeRelationshipResult).toBeTruthy()

      const result: Party = await agent.cmGetContact({ contactId: savedContact.id })

      expect(removeRelationshipResult).toEqual(true)
      expect(result.relationships.length).toEqual(0)
    })

    it('should add electronic address to contact', async (): Promise<void> => {
      const contact: AddContactArgs = {
        firstName: 'add_electronic_address_first_name',
        lastName: 'add_electronic_address_last_name',
        displayName: 'add_electronic_address_display_name',
        contactType: {
          type: PartyTypeType.NATURAL_PERSON,
          origin: PartyOrigin.INTERNAL,
          tenantId: 'a85a8aa0-fdeb-4c00-b22e-60423f52a873',
          name: 'add_electronic_address_name',
          description: 'add_electronic_address_description',
        },
      }

      const savedContact: Party = await agent.cmAddContact(contact)
      expect(savedContact).not.toBeNull()

      const electronicAddress: NonPersistedElectronicAddress = {
        type: 'email',
        electronicAddress: 'example_electronic_address',
      }

      const result: ElectronicAddress = await agent.cmAddElectronicAddress({ contactId: savedContact.id, electronicAddress })
      const contactResult: Party = await agent.cmGetContact({ contactId: savedContact.id })

      expect(result).not.toBeNull()
      expect(contactResult.electronicAddresses.length).toEqual(1)
    })

    it('should get electronic address by id', async (): Promise<void> => {
      const contact: AddContactArgs = {
        firstName: 'get_electronic_address_first_name',
        lastName: 'get_electronic_address_last_name',
        displayName: 'get_electronic_address_display_name',
        contactType: {
          type: PartyTypeType.NATURAL_PERSON,
          origin: PartyOrigin.EXTERNAL,
          tenantId: 'f2947075-53eb-4176-b155-ab4b18715288',
          name: 'get_electronic_address_name',
          description: 'get_electronic_address_description',
        },
      }

      const savedContact: Party = await agent.cmAddContact(contact)
      expect(savedContact).not.toBeNull()

      const electronicAddress: NonPersistedElectronicAddress = {
        type: 'email',
        electronicAddress: 'example_electronic_address',
      }

      const savedElectronicAddress: ElectronicAddress = await agent.cmAddElectronicAddress({ contactId: defaultContact.id, electronicAddress })
      const result: ElectronicAddress = await agent.cmGetElectronicAddress({ electronicAddressId: savedElectronicAddress.id })

      expect(result).not.toBeNull()
    })

    it('should get all electronic addresses for contact', async (): Promise<void> => {
      const contact: AddContactArgs = {
        firstName: 'get_all_electronic_address_first_name',
        lastName: 'get_all_electronic_address_last_name',
        displayName: 'get_all_electronic_address_display_name',
        contactType: {
          type: PartyTypeType.NATURAL_PERSON,
          origin: PartyOrigin.INTERNAL,
          tenantId: '5c0157ec-4678-4273-8f53-413bc6435134',
          name: 'get_all_electronic_address_name',
          description: 'get_all_electronic_address_description',
        },
      }

      const savedContact: Party = await agent.cmAddContact(contact)
      expect(savedContact).not.toBeNull()

      const electronicAddress: NonPersistedElectronicAddress = {
        type: 'email',
        electronicAddress: 'example_electronic_address',
      }

      await agent.cmAddElectronicAddress({ contactId: savedContact.id, electronicAddress })
      await agent.cmAddElectronicAddress({ contactId: savedContact.id, electronicAddress })
      const result: Array<ElectronicAddress> = await agent.cmGetElectronicAddresses({ filter: [{ partyId: savedContact.id }] })

      expect(result.length).toEqual(2)
    })

    it('should update electronic address', async (): Promise<void> => {
      const contact: AddContactArgs = {
        firstName: 'update_electronic_address_first_name',
        lastName: 'update_electronic_address_last_name',
        displayName: 'update_electronic_address_display_name',
        contactType: {
          type: PartyTypeType.NATURAL_PERSON,
          origin: PartyOrigin.EXTERNAL,
          tenantId: '6b64c3dd-cf40-4919-b8b8-2ec3c510c5b7',
          name: 'update_electronic_address_name',
          description: 'update_electronic_address_description',
        },
      }

      const savedContact: Party = await agent.cmAddContact(contact)
      expect(savedContact).not.toBeNull()

      const electronicAddress: NonPersistedElectronicAddress = {
        type: 'email',
        electronicAddress: 'example_electronic_address',
      }

      const savedElectronicAddress: ElectronicAddress = await agent.cmAddElectronicAddress({ contactId: savedContact.id, electronicAddress })

      const updatedElectronicAddress: ElectronicAddress = {
        ...savedElectronicAddress,
        electronicAddress: 'updated_electronic_address',
      }

      const result: ElectronicAddress = await agent.cmUpdateElectronicAddress({ electronicAddress: updatedElectronicAddress })

      expect(result).not.toBeNull()
      expect(result.id).toEqual(savedElectronicAddress.id)
      expect(result.electronicAddress).toEqual(updatedElectronicAddress.electronicAddress)
    })

    it('should remove electronic address', async (): Promise<void> => {
      const contact: AddContactArgs = {
        firstName: 'remove_electronic_address_first_name',
        lastName: 'remove_electronic_address_last_name',
        displayName: 'remove_electronic_address_display_name',
        contactType: {
          type: PartyTypeType.NATURAL_PERSON,
          origin: PartyOrigin.EXTERNAL,
          tenantId: '41b45c65-971e-4c26-8115-cb8bc7c67cf3',
          name: 'remove_electronic_address_name',
          description: 'remove_electronic_address_description',
        },
      }

      const savedContact: Party = await agent.cmAddContact(contact)
      expect(savedContact).not.toBeNull()

      const electronicAddress: NonPersistedElectronicAddress = {
        type: 'email',
        electronicAddress: 'example_electronic_address',
      }

      const savedElectronicAddress: ElectronicAddress = await agent.cmAddElectronicAddress({ contactId: savedContact.id, electronicAddress })

      const contactResultBeforeRemove: Party = await agent.cmGetContact({ contactId: savedContact.id })
      expect(contactResultBeforeRemove.electronicAddresses.length).toEqual(1)

      const removeElectronicAddressResult: boolean = await agent.cmRemoveElectronicAddress({ electronicAddressId: savedElectronicAddress.id })
      const contactResultAfterRemove: Party = await agent.cmGetContact({ contactId: savedContact.id })

      expect(removeElectronicAddressResult).toEqual(true)
      expect(contactResultAfterRemove.electronicAddresses.length).toEqual(0)
    })

    it('should add physical address to contact', async (): Promise<void> => {
      const contact: AddContactArgs = {
        firstName: 'add_physical_address_first_name',
        lastName: 'add_physical_address_last_name',
        displayName: 'add_physical_address_display_name',
        contactType: {
          type: PartyTypeType.NATURAL_PERSON,
          origin: PartyOrigin.INTERNAL,
          tenantId: '5aeb828e-16d6-4244-95a7-e12424474eb7',
          name: 'add_physical_address_name',
          description: 'add_physical_address_description',
        },
      }

      const savedContact: Party = await agent.cmAddContact(contact)
      expect(savedContact).not.toBeNull()

      const physicalAddress: NonPersistedPhysicalAddress = {
        type: 'home',
        streetName: 'example_street_name',
        streetNumber: 'example_street_number',
        buildingName: 'example_building_name',
        postalCode: 'example_postal_code',
        cityName: 'example_city_name',
        provinceName: 'example_province_name',
        countryCode: 'example_country_code',
      }

      const result: PhysicalAddress = await agent.cmAddPhysicalAddress({ contactId: savedContact.id, physicalAddress })
      const contactResult: Party = await agent.cmGetContact({ contactId: savedContact.id })

      expect(result).not.toBeNull()
      expect(contactResult.physicalAddresses.length).toEqual(1)
    })

    it('should get physical address by id', async (): Promise<void> => {
      const contact: AddContactArgs = {
        firstName: 'get_physical_address_first_name',
        lastName: 'get_physical_address_last_name',
        displayName: 'get_physical_address_display_name',
        contactType: {
          type: PartyTypeType.NATURAL_PERSON,
          origin: PartyOrigin.EXTERNAL,
          tenantId: '7c5dbbd9-1721-4246-b261-44e237560a15',
          name: 'get_physical_address_name',
          description: 'get_physical_address_description',
        },
      }

      const savedContact: Party = await agent.cmAddContact(contact)
      expect(savedContact).not.toBeNull()

      const physicalAddress: NonPersistedPhysicalAddress = {
        type: 'home',
        streetName: 'example_street_name',
        streetNumber: 'example_street_number',
        buildingName: 'example_building_name',
        postalCode: 'example_postal_code',
        cityName: 'example_city_name',
        provinceName: 'example_province_name',
        countryCode: 'example_country_code',
      }

      const savedPhysicalAddress: PhysicalAddress = await agent.cmAddPhysicalAddress({ contactId: savedContact.id, physicalAddress })
      const result: PhysicalAddress = await agent.cmGetPhysicalAddress({ physicalAddressId: savedPhysicalAddress.id })

      expect(result).not.toBeNull()
    })

    it('should get all physical addresses for contact', async (): Promise<void> => {
      const contact: AddContactArgs = {
        firstName: 'get_all_physical_address_first_name',
        lastName: 'get_all_physical_address_last_name',
        displayName: 'get_all_physical_address_display_name',
        contactType: {
          type: PartyTypeType.NATURAL_PERSON,
          origin: PartyOrigin.INTERNAL,
          tenantId: '0c0eafd8-1e8c-44bf-8e0d-768fb11a40c3',
          name: 'get_all_physical_address_name',
          description: 'get_all_physical_address_description',
        },
      }

      const savedContact: Party = await agent.cmAddContact(contact)
      expect(savedContact).not.toBeNull()

      const physicalAddress: NonPersistedPhysicalAddress = {
        type: 'home',
        streetName: 'example_street_name',
        streetNumber: 'example_street_number',
        buildingName: 'example_building_name',
        postalCode: 'example_postal_code',
        cityName: 'example_city_name',
        provinceName: 'example_province_name',
        countryCode: 'example_country_code',
      }

      await agent.cmAddPhysicalAddress({ contactId: savedContact.id, physicalAddress })
      await agent.cmAddPhysicalAddress({ contactId: savedContact.id, physicalAddress })
      const result: Array<PhysicalAddress> = await agent.cmGetPhysicalAddresses({ filter: [{ partyId: savedContact.id }] })

      expect(result.length).toEqual(2)
    })

    it('should update physical address', async (): Promise<void> => {
      const contact: AddContactArgs = {
        firstName: 'update_physical_address_first_name',
        lastName: 'update_physical_address_last_name',
        displayName: 'update_physical_address_display_name',
        contactType: {
          type: PartyTypeType.NATURAL_PERSON,
          origin: PartyOrigin.INTERNAL,
          tenantId: 'f2b4eb1c-e36f-4863-90b3-90720471c397',
          name: 'update_physical_address_name',
          description: 'update_physical_address_description',
        },
      }

      const savedContact: Party = await agent.cmAddContact(contact)
      expect(savedContact).not.toBeNull()

      const physicalAddress: NonPersistedPhysicalAddress = {
        type: 'home',
        streetName: 'example_street_name',
        streetNumber: 'example_street_number',
        buildingName: 'example_building_name',
        postalCode: 'example_postal_code',
        cityName: 'example_city_name',
        provinceName: 'example_province_name',
        countryCode: 'example_country_code',
      }

      const savedPhysicalAddress: PhysicalAddress = await agent.cmAddPhysicalAddress({ contactId: savedContact.id, physicalAddress })

      const updatedPhysicalAddress: PhysicalAddress = {
        ...savedPhysicalAddress,
        streetName: 'updated_street_name',
        streetNumber: 'updated_street_number',
        buildingName: 'updated_building_name',
        postalCode: 'updated_postal_code',
        cityName: 'updated_city_name',
        provinceName: 'updated_province_name',
        countryCode: 'updated_country_code',
      }

      const result: PhysicalAddress = await agent.cmUpdatePhysicalAddress({ physicalAddress: updatedPhysicalAddress })

      expect(result).not.toBeNull()
      expect(result.id).toEqual(savedPhysicalAddress.id)
      expect(result.streetName).toEqual(updatedPhysicalAddress.streetName)
      expect(result.streetNumber).toEqual(updatedPhysicalAddress.streetNumber)
      expect(result.buildingName).toEqual(updatedPhysicalAddress.buildingName)
      expect(result.postalCode).toEqual(updatedPhysicalAddress.postalCode)
      expect(result.cityName).toEqual(updatedPhysicalAddress.cityName)
      expect(result.provinceName).toEqual(updatedPhysicalAddress.provinceName)
      expect(result.countryCode).toEqual(updatedPhysicalAddress.countryCode)
    })

    it('should remove physical address', async (): Promise<void> => {
      const contact: AddContactArgs = {
        firstName: 'remove_physical_address_first_name',
        lastName: 'remove_physical_address_last_name',
        displayName: 'remove_physical_address_display_name',
        contactType: {
          type: PartyTypeType.NATURAL_PERSON,
          origin: PartyOrigin.INTERNAL,
          tenantId: '20b11d1e-6489-4258-af33-32a2cfa4dc85',
          name: 'remove_physical_address_name',
          description: 'remove_physical_address_description',
        },
      }

      const savedContact: Party = await agent.cmAddContact(contact)
      expect(savedContact).not.toBeNull()

      const physicalAddress: NonPersistedPhysicalAddress = {
        type: 'home',
        streetName: 'example_street_name',
        streetNumber: 'example_street_number',
        buildingName: 'example_building_name',
        postalCode: 'example_postal_code',
        cityName: 'example_city_name',
        provinceName: 'example_province_name',
        countryCode: 'example_country_code',
      }

      const savedPhysicalAddress: PhysicalAddress = await agent.cmAddPhysicalAddress({ contactId: savedContact.id, physicalAddress })

      const contactResultBeforeRemove: Party = await agent.cmGetContact({ contactId: savedContact.id })
      expect(contactResultBeforeRemove.physicalAddresses.length).toEqual(1)

      const removePhysicalAddressResult: boolean = await agent.cmRemovePhysicalAddress({ physicalAddressId: savedPhysicalAddress.id })
      const contactResultAfterRemove: Party = await agent.cmGetContact({ contactId: savedContact.id })

      expect(removePhysicalAddressResult).toEqual(true)
      expect(contactResultAfterRemove.physicalAddresses.length).toEqual(0)
    })
  })
}
