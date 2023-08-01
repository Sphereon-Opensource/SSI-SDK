import { TAgent } from '@veramo/core'
import { IContactManager } from '../../src'
import {
  BasicPerson,
  ContactTypeEnum,
  CorrelationIdentifierEnum,
  IBasicContact,
  IBasicIdentity,
  IContact,
  IdentityRoleEnum,
  IIdentity,
  IPerson,
  IGetContactsArgs,
  IContactRelationship,
} from '../../../data-store/src'

type ConfiguredAgent = TAgent<IContactManager>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }): void => {
  describe('Contact Manager Agent Plugin', (): void => {
    let agent: ConfiguredAgent
    let defaultContact: IContact
    let defaultIdentity: IIdentity

    beforeAll(async (): Promise<void> => {
      await testContext.setup()
      agent = testContext.getAgent()

      const contact: IBasicContact = {
        contactType: {
          type: ContactTypeEnum.PERSON,
          tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
          name: 'example_name',
        },
        contactOwner: {
          firstName: 'default_first_name',
          middleName: 'default_middle_name',
          lastName: 'default_last_name',
          displayName: 'default_display_name',
        },
        uri: 'example.com',
      }
      const correlationId = 'default_example_did'
      const identity: IBasicIdentity = {
        alias: correlationId,
        roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
        identifier: {
          type: CorrelationIdentifierEnum.DID,
          correlationId,
        },
      }
      defaultContact = await agent.cmAddContact(contact)
      defaultIdentity = await agent.cmAddIdentity({ contactId: defaultContact.id, identity })
    })

    afterAll(testContext.tearDown)

    it('should get contact by id', async (): Promise<void> => {
      const result: IContact = await agent.cmGetContact({ contactId: defaultContact.id })

      expect(result.id).toEqual(defaultContact.id)
    })

    it('should throw error when getting contact with unknown id', async (): Promise<void> => {
      const contactId = 'unknownContactId'

      await expect(agent.cmGetContact({ contactId })).rejects.toThrow(`No contact found for id: ${contactId}`)
    })

    it('should get all contacts', async (): Promise<void> => {
      const result: Array<IContact> = await agent.cmGetContacts()

      expect(result.length).toBeGreaterThan(0)
    })

    it('should get contacts by filter', async (): Promise<void> => {
      const args: IGetContactsArgs = {
        filter: [
          {
            contactType: {
              type: ContactTypeEnum.PERSON,
            },
          },
          {
            contactOwner: {
              displayName: 'default_display_name',
            },
          },
          { uri: 'example.com' },
        ],
      }
      const result: Array<IContact> = await agent.cmGetContacts(args)

      expect(result.length).toBe(1)
    })

    it('should get contacts by name', async (): Promise<void> => {
      const args: IGetContactsArgs = {
        filter: [
          { contactOwner: { firstName: 'default_first_name' } },
          { contactOwner: { middleName: 'default_middle_name' } },
          { contactOwner: { lastName: 'default_last_name' } },
        ],
      }
      const result: Array<IContact> = await agent.cmGetContacts(args)

      expect(result.length).toBe(1)
    })

    it('should get contacts by display name', async (): Promise<void> => {
      const args: IGetContactsArgs = {
        filter: [{ contactOwner: { displayName: 'default_display_name' } }],
      }
      const result: Array<IContact> = await agent.cmGetContacts(args)

      expect(result.length).toBe(1)
    })

    it('should get contacts by uri', async (): Promise<void> => {
      const args: IGetContactsArgs = {
        filter: [{ uri: 'example.com' }],
      }
      const result: Array<IContact> = await agent.cmGetContacts(args)

      expect(result.length).toBe(1)
    })

    it('should return no contacts if filter does not match', async (): Promise<void> => {
      const args: IGetContactsArgs = {
        filter: [{ contactOwner: { displayName: 'no_match_contact_display_name' } }, { uri: 'no_match_example.com' }],
      }
      const result: Array<IContact> = await agent.cmGetContacts(args)

      expect(result.length).toBe(0)
    })

    it('should add contact', async (): Promise<void> => {
      const contact: IBasicContact = {
        contactType: {
          type: ContactTypeEnum.PERSON,
          tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
          name: 'new_name',
          description: 'new_description',
        },
        contactOwner: {
          firstName: 'new_first_name',
          middleName: 'new_middle_name',
          lastName: 'new_last_name',
          displayName: 'new_display_name',
        },
        uri: 'example.com',
      }

      const result: IContact = await agent.cmAddContact(contact)

      expect(result.contactType.type).toEqual(contact.contactType.type)
      expect(result.contactType.name).toEqual(contact.contactType.name)
      expect(result.contactType.description).toEqual(contact.contactType.description)
      expect((<IPerson>result.contactOwner).firstName).toEqual((<BasicPerson>contact.contactOwner).firstName)
      expect((<IPerson>result.contactOwner).middleName).toEqual((<BasicPerson>contact.contactOwner).middleName)
      expect((<IPerson>result.contactOwner).lastName).toEqual((<BasicPerson>contact.contactOwner).lastName)
      expect((<IPerson>result.contactOwner).displayName).toEqual((<BasicPerson>contact.contactOwner).displayName)
      expect(result.uri).toEqual(contact.uri)
    })

    it('should throw error when adding contact with duplicate display name', async (): Promise<void> => {
      const displayName = 'default_display_name'
      const contact: IBasicContact = {
        contactType: {
          type: ContactTypeEnum.PERSON,
          tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d287',
          name: 'example_name2',
        },
        contactOwner: {
          firstName: 'default_first_name2',
          middleName: 'default_middle_name2',
          lastName: 'default_last_name2',
          displayName,
        },
        uri: 'example.com',
      }

      await expect(agent.cmAddContact(contact)).rejects.toThrow(`Duplicate names or display are not allowed. Display name: ${displayName}`)
    })

    it('should update contact by id', async (): Promise<void> => {
      const contactFirstName = 'updated_contact_first_name'
      const contact: IContact = {
        ...defaultContact,
        contactOwner: {
          ...defaultContact.contactOwner,
          firstName: contactFirstName,
        },
      }

      const result: IContact = await agent.cmUpdateContact({ contact })

      expect((<IPerson>result.contactOwner).firstName).toEqual(contactFirstName)
    })

    it('should throw error when updating contact with unknown id', async (): Promise<void> => {
      const contactId = 'unknownContactId'
      const contact: IContact = {
        ...defaultContact,
        id: contactId,
        contactOwner: {
          ...defaultContact.contactOwner,
          firstName: 'new_first_name',
        },
      }
      await expect(agent.cmUpdateContact({ contact })).rejects.toThrow(`No contact found for id: ${contactId}`)
    })

    it('should get identity by id', async (): Promise<void> => {
      const result: IIdentity = await agent.cmGetIdentity({ identityId: defaultIdentity.id })

      expect(result.id).toEqual(defaultIdentity.id)
    })

    it('should throw error when getting identity with unknown id', async (): Promise<void> => {
      const identityId = 'b0b5b2f9-7d78-4533-8bc1-386e4f08dce1'

      await expect(
        agent.cmGetIdentity({
          identityId,
        })
      ).rejects.toThrow(`No identity found for id: ${identityId}`)
    })

    it('should get all identities for contact', async (): Promise<void> => {
      const result: Array<IIdentity> = await agent.cmGetIdentities({ filter: [{ contactId: defaultContact.id }] })

      expect(result.length).toBeGreaterThan(0)
    })

    it('should add identity to contact', async (): Promise<void> => {
      const correlationId = 'new_example_did'
      const identity: IBasicIdentity = {
        alias: correlationId,
        roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
        identifier: {
          type: CorrelationIdentifierEnum.DID,
          correlationId,
        },
      }

      const result: IIdentity = await agent.cmAddIdentity({ contactId: defaultContact.id, identity })
      const contact: IContact = await agent.cmGetContact({ contactId: defaultContact.id })

      expect(result).not.toBeNull()
      expect(contact.identities.length).toEqual(2)
    })

    it('should throw error when removing identity with unknown id', async (): Promise<void> => {
      const identityId = 'unknownIdentityId'

      await expect(agent.cmRemoveIdentity({ identityId })).rejects.toThrow(`No identity found for id: ${identityId}`)
    })

    it('should throw error when adding identity with invalid identifier', async (): Promise<void> => {
      const correlationId = 'missing_connection_add_example'
      const identity: IBasicIdentity = {
        alias: correlationId,
        roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
        identifier: {
          type: CorrelationIdentifierEnum.URL,
          correlationId,
        },
      }

      await expect(agent.cmAddIdentity({ contactId: defaultContact.id, identity })).rejects.toThrow(
        `Identity with correlation type url should contain a connection`
      )
    })

    it('should throw error when updating identity with invalid identifier', async (): Promise<void> => {
      const correlationId = 'missing_connection_update_example'
      const identity: IBasicIdentity = {
        alias: correlationId,
        roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
        identifier: {
          type: CorrelationIdentifierEnum.DID,
          correlationId,
        },
      }
      const result: IIdentity = await agent.cmAddIdentity({ contactId: defaultContact.id, identity })
      result.identifier = { ...result.identifier, type: CorrelationIdentifierEnum.URL }

      await expect(agent.cmUpdateIdentity({ identity: result })).rejects.toThrow(`Identity with correlation type url should contain a connection`)
    })

    it('should update identity', async (): Promise<void> => {
      const correlationId = 'new_update_example_did'
      const identity: IBasicIdentity = {
        alias: 'update_example_did',
        roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
        identifier: {
          type: CorrelationIdentifierEnum.DID,
          correlationId: 'update_example_did',
        },
      }
      const result: IIdentity = await agent.cmAddIdentity({ contactId: defaultContact.id, identity })
      result.identifier = { ...result.identifier, correlationId }

      await agent.cmUpdateIdentity({ identity: result })
      const updatedIdentity: IIdentity = await agent.cmGetIdentity({ identityId: result.id })

      expect(updatedIdentity).not.toBeNull()
      expect(updatedIdentity.identifier.correlationId).toEqual(correlationId)
    })

    it('should add relationship', async (): Promise<void> => {
      const contact: IBasicContact = {
        contactType: {
          type: ContactTypeEnum.PERSON,
          tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d287',
          name: 'relation_contact_type_name',
          description: 'new_description',
        },
        contactOwner: {
          firstName: 'relation_first_name',
          middleName: 'relation_middle_name',
          lastName: 'relation_last_name',
          displayName: 'relation_display_name',
        },
        uri: 'example.com',
      }

      const savedContact: IContact = await agent.cmAddContact(contact)

      // TODO why does this filter not work on only first name?
      const args1: IGetContactsArgs = {
        filter: [
          { contactOwner: { firstName: 'default_first_name' } },
          { contactOwner: { middleName: 'default_middle_name' } },
          // { contactOwner: { lastName: 'default_last_name'} },
        ],
      }
      const otherContacts: Array<IContact> = await agent.cmGetContacts(args1)

      expect(otherContacts.length).toEqual(1)

      const relationship: IContactRelationship = await agent.cmAddRelationship({
        leftId: savedContact.id,
        rightId: otherContacts[0].id,
      })

      expect(relationship).toBeDefined()

      // TODO why does this filter not work on only first name?
      const args2: IGetContactsArgs = {
        filter: [
          { contactOwner: { firstName: 'relation_first_name' } },
          { contactOwner: { middleName: 'relation_middle_name' } },
          // { contactOwner: { lastName: 'default_last_name'} },
        ],
      }
      const result: Array<IContact> = await agent.cmGetContacts(args2)

      expect(result.length).toEqual(1)
      expect(result[0].relationships.length).toEqual(1)
      expect(result[0].relationships[0].leftId).toEqual(savedContact.id)
      expect(result[0].relationships[0].rightId).toEqual(otherContacts[0].id)
    })

    it('should remove relationship', async (): Promise<void> => {
      const contact: IBasicContact = {
        contactType: {
          type: ContactTypeEnum.PERSON,
          tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d286',
          name: 'remove_relation_contact_type_name',
          description: 'new_description',
        },
        contactOwner: {
          firstName: 'remove_relation_first_name',
          middleName: 'remove_relation_middle_name',
          lastName: 'remove_relation_last_name',
          displayName: 'remove_relation_display_name',
        },
        uri: 'example.com',
      }

      const savedContact: IContact = await agent.cmAddContact(contact)

      // TODO why does this filter not work on only first name?
      const args1: IGetContactsArgs = {
        filter: [
          { contactOwner: { firstName: 'default_first_name' } },
          { contactOwner: { middleName: 'default_middle_name' } },
          // { contactOwner: { lastName: 'default_last_name'} },
        ],
      }
      const otherContacts: Array<IContact> = await agent.cmGetContacts(args1)

      expect(otherContacts.length).toEqual(1)

      const relationship: IContactRelationship = await agent.cmAddRelationship({
        leftId: savedContact.id,
        rightId: otherContacts[0].id,
      })

      expect(relationship).toBeDefined()

      // TODO why does this filter not work on only first name?
      const args2: IGetContactsArgs = {
        filter: [
          { contactOwner: { firstName: 'relation_first_name' } },
          { contactOwner: { middleName: 'relation_middle_name' } },
          // { contactOwner: { lastName: 'default_last_name'} },
        ],
      }
      const retrievedContact: Array<IContact> = await agent.cmGetContacts(args2)

      expect(retrievedContact.length).toEqual(1)
      expect(retrievedContact[0].relationships.length).toEqual(1)
      // expect(result[0].relationships[0].leftContactId).toEqual(savedContact.id)
      // expect(result[0].relationships[0].rightContactId).toEqual(otherContacts[0].id)

      const removeRelationshipResult: boolean = await agent.cmRemoveRelationship({ relationshipId: relationship.id })
      expect(removeRelationshipResult).toBeTruthy()

      const result: IContact = await agent.cmGetContact({ contactId: savedContact.id })

      expect(result.relationships.length).toEqual(0)
    })

    // TODO test all new crud functions

    // remove relation
  })
}
