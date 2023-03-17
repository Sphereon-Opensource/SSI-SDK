import { DataSource } from 'typeorm'

import { ContactStore } from '../contact/ContactStore'
import { CorrelationIdentifierEnum, DataStoreContactEntities, DataStoreMigrations } from '../index'

describe('Database entities test', () => {
  let dbConnection: DataSource
  let contactStore: ContactStore

  beforeEach(async () => {
    dbConnection = await new DataSource({
      type: 'sqlite',
      database: ':memory:',
      //logging: 'all',
      migrationsRun: false,
      migrations: DataStoreMigrations,
      synchronize: false,
      entities: DataStoreContactEntities,
    }).initialize()
    await dbConnection.runMigrations()
    expect(await dbConnection.showMigrations()).toBeFalsy()
    contactStore = new ContactStore(dbConnection)
  })

  afterEach(async () => {
    await (await dbConnection).destroy()
  })

  it('should get contact by id', async () => {
    const contact = {
      name: 'test_name',
      alias: 'test_alias',
      uri: 'example.com',
    }
    const savedContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const result = await contactStore.getContact({ contactId: savedContact.id })

    expect(result).toBeDefined()
  })

  it('should throw error when getting contact with unknown id', async () => {
    const contactId = 'unknownContactId'

    await expect(contactStore.getContact({ contactId })).rejects.toThrow(`No contact found for id: ${contactId}`)
  })

  it('should get all contacts', async () => {
    const contact1 = {
      name: 'test_name1',
      alias: 'test_alias1',
      uri: 'example.com1',
    }
    const savedContact1 = await contactStore.addContact(contact1)
    expect(savedContact1).toBeDefined()

    const contact2 = {
      name: 'test_name2',
      alias: 'test_alias2',
      uri: 'example.com2',
    }
    const savedContact2 = await contactStore.addContact(contact2)
    expect(savedContact2).toBeDefined()

    const result = await contactStore.getContacts()

    expect(result.length).toEqual(2)
  })

  it('should get contacts by filter', async () => {
    const contact = {
      name: 'test_name',
      alias: 'test_alias',
      uri: 'example.com',
    }
    const savedContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const args = {
      filter: [{ name: 'test_name' }, { alias: 'test_alias' }, { uri: 'example.com' }],
    }
    const result = await contactStore.getContacts(args)

    expect(result.length).toEqual(1)
  })

  it('should get contacts by name', async () => {
    const contact = {
      name: 'test_name',
      alias: 'test_alias',
      uri: 'example.com',
    }
    const savedContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const args = {
      filter: [{ name: 'test_name' }],
    }
    const result = await contactStore.getContacts(args)

    expect(result.length).toEqual(1)
  })

  it('should get contacts by alias', async () => {
    const contact = {
      name: 'test_name',
      alias: 'test_alias',
      uri: 'example.com',
    }
    const savedContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const args = {
      filter: [{ alias: 'test_alias' }],
    }
    const result = await contactStore.getContacts(args)

    expect(result.length).toEqual(1)
  })

  it('should get contacts by uri', async () => {
    const contact = {
      name: 'test_name',
      alias: 'test_alias',
      uri: 'example.com',
    }
    const savedContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const args = {
      filter: [{ uri: 'example.com' }],
    }
    const result = await contactStore.getContacts(args)

    expect(result.length).toEqual(1)
  })

  it('should return no contacts if filter does not match', async () => {
    const args = {
      filter: [{ name: 'no_match_contact' }, { alias: 'no_match_contact_alias' }, { uri: 'no_match_example.com' }],
    }
    const result = await contactStore.getContacts(args)

    expect(result.length).toEqual(0)
  })

  it('should add contact without identities', async () => {
    const contact = {
      name: 'test_name',
      alias: 'test_alias',
      uri: 'example.com',
    }

    const result = await contactStore.addContact(contact)

    expect(result.name).toEqual(contact.name)
    expect(result.alias).toEqual(contact.alias)
    expect(result.uri).toEqual(contact.uri)
  })

  it('should add contact with identities', async () => {
    const contact = {
      name: 'test_name',
      alias: 'test_alias',
      uri: 'example.com',
      identities: [
        {
          alias: 'test_alias1',
          identifier: {
            type: CorrelationIdentifierEnum.DID,
            correlationId: 'example_did1',
          },
        },
        {
          alias: 'test_alias2',
          identifier: {
            type: CorrelationIdentifierEnum.DID,
            correlationId: 'example_did2',
          },
        },
      ],
    }

    const result = await contactStore.addContact(contact)

    expect(result.name).toEqual(contact.name)
    expect(result.alias).toEqual(contact.alias)
    expect(result.uri).toEqual(contact.uri)
    expect(result.identities.length).toEqual(2)
  })

  it('should throw error when adding contact with invalid identity', async () => {
    const contact = {
      name: 'test_name',
      alias: 'test_alias',
      uri: 'example.com',
      identities: [
        {
          alias: 'test_alias1',
          identifier: {
            type: CorrelationIdentifierEnum.DID,
            correlationId: 'example_did1',
          },
        },
        {
          alias: 'test_alias2',
          identifier: {
            type: CorrelationIdentifierEnum.DID,
            correlationId: 'example_did2',
          },
        },
      ],
    }

    const result = await contactStore.addContact(contact)

    expect(result.name).toEqual(contact.name)
    expect(result.alias).toEqual(contact.alias)
    expect(result.uri).toEqual(contact.uri)
    expect(result.identities.length).toEqual(2)
  })

  it('should throw error when adding contact with duplicate name', async () => {
    const name = 'test_name'
    const contact1 = {
      name,
      alias: 'test_alias',
      uri: 'example.com',
    }
    const savedContact1 = await contactStore.addContact(contact1)
    expect(savedContact1).toBeDefined()

    const alias = 'test_alias2'
    const contact2 = {
      name,
      alias,
      uri: 'example.com',
    }

    await expect(contactStore.addContact(contact2)).rejects.toThrow(`Duplicate names or aliases are not allowed. Name: ${name}, Alias: ${alias}`)
  })

  it('should throw error when adding contact with duplicate alias', async () => {
    const alias = 'test_alias'
    const contact1 = {
      name: 'test_name',
      alias,
      uri: 'example.com',
    }
    const savedContact1 = await contactStore.addContact(contact1)
    expect(savedContact1).toBeDefined()

    const name = 'test_name2'
    const contact2 = {
      name,
      alias,
      uri: 'example.com',
    }

    await expect(contactStore.addContact(contact2)).rejects.toThrow(`Duplicate names or aliases are not allowed. Name: ${name}, Alias: ${alias}`)
  })

  it('should update contact by id', async () => {
    const contact = {
      name: 'test_name',
      alias: 'test_alias',
      uri: 'example.com',
    }
    const savedContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const identity1 = {
      alias: 'test_alias1',
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId: 'example_did1',
      },
    }
    const savedIdentity1 = await contactStore.addIdentity({ contactId: savedContact.id, identity: identity1 })
    expect(savedIdentity1).toBeDefined()

    const identity2 = {
      alias: 'test_alias2',
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId: 'example_did2',
      },
    }
    const savedIdentity2 = await contactStore.addIdentity({ contactId: savedContact.id, identity: identity2 })
    expect(savedIdentity2).toBeDefined()

    const contactName = 'updated_name'
    const updatedContact = {
      ...savedContact,
      name: contactName,
    }

    await contactStore.updateContact({ contact: updatedContact })
    const result = await contactStore.getContact({ contactId: savedContact.id })

    expect(result.name).toEqual(contactName)
    expect(result.identities.length).toEqual(2)
  })

  it('should throw error when updating contact with unknown id', async () => {
    const contact = {
      name: 'test_name',
      alias: 'test_alias',
      uri: 'example.com',
    }
    const savedContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const contactId = 'unknownContactId'
    const updatedContact = {
      ...savedContact,
      id: contactId,
      name: 'new_name',
    }
    await expect(contactStore.updateContact({ contact: updatedContact })).rejects.toThrow(`No contact found for id: ${contactId}`)
  })

  it('should get identity by id', async () => {
    const contact = {
      name: 'test_name',
      alias: 'test_alias',
      uri: 'example.com',
    }
    const savedContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const identity = {
      alias: 'test_alias',
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId: 'example_did',
      },
    }
    const savedIdentity = await contactStore.addIdentity({ contactId: savedContact.id, identity })
    expect(savedIdentity).toBeDefined()

    const result = await contactStore.getIdentity({ identityId: savedIdentity.id })

    expect(result).toBeDefined()
  })

  it('should throw error when getting identity with unknown id', async () => {
    const identityId = 'unknownIdentityId'

    await expect(contactStore.getIdentity({ identityId })).rejects.toThrow(`No identity found for id: ${identityId}`)
  })

  it('should get all identities for contact', async () => {
    const contact = {
      name: 'test_name',
      alias: 'test_alias',
      uri: 'example.com',
    }
    const savedContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const identity1 = {
      alias: 'test_alias1',
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId: 'example_did1',
      },
    }
    const savedIdentity1 = await contactStore.addIdentity({ contactId: savedContact.id, identity: identity1 })
    expect(savedIdentity1).toBeDefined()

    const identity2 = {
      alias: 'test_alias2',
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId: 'example_did2',
      },
    }
    const savedIdentity2 = await contactStore.addIdentity({ contactId: savedContact.id, identity: identity2 })
    expect(savedIdentity2).toBeDefined()

    const args = {
      filter: [{ contactId: savedContact.id }],
    }

    const result = await contactStore.getIdentities(args)

    expect(result.length).toEqual(2)
  })

  it('should get all identities', async () => {
    const contact = {
      name: 'test_name',
      alias: 'test_alias',
      uri: 'example.com',
    }
    const savedContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const identity1 = {
      alias: 'test_alias1',
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId: 'example_did1',
      },
    }
    const savedIdentity1 = await contactStore.addIdentity({ contactId: savedContact.id, identity: identity1 })
    expect(savedIdentity1).toBeDefined()

    const identity2 = {
      alias: 'test_alias2',
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId: 'example_did2',
      },
    }
    const savedIdentity2 = await contactStore.addIdentity({ contactId: savedContact.id, identity: identity2 })
    expect(savedIdentity2).toBeDefined()

    const result = await contactStore.getIdentities()

    expect(result.length).toEqual(2)
  })

  it('should get identities by filter', async () => {
    const contact = {
      name: 'test_name',
      alias: 'test_alias',
      uri: 'example.com',
    }
    const savedContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const alias = 'test_alias1'
    const identity1 = {
      alias,
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId: 'example_did1',
      },
    }
    const savedIdentity1 = await contactStore.addIdentity({ contactId: savedContact.id, identity: identity1 })
    expect(savedIdentity1).toBeDefined()

    const identity2 = {
      alias: 'test_alias2',
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId: 'example_did2',
      },
    }
    const savedIdentity2 = await contactStore.addIdentity({ contactId: savedContact.id, identity: identity2 })
    expect(savedIdentity2).toBeDefined()

    const args = {
      filter: [{ alias }],
    }

    const result = await contactStore.getIdentities(args)

    expect(result.length).toEqual(1)
  })

  it('should add identity to contact', async () => {
    const contact = {
      name: 'test_name',
      alias: 'test_alias',
      uri: 'example.com',
    }
    const savedContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const identity = {
      alias: 'test_alias',
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId: 'example_did',
      },
    }
    const savedIdentity = await contactStore.addIdentity({ contactId: savedContact.id, identity })
    expect(savedIdentity).toBeDefined()

    const result = await contactStore.getContact({ contactId: savedContact.id })
    expect(result.identities.length).toEqual(1)
  })

  it('should throw error when removing identity with unknown id', async () => {
    const identityId = 'unknownIdentityId'

    await expect(contactStore.removeIdentity({ identityId })).rejects.toThrow(`No identity found for id: ${identityId}`)
  })

  it('should throw error when adding identity with invalid identifier', async () => {
    const contact = {
      name: 'test_name',
      alias: 'test_alias',
      uri: 'example.com',
    }
    const savedContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const correlationId = 'missing_connection_example'
    const identity = {
      alias: correlationId,
      identifier: {
        type: CorrelationIdentifierEnum.URL,
        correlationId,
      },
    }

    await expect(contactStore.addIdentity({ contactId: savedContact.id, identity })).rejects.toThrow(
      `Identity with correlation type url should contain a connection`
    )
  })

  it('should throw error when updating identity with invalid identifier', async () => {
    const contact = {
      name: 'test_name',
      alias: 'test_alias',
      uri: 'example.com',
    }
    const savedContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const correlationId = 'missing_connection_example'
    const identity = {
      alias: correlationId,
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId,
      },
    }
    const storedIdentity = await contactStore.addIdentity({ contactId: savedContact.id, identity })
    storedIdentity.identifier = { ...storedIdentity.identifier, type: CorrelationIdentifierEnum.URL }

    await expect(contactStore.updateIdentity({ identity: storedIdentity })).rejects.toThrow(
      `Identity with correlation type url should contain a connection`
    )
  })

  it('should update identity by id', async () => {
    const contact = {
      name: 'test_name',
      alias: 'test_alias',
      uri: 'example.com',
    }
    const savedContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const identity = {
      alias: 'example_did',
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId: 'example_did',
      },
    }
    const storedIdentity = await contactStore.addIdentity({ contactId: savedContact.id, identity })
    const correlationId = 'new_update_example_did'
    storedIdentity.identifier = { ...storedIdentity.identifier, correlationId }

    await contactStore.updateIdentity({ identity: storedIdentity })
    const result = await contactStore.getIdentity({ identityId: storedIdentity.id })

    expect(result).not.toBeNull()
    expect(result.identifier.correlationId).toEqual(correlationId)
  })
})
