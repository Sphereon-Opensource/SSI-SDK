import { TAgent } from '@veramo/core'
import { IContactManager } from '../../src/types/IContactManager'
import { CorrelationIdentifierEnum, IContact, IdentityRoleEnum, IIdentity } from '../../../data-store/src'

type ConfiguredAgent = TAgent<IContactManager>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }) => {
  describe('Contact Manager Agent Plugin', () => {
    let agent: ConfiguredAgent
    let defaultContact: IContact
    let defaultIdentity: IIdentity

    beforeAll(async () => {
      await testContext.setup()
      agent = testContext.getAgent()

      const contact = {
        name: 'default_contact',
        alias: 'default_contact_alias',
        uri: 'example.com',
      }
      const correlationId = 'default_example_did'
      const identity = {
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

    it('should get contact by id', async () => {
      const result = await agent.cmGetContact({ contactId: defaultContact.id })

      expect(result.id).toEqual(defaultContact.id)
    })

    it('should throw error when getting contact with unknown id', async () => {
      const contactId = 'unknownContactId'

      await expect(agent.cmGetContact({ contactId })).rejects.toThrow(`No contact found for id: ${contactId}`)
    })

    it('should get all contacts', async () => {
      const result = await agent.cmGetContacts()

      expect(result.length).toBeGreaterThan(0)
    })

    it('should get contacts by filter', async () => {
      const args = {
        filter: [{ name: 'default_contact' }, { alias: 'default_contact_alias' }, { uri: 'example.com' }],
      }
      const result = await agent.cmGetContacts(args)

      expect(result.length).toBe(1)
    })

    it('should get contacts by name', async () => {
      const args = {
        filter: [{ name: 'default_contact' }],
      }
      const result = await agent.cmGetContacts(args)

      expect(result.length).toBe(1)
    })

    it('should get contacts by alias', async () => {
      const args = {
        filter: [{ alias: 'default_contact_alias' }],
      }
      const result = await agent.cmGetContacts(args)

      expect(result.length).toBe(1)
    })

    it('should get contacts by uri', async () => {
      const args = {
        filter: [{ uri: 'example.com' }],
      }
      const result = await agent.cmGetContacts(args)

      expect(result.length).toBe(1)
    })

    it('should return no contacts if filter does not match', async () => {
      const args = {
        filter: [{ name: 'no_match_contact' }, { alias: 'no_match_contact_alias' }, { uri: 'no_match_example.com' }],
      }
      const result = await agent.cmGetContacts(args)

      expect(result.length).toBe(0)
    })

    it('should add contact', async () => {
      const contact = {
        name: 'new_contact',
        alias: 'new_contact_alias',
        uri: 'example.com',
      }

      const result = await agent.cmAddContact(contact)

      expect(result.name).toEqual(contact.name)
      expect(result.alias).toEqual(contact.alias)
      expect(result.uri).toEqual(contact.uri)
    })

    it('should throw error when adding contact with duplicate name', async () => {
      const name = 'default_contact'
      const alias = 'default_contact_new_alias'
      const contact = {
        name,
        alias,
        uri: 'example.com',
      }

      await expect(agent.cmAddContact(contact)).rejects.toThrow(`Duplicate names or aliases are not allowed. Name: ${name}, Alias: ${alias}`)
    })

    it('should throw error when adding contact with duplicate alias', async () => {
      const name = 'default_new_contact'
      const alias = 'default_contact_alias'
      const contact = {
        name,
        alias,
        uri: 'example.com',
      }

      await expect(agent.cmAddContact(contact)).rejects.toThrow(`Duplicate names or aliases are not allowed. Name: ${name}, Alias: ${alias}`)
    })

    it('should update contact by id', async () => {
      const contactName = 'updated_contact'
      const contact = {
        ...defaultContact,
        name: contactName,
      }

      const result = await agent.cmUpdateContact({ contact })

      expect(result.name).toEqual(contactName)
    })

    it('should throw error when updating contact with unknown id', async () => {
      const contactId = 'unknownContactId'
      const contact = {
        ...defaultContact,
        id: contactId,
        name: 'new_name',
      }
      await expect(agent.cmUpdateContact({ contact })).rejects.toThrow(`No contact found for id: ${contactId}`)
    })

    it('should get identity by id', async () => {
      const result = await agent.cmGetIdentity({ identityId: defaultIdentity.id })

      expect(result.id).toEqual(defaultIdentity.id)
    })

    it('should throw error when getting identity with unknown id', async () => {
      const identityId = 'b0b5b2f9-7d78-4533-8bc1-386e4f08dce1'

      await expect(
        agent.cmGetIdentity({
          identityId,
        })
      ).rejects.toThrow(`No identity found for id: ${identityId}`)
    })

    it('should get all identities for contact', async () => {
      const result = await agent.cmGetIdentities({ filter: [{ contactId: defaultContact.id }] })

      expect(result.length).toBeGreaterThan(0)
    })

    it('should add identity to contact', async () => {
      const correlationId = 'new_example_did'
      const identity = {
        alias: correlationId,
        roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
        identifier: {
          type: CorrelationIdentifierEnum.DID,
          correlationId,
        },
      }

      const result = await agent.cmAddIdentity({ contactId: defaultContact.id, identity })
      const contact = await agent.cmGetContact({ contactId: defaultContact.id })

      expect(result).not.toBeNull()
      expect(contact.identities.length).toEqual(2)
    })

    it('should throw error when removing identity with unknown id', async () => {
      const identityId = 'unknownIdentityId'

      await expect(agent.cmRemoveIdentity({ identityId })).rejects.toThrow(`No identity found for id: ${identityId}`)
    })

    it('should throw error when adding identity with invalid identifier', async () => {
      const correlationId = 'missing_connection_add_example'
      const identity = {
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

    it('should throw error when updating identity with invalid identifier', async () => {
      const correlationId = 'missing_connection_update_example'
      const identity = {
        alias: correlationId,
        roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
        identifier: {
          type: CorrelationIdentifierEnum.DID,
          correlationId,
        },
      }
      const result = await agent.cmAddIdentity({ contactId: defaultContact.id, identity })
      result.identifier = { ...result.identifier, type: CorrelationIdentifierEnum.URL }

      await expect(agent.cmUpdateIdentity({ identity: result })).rejects.toThrow(`Identity with correlation type url should contain a connection`)
    })

    it('should update identity', async () => {
      const correlationId = 'new_update_example_did'
      const identity = {
        alias: 'update_example_did',
        roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
        identifier: {
          type: CorrelationIdentifierEnum.DID,
          correlationId: 'update_example_did',
        },
      }
      const result = await agent.cmAddIdentity({ contactId: defaultContact.id, identity })
      result.identifier = { ...result.identifier, correlationId }

      await agent.cmUpdateIdentity({ identity: result })
      const updatedIdentity = await agent.cmGetIdentity({ identityId: result.id })

      expect(updatedIdentity).not.toBeNull()
      expect(updatedIdentity.identifier.correlationId).toEqual(correlationId)
    })
  })
}
