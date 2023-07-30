import { DataSource } from 'typeorm'

import { BasicContactRelationship, DataStoreContactEntities, IContactRelationship } from '../index'
import { ContactStore } from '../contact/ContactStore'
import {
  IdentityRoleEnum,
  ContactTypeEnum,
  IBasicContact,
  IContact,
  CorrelationIdentifierEnum,
  IIdentity,
  IPerson,
  BasicPerson,
  IBasicIdentity,
  IGetIdentitiesArgs,
  IGetContactsArgs,
} from '../types'

describe('Contact store tests', (): void => {
  let dbConnection: DataSource
  let contactStore: ContactStore

  beforeEach(async (): Promise<void> => {
    dbConnection = await new DataSource({
      type: 'sqlite',
      database: ':memory:',
      //logging: 'all',
      migrationsRun: false,
      // migrations: DataStoreMigrations,
      synchronize: true, //false
      entities: DataStoreContactEntities,
    }).initialize()
    // await dbConnection.runMigrations()
    // expect(await dbConnection.showMigrations()).toBeFalsy()
    contactStore = new ContactStore(dbConnection)
  })

  // beforeEach(async (): Promise<void> => {
  //   dbConnection = await new DataSource({
  //     type: 'sqlite',
  //     database: ':memory:',
  //     //logging: 'all',
  //     migrationsRun: false,
  //     migrations: DataStoreMigrations,
  //     synchronize: false,
  //     entities: DataStoreContactEntities,
  //   }).initialize()
  //   await dbConnection.runMigrations()
  //   expect(await dbConnection.showMigrations()).toBeFalsy()
  //   contactStore = new ContactStore(dbConnection)
  // })

  afterEach(async (): Promise<void> => {
    await (await dbConnection).destroy()
  })

  it('should get contact by id', async (): Promise<void> => {
    const contact: IBasicContact = {
      uri: 'example.com',
      contactType: {
        type: ContactTypeEnum.PERSON,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contactOwner: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }

    const savedContact: IContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const result: IContact = await contactStore.getContact({ contactId: savedContact.id })

    expect(result).toBeDefined()
  })

  it('should throw error when getting contact with unknown id', async (): Promise<void> => {
    const contactId = 'unknownContactId'

    await expect(contactStore.getContact({ contactId })).rejects.toThrow(`No contact found for id: ${contactId}`)
  })

  it('should get all contacts', async (): Promise<void> => {
    const contact1: IBasicContact = {
      uri: 'example.com',
      contactType: {
        type: ContactTypeEnum.PERSON,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name1',
      },
      contactOwner: {
        firstName: 'example_first_name1',
        middleName: 'example_middle_name1',
        lastName: 'example_last_name1',
        displayName: 'example_display_name1',
      },
    }
    const savedContact1: IContact = await contactStore.addContact(contact1)
    expect(savedContact1).toBeDefined()

    const contact2: IBasicContact = {
      uri: 'example.com',
      contactType: {
        type: ContactTypeEnum.PERSON,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
        name: 'example_name2',
      },
      contactOwner: {
        firstName: 'example_first_name2',
        middleName: 'example_middle_name2',
        lastName: 'example_last_name2',
        displayName: 'example_display_name2',
      },
    }
    const savedContact2: IContact = await contactStore.addContact(contact2)
    expect(savedContact2).toBeDefined()

    const result: Array<IContact> = await contactStore.getContacts()

    expect(result.length).toEqual(2)
  })

  it('should get contacts by filter', async (): Promise<void> => {
    const contact: IBasicContact = {
      uri: 'example.com',
      contactType: {
        type: ContactTypeEnum.PERSON,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contactOwner: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedContact: IContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const args: IGetContactsArgs = {
      filter: [
        {
          contactOwner: {
            firstName: (<BasicPerson>contact.contactOwner).firstName,
          },
        },
        {
          contactOwner: {
            middleName: (<BasicPerson>contact.contactOwner).middleName,
          },
        },
        {
          contactOwner: {
            lastName: (<BasicPerson>contact.contactOwner).lastName,
          },
        },
        {
          contactOwner: {
            displayName: (<BasicPerson>contact.contactOwner).displayName,
          },
        },
      ],
    }
    const result: Array<IContact> = await contactStore.getContacts(args)

    expect(result.length).toEqual(1)
  })

  it('should get whole contacts by filter', async (): Promise<void> => {
    const contact: IBasicContact = {
      uri: 'example.com',
      contactType: {
        type: ContactTypeEnum.PERSON,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contactOwner: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
      identities: [
        {
          alias: 'test_alias1',
          roles: [IdentityRoleEnum.ISSUER],
          identifier: {
            type: CorrelationIdentifierEnum.DID,
            correlationId: 'example_did1',
          },
        },
        {
          alias: 'test_alias2',
          roles: [IdentityRoleEnum.VERIFIER],
          identifier: {
            type: CorrelationIdentifierEnum.DID,
            correlationId: 'example_did2',
          },
        },
        {
          alias: 'test_alias3',
          roles: [IdentityRoleEnum.HOLDER],
          identifier: {
            type: CorrelationIdentifierEnum.DID,
            correlationId: 'example_did3',
          },
        },
      ],
    }
    const savedContact: IContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const args: IGetContactsArgs = {
      filter: [
        {
          identities: {
            identifier: {
              correlationId: 'example_did1',
            },
          },
        },
      ],
    }
    const result: Array<IContact> = await contactStore.getContacts(args)

    expect(result[0].identities.length).toEqual(3)
  })

  it('should get contacts by name', async (): Promise<void> => {
    const contact: IBasicContact = {
      uri: 'example.com',
      contactType: {
        type: ContactTypeEnum.PERSON,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'something',
      },
      contactOwner: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }

    const savedContact: IContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const args: IGetContactsArgs = {
      filter: [
        {
          contactOwner: {
            firstName: (<BasicPerson>contact.contactOwner).firstName,
          },
        },
        {
          contactOwner: {
            middleName: (<BasicPerson>contact.contactOwner).middleName,
          },
        },
        {
          contactOwner: {
            lastName: (<BasicPerson>contact.contactOwner).lastName,
          },
        },
      ],
    }
    const result: Array<IContact> = await contactStore.getContacts(args)

    expect(result.length).toEqual(1)
  })

  it('should get contacts by display name', async (): Promise<void> => {
    const contact: IBasicContact = {
      uri: 'example.com',
      contactType: {
        type: ContactTypeEnum.PERSON,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contactOwner: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }

    const savedContact: IContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const args: IGetContactsArgs = {
      filter: [
        {
          contactOwner: {
            displayName: (<BasicPerson>contact.contactOwner).displayName,
          },
        },
      ],
    }
    const result: Array<IContact> = await contactStore.getContacts(args)

    expect(result.length).toEqual(1)
  })

  it('should get contacts by uri', async (): Promise<void> => {
    const contact: IBasicContact = {
      uri: 'example.com',
      contactType: {
        type: ContactTypeEnum.PERSON,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contactOwner: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedContact: IContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const args: IGetContactsArgs = {
      filter: [{ uri: 'example.com' }],
    }
    const result: Array<IContact> = await contactStore.getContacts(args)

    expect(result.length).toEqual(1)
  })

  it('should return no contacts if filter does not match', async (): Promise<void> => {
    const args: IGetContactsArgs = {
      filter: [
        {
          contactOwner: {
            firstName: 'no_match_firstName',
          },
        },
        {
          contactOwner: {
            middleName: 'no_match_middleName',
          },
        },
        {
          contactOwner: {
            lastName: 'no_match_lastName',
          },
        },
      ],
    }
    const result: Array<IContact> = await contactStore.getContacts(args)

    expect(result.length).toEqual(0)
  })

  it('should add contact without identities', async (): Promise<void> => {
    const contact: IBasicContact = {
      uri: 'example.com',
      contactType: {
        type: ContactTypeEnum.PERSON,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contactOwner: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }

    const result: IContact = await contactStore.addContact(contact)

    expect(result).toBeDefined()
    expect((<IPerson>result.contactOwner).firstName).toEqual((<BasicPerson>contact.contactOwner).firstName)
    expect((<IPerson>result.contactOwner).middleName).toEqual((<BasicPerson>contact.contactOwner).middleName)
    expect((<IPerson>result.contactOwner).lastName).toEqual((<BasicPerson>contact.contactOwner).lastName)
    expect(result.identities.length).toEqual(0)
  })

  it('should add contact with identities', async (): Promise<void> => {
    const contact: IBasicContact = {
      uri: 'example.com',
      contactType: {
        type: ContactTypeEnum.PERSON,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contactOwner: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
      identities: [
        {
          alias: 'test_alias1',
          roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
          identifier: {
            type: CorrelationIdentifierEnum.DID,
            correlationId: 'example_did1',
          },
        },
        {
          alias: 'test_alias2',
          roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
          identifier: {
            type: CorrelationIdentifierEnum.DID,
            correlationId: 'example_did2',
          },
        },
      ],
    }

    const result: IContact = await contactStore.addContact(contact)

    expect(result).toBeDefined()
    expect((<IPerson>result.contactOwner).firstName).toEqual((<BasicPerson>contact.contactOwner).firstName)
    expect((<IPerson>result.contactOwner).middleName).toEqual((<BasicPerson>contact.contactOwner).middleName)
    expect((<IPerson>result.contactOwner).lastName).toEqual((<BasicPerson>contact.contactOwner).lastName)
    expect(result.identities.length).toEqual(2)
  })

  // TODO fix test, its not throwing an error
  // it('should throw error when adding contact with invalid identity', async (): Promise<void> => {
  //   const contact: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'something',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name',
  //       middleName: 'example_middle_name',
  //       lastName: 'example_last_name',
  //       displayName: 'example_display_name',
  //     },
  //     identities: [
  //       {
  //         alias: 'test_alias1',
  //         roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
  //         identifier: {
  //           type: CorrelationIdentifierEnum.DID,
  //           correlationId: 'example_did1',
  //         },
  //       },
  //       {
  //         alias: 'test_alias2',
  //         roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
  //         identifier: {
  //           type: CorrelationIdentifierEnum.DID,
  //           correlationId: 'example_did2',
  //         },
  //       },
  //     ],
  //   }
  //
  //   const result: IContact = await contactStore.addContact(contact)
  //
  //   expect(result.name).toEqual(contact.name)
  //   expect(result.alias).toEqual(contact.alias)
  //   expect(result.uri).toEqual(contact.uri)
  //   expect(result.identities.length).toEqual(2)
  // })

  // TODO test org and person
  it('should throw error when adding contact with duplicate display name', async (): Promise<void> => {
    const displayName = 'non_unique_value'
    const contact1: IBasicContact = {
      uri: 'example.com',
      contactType: {
        type: ContactTypeEnum.PERSON,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name1',
      },
      contactOwner: {
        firstName: 'example_first_name1',
        middleName: 'example_middle_name1',
        lastName: 'example_last_name1',
        displayName,
      },
    }
    const savedContact1: IContact = await contactStore.addContact(contact1)
    expect(savedContact1).toBeDefined()

    const contact2: IBasicContact = {
      uri: 'example.com',
      contactType: {
        type: ContactTypeEnum.PERSON,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
        name: 'example_name2',
      },
      contactOwner: {
        firstName: 'example_first_name2',
        middleName: 'example_middle_name2',
        lastName: 'example_last_name2',
        displayName,
      },
    }

    await expect(contactStore.addContact(contact2)).rejects.toThrow(`Duplicate names or display are not allowed. Display name: ${displayName}`)
  })

  // TODO  // TODO test name
  // it('should throw error when adding contact with duplicate name', async (): Promise<void> => {
  //   const alias = 'test_alias'
  //   const contact1: IBasicContact = {
  //     name: 'test_name',
  //     alias,
  //     uri: 'example.com',
  //   }
  //   const savedContact1: IContact = await contactStore.addContact(contact1)
  //   expect(savedContact1).toBeDefined()
  //
  //   const name = 'test_name2'
  //   const contact2: IBasicContact = {
  //     name,
  //     alias,
  //     uri: 'example.com',
  //   }
  //
  //   await expect(contactStore.addContact(contact2)).rejects.toThrow(`Duplicate names or aliases are not allowed. Name: ${name}, Alias: ${alias}`)
  // })

  it('should update contact by id', async (): Promise<void> => {
    const contact: IBasicContact = {
      uri: 'example.com',
      contactType: {
        type: ContactTypeEnum.PERSON,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contactOwner: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedContact: IContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const identity1: IBasicIdentity = {
      alias: 'test_alias1',
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId: 'example_did1',
      },
    }
    const savedIdentity1: IIdentity = await contactStore.addIdentity({ contactId: savedContact.id, identity: identity1 })
    expect(savedIdentity1).toBeDefined()

    const identity2: IBasicIdentity = {
      alias: 'test_alias2',
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId: 'example_did2',
      },
    }
    const savedIdentity2: IIdentity = await contactStore.addIdentity({ contactId: savedContact.id, identity: identity2 })
    expect(savedIdentity2).toBeDefined()

    const contactFirstName = 'updated_first_name'
    const updatedContact: IContact = {
      ...savedContact,
      contactOwner: {
        ...savedContact.contactOwner,
        firstName: contactFirstName,
      },
    }

    await contactStore.updateContact({ contact: updatedContact })
    const result: IContact = await contactStore.getContact({ contactId: savedContact.id })

    expect(result).toBeDefined()
    expect((<IPerson>result.contactOwner).firstName).toEqual(contactFirstName)
    expect(result.identities.length).toEqual(2)
  })

  it('should throw error when updating contact with unknown id', async (): Promise<void> => {
    const contact: IBasicContact = {
      uri: 'example.com',
      contactType: {
        type: ContactTypeEnum.PERSON,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contactOwner: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedContact: IContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const contactId = 'unknownContactId'
    const contactFirstName = 'updated_first_name'
    const updatedContact: IContact = {
      ...savedContact,
      id: contactId,
      contactOwner: {
        ...savedContact.contactOwner,
        firstName: contactFirstName,
      },
    }

    await expect(contactStore.updateContact({ contact: updatedContact })).rejects.toThrow(`No contact found for id: ${contactId}`)
  })

  // TODO test to update wrong contact type person to org

  it('should get identity by id', async (): Promise<void> => {
    const contact: IBasicContact = {
      uri: 'example.com',
      contactType: {
        type: ContactTypeEnum.PERSON,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contactOwner: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedContact: IContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const identity: IBasicIdentity = {
      alias: 'test_alias',
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId: 'example_did',
      },
    }
    const savedIdentity: IIdentity = await contactStore.addIdentity({ contactId: savedContact.id, identity })
    expect(savedIdentity).toBeDefined()

    const result: IIdentity = await contactStore.getIdentity({ identityId: savedIdentity.id })

    expect(result).toBeDefined()
  })

  it('should get holderDID identity by id', async (): Promise<void> => {
    const contact: IBasicContact = {
      uri: 'example.com',
      contactType: {
        type: ContactTypeEnum.PERSON,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contactOwner: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedContact: IContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const identity: IBasicIdentity = {
      alias: 'test_alias',
      roles: [IdentityRoleEnum.HOLDER],
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId: 'example_did',
      },
    }
    const savedIdentity: IIdentity = await contactStore.addIdentity({ contactId: savedContact.id, identity })
    expect(savedIdentity).toBeDefined()

    const result: IIdentity = await contactStore.getIdentity({ identityId: savedIdentity.id })

    expect(result).toBeDefined()
  })

  it('should throw error when getting identity with unknown id', async (): Promise<void> => {
    const identityId = 'unknownIdentityId'

    await expect(contactStore.getIdentity({ identityId })).rejects.toThrow(`No identity found for id: ${identityId}`)
  })

  it('should get all identities for contact', async (): Promise<void> => {
    const contact: IBasicContact = {
      uri: 'example.com',
      contactType: {
        type: ContactTypeEnum.PERSON,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contactOwner: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedContact: IContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const identity1: IBasicIdentity = {
      alias: 'test_alias1',
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId: 'example_did1',
      },
    }
    const savedIdentity1: IIdentity = await contactStore.addIdentity({ contactId: savedContact.id, identity: identity1 })
    expect(savedIdentity1).toBeDefined()

    const identity2: IBasicIdentity = {
      alias: 'test_alias2',
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId: 'example_did2',
      },
    }
    const savedIdentity2: IIdentity = await contactStore.addIdentity({ contactId: savedContact.id, identity: identity2 })
    expect(savedIdentity2).toBeDefined()

    const args: IGetIdentitiesArgs = {
      filter: [{ contactId: savedContact.id }],
    }

    const result: Array<IIdentity> = await contactStore.getIdentities(args)

    expect(result.length).toEqual(2)
  })

  it('should get all identities', async (): Promise<void> => {
    const contact: IBasicContact = {
      uri: 'example.com',
      contactType: {
        type: ContactTypeEnum.PERSON,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contactOwner: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedContact: IContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const identity1: IBasicIdentity = {
      alias: 'test_alias1',
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId: 'example_did1',
      },
    }
    const savedIdentity1: IIdentity = await contactStore.addIdentity({ contactId: savedContact.id, identity: identity1 })
    expect(savedIdentity1).toBeDefined()

    const identity2: IBasicIdentity = {
      alias: 'test_alias2',
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId: 'example_did2',
      },
    }
    const savedIdentity2: IIdentity = await contactStore.addIdentity({ contactId: savedContact.id, identity: identity2 })
    expect(savedIdentity2).toBeDefined()

    const result: Array<IIdentity> = await contactStore.getIdentities()

    expect(result.length).toEqual(2)
  })

  it('should get identities by filter', async (): Promise<void> => {
    const contact: IBasicContact = {
      uri: 'example.com',
      contactType: {
        type: ContactTypeEnum.PERSON,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contactOwner: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedContact: IContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const alias = 'test_alias1'
    const identity1: IBasicIdentity = {
      alias,
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId: 'example_did1',
      },
    }
    const savedIdentity1: IIdentity = await contactStore.addIdentity({ contactId: savedContact.id, identity: identity1 })
    expect(savedIdentity1).toBeDefined()

    const identity2: IBasicIdentity = {
      alias: 'test_alias2',
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId: 'example_did2',
      },
    }
    const savedIdentity2: IIdentity = await contactStore.addIdentity({ contactId: savedContact.id, identity: identity2 })
    expect(savedIdentity2).toBeDefined()

    const args: IGetIdentitiesArgs = {
      filter: [{ alias }],
    }

    const result: Array<IIdentity> = await contactStore.getIdentities(args)

    expect(result.length).toEqual(1)
  })

  it('should get whole identities by filter', async (): Promise<void> => {
    const contact: IBasicContact = {
      uri: 'example.com',
      contactType: {
        type: ContactTypeEnum.PERSON,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contactOwner: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedContact: IContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const alias = 'test_alias1'
    const identity1: IBasicIdentity = {
      alias,
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId: 'example_did1',
      },
      metadata: [
        {
          label: 'label1',
          value: 'example_value',
        },
        {
          label: 'label2',
          value: 'example_value',
        },
      ],
    }
    const savedIdentity1: IIdentity = await contactStore.addIdentity({ contactId: savedContact.id, identity: identity1 })
    expect(savedIdentity1).toBeDefined()

    const args: IGetIdentitiesArgs = {
      filter: [{ metadata: { label: 'label1' } }],
    }

    const result: Array<IIdentity> = await contactStore.getIdentities(args)

    expect(result[0]).toBeDefined()
    expect(result[0].metadata!.length).toEqual(2)
  })

  it('should add identity to contact', async (): Promise<void> => {
    const contact: IBasicContact = {
      uri: 'example.com',
      contactType: {
        type: ContactTypeEnum.PERSON,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contactOwner: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedContact: IContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const identity: IBasicIdentity = {
      alias: 'test_alias',
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId: 'example_did',
      },
    }
    const savedIdentity: IIdentity = await contactStore.addIdentity({ contactId: savedContact.id, identity })
    expect(savedIdentity).toBeDefined()

    const result: IContact = await contactStore.getContact({ contactId: savedContact.id })
    expect(result.identities.length).toEqual(1)
  })

  it('should throw error when removing identity with unknown id', async (): Promise<void> => {
    const identityId = 'unknownIdentityId'

    await expect(contactStore.removeIdentity({ identityId })).rejects.toThrow(`No identity found for id: ${identityId}`)
  })

  it('should throw error when adding identity with invalid identifier', async (): Promise<void> => {
    const contact: IBasicContact = {
      uri: 'example.com',
      contactType: {
        type: ContactTypeEnum.PERSON,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contactOwner: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedContact: IContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const correlationId = 'missing_connection_example'
    const identity: IBasicIdentity = {
      alias: correlationId,
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
      identifier: {
        type: CorrelationIdentifierEnum.URL,
        correlationId,
      },
    }

    await expect(contactStore.addIdentity({ contactId: savedContact.id, identity })).rejects.toThrow(
      `Identity with correlation type url should contain a connection`
    )
  })

  it('should throw error when updating identity with invalid identifier', async (): Promise<void> => {
    const contact: IBasicContact = {
      uri: 'example.com',
      contactType: {
        type: ContactTypeEnum.PERSON,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contactOwner: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedContact: IContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const correlationId = 'missing_connection_example'
    const identity: IBasicIdentity = {
      alias: correlationId,
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER, IdentityRoleEnum.HOLDER],
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId,
      },
    }
    const storedIdentity: IIdentity = await contactStore.addIdentity({ contactId: savedContact.id, identity })
    storedIdentity.identifier = { ...storedIdentity.identifier, type: CorrelationIdentifierEnum.URL }

    await expect(contactStore.updateIdentity({ identity: storedIdentity })).rejects.toThrow(
      `Identity with correlation type url should contain a connection`
    )
  })

  it('should update identity by id', async (): Promise<void> => {
    const contact: IBasicContact = {
      uri: 'example.com',
      contactType: {
        type: ContactTypeEnum.PERSON,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contactOwner: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedContact: IContact = await contactStore.addContact(contact)
    expect(savedContact).toBeDefined()

    const identity: IBasicIdentity = {
      alias: 'example_did',
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId: 'example_did',
      },
    }
    const storedIdentity: IIdentity = await contactStore.addIdentity({ contactId: savedContact.id, identity })
    const correlationId = 'new_update_example_did'
    storedIdentity.identifier = { ...storedIdentity.identifier, correlationId }

    await contactStore.updateIdentity({ identity: storedIdentity })
    const result: IIdentity = await contactStore.getIdentity({ identityId: storedIdentity.id })

    expect(result).toBeDefined()
    expect(result.identifier.correlationId).toEqual(correlationId)
  })

  it('should get aggregate of identity roles on contact', async (): Promise<void> => {
    const contact: IBasicContact = {
      uri: 'example.com',
      contactType: {
        type: ContactTypeEnum.PERSON,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contactOwner: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
      identities: [
        {
          alias: 'test_alias1',
          roles: [IdentityRoleEnum.VERIFIER],
          identifier: {
            type: CorrelationIdentifierEnum.DID,
            correlationId: 'example_did1',
          },
        },
        {
          alias: 'test_alias2',
          roles: [IdentityRoleEnum.ISSUER],
          identifier: {
            type: CorrelationIdentifierEnum.DID,
            correlationId: 'example_did2',
          },
        },
        {
          alias: 'test_alias3',
          roles: [IdentityRoleEnum.HOLDER],
          identifier: {
            type: CorrelationIdentifierEnum.DID,
            correlationId: 'example_did3',
          },
        },
      ],
    }

    const savedContact: IContact = await contactStore.addContact(contact)
    const result: IContact = await contactStore.getContact({ contactId: savedContact.id })

    expect(result.roles).toBeDefined()
    expect(result.roles.length).toEqual(3)
    expect(result.roles).toEqual([IdentityRoleEnum.VERIFIER, IdentityRoleEnum.ISSUER, IdentityRoleEnum.HOLDER])
  })

  it('should add relationship', async (): Promise<void> => {
    const contact1: IBasicContact = {
      uri: 'example1.com',
      contactType: {
        type: ContactTypeEnum.PERSON,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name1',
      },
      contactOwner: {
        firstName: 'example_first_name1',
        middleName: 'example_middle_name1',
        lastName: 'example_last_name1',
        displayName: 'example_display_name1',
      },
    }
    const savedContact1: IContact = await contactStore.addContact(contact1)
    expect(savedContact1).toBeDefined()

    const contact2: IBasicContact = {
      uri: 'example2.com',
      contactType: {
        type: ContactTypeEnum.PERSON,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
        name: 'example_name2',
      },
      contactOwner: {
        firstName: 'example_first_name2',
        middleName: 'example_middle_name2',
        lastName: 'example_last_name2',
        displayName: 'example_display_name2',
      },
    }
    const savedContact2: IContact = await contactStore.addContact(contact2)
    expect(savedContact2).toBeDefined()

    const relationship: BasicContactRelationship = {
      leftContactId: savedContact1.id,
      rightContactId: savedContact2.id
    }
    await contactStore.addRelationship(relationship)

    const result: IContact = await contactStore.getContact({ contactId: savedContact1.id })

    expect(result).toBeDefined()
    expect(result.relationships.length).toEqual(1)
    expect(result.relationships[0].leftContactId).toEqual(savedContact1.id)
    expect(result.relationships[0].rightContactId).toEqual(savedContact2.id)
  })

  it('should remove relationship', async (): Promise<void> => {
    const contact1: IBasicContact = {
      uri: 'example1.com',
      contactType: {
        type: ContactTypeEnum.PERSON,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name1',
      },
      contactOwner: {
        firstName: 'example_first_name1',
        middleName: 'example_middle_name1',
        lastName: 'example_last_name1',
        displayName: 'example_display_name1',
      },
    }
    const savedContact1: IContact = await contactStore.addContact(contact1)
    expect(savedContact1).toBeDefined()

    const contact2: IBasicContact = {
      uri: 'example2.com',
      contactType: {
        type: ContactTypeEnum.PERSON,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
        name: 'example_name2',
      },
      contactOwner: {
        firstName: 'example_first_name2',
        middleName: 'example_middle_name2',
        lastName: 'example_last_name2',
        displayName: 'example_display_name2',
      },
    }
    const savedContact2: IContact = await contactStore.addContact(contact2)
    expect(savedContact2).toBeDefined()

    const relationship: BasicContactRelationship = {
      leftContactId: savedContact1.id,
      rightContactId: savedContact2.id
    }
    const savedRelationship: IContactRelationship = await contactStore.addRelationship(relationship)
    expect(savedRelationship).toBeDefined()

    await contactStore.removeRelationship({ relationshipId: savedRelationship.id })

    const result: IContact = await contactStore.getContact({ contactId: savedContact1.id })

    expect(result).toBeDefined()
    expect(result?.relationships?.length).toEqual(0)
  })
})
