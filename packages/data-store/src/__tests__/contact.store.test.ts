import { DataSource } from 'typeorm'
import { DataStoreContactEntities, DataStoreMigrations, PartyOrigin } from '../index'
import { ContactStore } from '../contact/ContactStore'
import {
  CorrelationIdentifierType,
  ElectronicAddress,
  GetElectronicAddressesArgs,
  GetIdentitiesArgs,
  GetPartiesArgs,
  GetPhysicalAddressesArgs,
  GetRelationshipsArgs,
  Identity,
  IdentityRole,
  NaturalPerson,
  NonPersistedElectronicAddress,
  NonPersistedIdentity,
  NonPersistedNaturalPerson,
  NonPersistedParty,
  NonPersistedPartyRelationship,
  NonPersistedPartyType,
  NonPersistedPhysicalAddress,
  Party,
  PartyRelationship,
  PartyType,
  PartyTypeType,
  PhysicalAddress,
} from '../types'

describe('Contact store tests', (): void => {
  let dbConnection: DataSource
  let contactStore: ContactStore

  beforeEach(async (): Promise<void> => {
    dbConnection = await new DataSource({
      type: 'sqlite',
      database: ':memory:',
      logging: ['info'],
      migrationsRun: false,
      migrations: DataStoreMigrations,
      synchronize: false,
      entities: DataStoreContactEntities,
    }).initialize()
    await dbConnection.runMigrations()
    expect(await dbConnection.showMigrations()).toBeFalsy()
    contactStore = new ContactStore(dbConnection)
  })

  afterEach(async (): Promise<void> => {
    await (await dbConnection).destroy()
  })

  it('should get party by id', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }

    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

    const result: Party = await contactStore.getParty({ partyId: savedParty.id })

    expect(result).toBeDefined()
  })

  it('should throw error when getting party with unknown id', async (): Promise<void> => {
    const partyId = 'unknownPartyId'

    await expect(contactStore.getParty({ partyId })).rejects.toThrow(`No party found for id: ${partyId}`)
  })

  it('should get all parties', async (): Promise<void> => {
    const party1: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name1',
      },
      contact: {
        firstName: 'example_first_name1',
        middleName: 'example_middle_name1',
        lastName: 'example_last_name1',
        displayName: 'example_display_name1',
      },
    }
    const savedParty1: Party = await contactStore.addParty(party1)
    expect(savedParty1).toBeDefined()

    const party2: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
        name: 'example_name2',
      },
      contact: {
        firstName: 'example_first_name2',
        middleName: 'example_middle_name2',
        lastName: 'example_last_name2',
        displayName: 'example_display_name2',
      },
    }
    const savedParty2: Party = await contactStore.addParty(party2)
    expect(savedParty2).toBeDefined()

    const result: Array<Party> = await contactStore.getParties()

    expect(result).toBeDefined()
    expect(result.length).toEqual(2)
  })

  it('should get parties by filter', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

    const args: GetPartiesArgs = {
      filter: [
        {
          contact: {
            firstName: (<NonPersistedNaturalPerson>party.contact).firstName,
          },
        },
        {
          contact: {
            middleName: (<NonPersistedNaturalPerson>party.contact).middleName,
          },
        },
        {
          contact: {
            lastName: (<NonPersistedNaturalPerson>party.contact).lastName,
          },
        },
        {
          contact: {
            displayName: (<NonPersistedNaturalPerson>party.contact).displayName,
          },
        },
      ],
    }
    const result: Array<Party> = await contactStore.getParties(args)

    expect(result.length).toEqual(1)
  })

  it('should get whole parties by filter', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
      identities: [
        {
          alias: 'test_alias1',
          roles: [IdentityRole.ISSUER],
          identifier: {
            type: CorrelationIdentifierType.DID,
            correlationId: 'example_did1',
          },
        },
        {
          alias: 'test_alias2',
          roles: [IdentityRole.VERIFIER],
          identifier: {
            type: CorrelationIdentifierType.DID,
            correlationId: 'example_did2',
          },
        },
        {
          alias: 'test_alias3',
          roles: [IdentityRole.HOLDER],
          identifier: {
            type: CorrelationIdentifierType.DID,
            correlationId: 'example_did3',
          },
        },
      ],
      electronicAddresses: [
        {
          type: 'email',
          electronicAddress: 'example_electronic_address',
        },
      ],
    }
    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

    const args: GetPartiesArgs = {
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
    const result: Array<Party> = await contactStore.getParties(args)

    expect(result[0].identities.length).toEqual(3)
    expect(result[0].electronicAddresses.length).toEqual(1)
  })

  it('should get parties by name', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'something',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }

    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

    const args: GetPartiesArgs = {
      filter: [
        {
          contact: {
            firstName: (<NonPersistedNaturalPerson>party.contact).firstName,
          },
        },
        {
          contact: {
            middleName: (<NonPersistedNaturalPerson>party.contact).middleName,
          },
        },
        {
          contact: {
            lastName: (<NonPersistedNaturalPerson>party.contact).lastName,
          },
        },
      ],
    }
    const result: Array<Party> = await contactStore.getParties(args)

    expect(result.length).toEqual(1)
  })

  it('should get parties by display name', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }

    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

    const args: GetPartiesArgs = {
      filter: [
        {
          contact: {
            displayName: (<NonPersistedNaturalPerson>party.contact).displayName,
          },
        },
      ],
    }
    const result: Array<Party> = await contactStore.getParties(args)

    expect(result.length).toEqual(1)
  })

  it('should get parties by uri', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

    const args: GetPartiesArgs = {
      filter: [{ uri: 'example.com' }],
    }
    const result: Array<Party> = await contactStore.getParties(args)

    expect(result.length).toEqual(1)
  })

  it('should return no parties if filter does not match', async (): Promise<void> => {
    const args: GetPartiesArgs = {
      filter: [
        {
          contact: {
            firstName: 'no_match_firstName',
          },
        },
        {
          contact: {
            middleName: 'no_match_middleName',
          },
        },
        {
          contact: {
            lastName: 'no_match_lastName',
          },
        },
      ],
    }
    const result: Array<Party> = await contactStore.getParties(args)

    expect(result.length).toEqual(0)
  })

  it('should add party without identities', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }

    const result: Party = await contactStore.addParty(party)

    expect(result).toBeDefined()
    expect((<NaturalPerson>result.contact).firstName).toEqual((<NonPersistedNaturalPerson>party.contact).firstName)
    expect((<NaturalPerson>result.contact).middleName).toEqual((<NonPersistedNaturalPerson>party.contact).middleName)
    expect((<NaturalPerson>result.contact).lastName).toEqual((<NonPersistedNaturalPerson>party.contact).lastName)
    expect(result.identities.length).toEqual(0)
  })

  it('should add party with identities', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
      identities: [
        {
          alias: 'test_alias1',
          roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
          identifier: {
            type: CorrelationIdentifierType.DID,
            correlationId: 'example_did1',
          },
        },
        {
          alias: 'test_alias2',
          roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
          identifier: {
            type: CorrelationIdentifierType.DID,
            correlationId: 'example_did2',
          },
        },
      ],
    }

    const result: Party = await contactStore.addParty(party)

    expect(result).toBeDefined()
    expect((<NaturalPerson>result.contact).firstName).toEqual((<NonPersistedNaturalPerson>party.contact).firstName)
    expect((<NaturalPerson>result.contact).middleName).toEqual((<NonPersistedNaturalPerson>party.contact).middleName)
    expect((<NaturalPerson>result.contact).lastName).toEqual((<NonPersistedNaturalPerson>party.contact).lastName)
    expect(result.identities.length).toEqual(2)
  })

  it('should throw error when adding party with invalid identity', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'something',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
      identities: [
        {
          alias: 'test_alias1',
          roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
          identifier: {
            type: CorrelationIdentifierType.URL,
            correlationId: 'example_did1',
          },
        },
        {
          alias: 'test_alias2',
          roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
          identifier: {
            type: CorrelationIdentifierType.DID,
            correlationId: 'example_did2',
          },
        },
      ],
    }

    await expect(contactStore.addParty(party)).rejects.toThrow(`Identity with correlation type url should contain a connection`)
  })

  it('should update party by id', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

    const identity1: NonPersistedIdentity = {
      alias: 'test_alias1',
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
      identifier: {
        type: CorrelationIdentifierType.DID,
        correlationId: 'example_did1',
      },
    }
    const savedIdentity1: Identity = await contactStore.addIdentity({ partyId: savedParty.id, identity: identity1 })
    expect(savedIdentity1).toBeDefined()

    const identity2: NonPersistedIdentity = {
      alias: 'test_alias2',
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
      identifier: {
        type: CorrelationIdentifierType.DID,
        correlationId: 'example_did2',
      },
    }
    const savedIdentity2: Identity = await contactStore.addIdentity({ partyId: savedParty.id, identity: identity2 })
    expect(savedIdentity2).toBeDefined()

    const contactFirstName = 'updated_first_name'
    const updatedParty: Party = {
      ...savedParty,
      contact: {
        ...savedParty.contact,
        firstName: contactFirstName,
      },
    }

    await contactStore.updateParty({ party: updatedParty })
    const result: Party = await contactStore.getParty({ partyId: savedParty.id })

    expect(result).toBeDefined()
    expect((<NaturalPerson>result.contact).firstName).toEqual(contactFirstName)
    expect(result.identities.length).toEqual(2)
  })

  it('should throw error when updating party with unknown id', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

    const partyId = 'unknownPartyId'
    const contactFirstName = 'updated_first_name'
    const updatedParty: Party = {
      ...savedParty,
      id: partyId,
      contact: {
        ...savedParty.contact,
        firstName: contactFirstName,
      },
    }

    await expect(contactStore.updateParty({ party: updatedParty })).rejects.toThrow(`No party found for id: ${partyId}`)
  })

  it('should get identity by id', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

    const identity: NonPersistedIdentity = {
      alias: 'test_alias',
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
      identifier: {
        type: CorrelationIdentifierType.DID,
        correlationId: 'example_did',
      },
    }
    const savedIdentity: Identity = await contactStore.addIdentity({ partyId: savedParty.id, identity })
    expect(savedIdentity).toBeDefined()

    const result: Identity = await contactStore.getIdentity({ identityId: savedIdentity.id })

    expect(result).toBeDefined()
  })

  it('should get holderDID identity by id', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

    const identity: NonPersistedIdentity = {
      alias: 'test_alias',
      roles: [IdentityRole.HOLDER],
      identifier: {
        type: CorrelationIdentifierType.DID,
        correlationId: 'example_did',
      },
    }
    const savedIdentity: Identity = await contactStore.addIdentity({ partyId: savedParty.id, identity })
    expect(savedIdentity).toBeDefined()

    const result: Identity = await contactStore.getIdentity({ identityId: savedIdentity.id })

    expect(result).toBeDefined()
  })

  it('should throw error when getting identity with unknown id', async (): Promise<void> => {
    const identityId = 'unknownIdentityId'

    await expect(contactStore.getIdentity({ identityId })).rejects.toThrow(`No identity found for id: ${identityId}`)
  })

  it('should get all identities for contact', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

    const identity1: NonPersistedIdentity = {
      alias: 'test_alias1',
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
      identifier: {
        type: CorrelationIdentifierType.DID,
        correlationId: 'example_did1',
      },
    }
    const savedIdentity1: Identity = await contactStore.addIdentity({ partyId: savedParty.id, identity: identity1 })
    expect(savedIdentity1).toBeDefined()

    const identity2: NonPersistedIdentity = {
      alias: 'test_alias2',
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
      identifier: {
        type: CorrelationIdentifierType.DID,
        correlationId: 'example_did2',
      },
    }
    const savedIdentity2: Identity = await contactStore.addIdentity({ partyId: savedParty.id, identity: identity2 })
    expect(savedIdentity2).toBeDefined()

    const args: GetIdentitiesArgs = {
      filter: [{ partyId: savedParty.id }],
    }

    const result: Array<Identity> = await contactStore.getIdentities(args)

    expect(result.length).toEqual(2)
  })

  it('should get all identities', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

    const identity1: NonPersistedIdentity = {
      alias: 'test_alias1',
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
      identifier: {
        type: CorrelationIdentifierType.DID,
        correlationId: 'example_did1',
      },
    }
    const savedIdentity1: Identity = await contactStore.addIdentity({ partyId: savedParty.id, identity: identity1 })
    expect(savedIdentity1).toBeDefined()

    const identity2: NonPersistedIdentity = {
      alias: 'test_alias2',
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
      identifier: {
        type: CorrelationIdentifierType.DID,
        correlationId: 'example_did2',
      },
    }
    const savedIdentity2: Identity = await contactStore.addIdentity({ partyId: savedParty.id, identity: identity2 })
    expect(savedIdentity2).toBeDefined()

    const result: Array<Identity> = await contactStore.getIdentities()

    expect(result.length).toEqual(2)
  })

  it('should get identities by filter', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

    const alias = 'test_alias1'
    const identity1: NonPersistedIdentity = {
      alias,
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
      identifier: {
        type: CorrelationIdentifierType.DID,
        correlationId: 'example_did1',
      },
    }
    const savedIdentity1: Identity = await contactStore.addIdentity({ partyId: savedParty.id, identity: identity1 })
    expect(savedIdentity1).toBeDefined()

    const identity2: NonPersistedIdentity = {
      alias: 'test_alias2',
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
      identifier: {
        type: CorrelationIdentifierType.DID,
        correlationId: 'example_did2',
      },
    }
    const savedIdentity2: Identity = await contactStore.addIdentity({ partyId: savedParty.id, identity: identity2 })
    expect(savedIdentity2).toBeDefined()

    const args: GetIdentitiesArgs = {
      filter: [{ alias }],
    }

    const result: Array<Identity> = await contactStore.getIdentities(args)

    expect(result.length).toEqual(1)
  })

  it('should get whole identities by filter', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

    const alias = 'test_alias1'
    const identity1: NonPersistedIdentity = {
      alias,
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
      identifier: {
        type: CorrelationIdentifierType.DID,
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
    const savedIdentity1: Identity = await contactStore.addIdentity({ partyId: savedParty.id, identity: identity1 })
    expect(savedIdentity1).toBeDefined()

    const args: GetIdentitiesArgs = {
      filter: [{ metadata: { label: 'label1' } }],
    }

    const result: Array<Identity> = await contactStore.getIdentities(args)

    expect(result[0]).toBeDefined()
    expect(result[0].metadata!.length).toEqual(2)
  })

  it('should add identity to contact', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

    const identity: NonPersistedIdentity = {
      alias: 'test_alias',
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
      identifier: {
        type: CorrelationIdentifierType.DID,
        correlationId: 'example_did',
      },
    }
    const savedIdentity: Identity = await contactStore.addIdentity({ partyId: savedParty.id, identity })
    expect(savedIdentity).toBeDefined()

    const result: Party = await contactStore.getParty({ partyId: savedParty.id })
    expect(result.identities.length).toEqual(1)
  })

  it('should throw error when removing identity with unknown id', async (): Promise<void> => {
    const identityId = 'unknownIdentityId'

    await expect(contactStore.removeIdentity({ identityId })).rejects.toThrow(`No identity found for id: ${identityId}`)
  })

  it('should throw error when adding identity with invalid identifier', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

    const correlationId = 'missing_connection_example'
    const identity: NonPersistedIdentity = {
      alias: correlationId,
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
      identifier: {
        type: CorrelationIdentifierType.URL,
        correlationId,
      },
    }

    await expect(contactStore.addIdentity({ partyId: savedParty.id, identity })).rejects.toThrow(
      `Identity with correlation type url should contain a connection`,
    )
  })

  it('should throw error when updating identity with invalid identifier', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

    const correlationId = 'missing_connection_example'
    const identity: NonPersistedIdentity = {
      alias: correlationId,
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER, IdentityRole.HOLDER],
      identifier: {
        type: CorrelationIdentifierType.DID,
        correlationId,
      },
    }
    const storedIdentity: Identity = await contactStore.addIdentity({ partyId: savedParty.id, identity })
    storedIdentity.identifier = { ...storedIdentity.identifier, type: CorrelationIdentifierType.URL }

    await expect(contactStore.updateIdentity({ identity: storedIdentity })).rejects.toThrow(
      `Identity with correlation type url should contain a connection`,
    )
  })

  it('should update identity by id', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

    const identity: NonPersistedIdentity = {
      alias: 'example_did',
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
      identifier: {
        type: CorrelationIdentifierType.DID,
        correlationId: 'example_did',
      },
    }
    const storedIdentity: Identity = await contactStore.addIdentity({ partyId: savedParty.id, identity })
    const correlationId = 'new_update_example_did'
    storedIdentity.identifier = { ...storedIdentity.identifier, correlationId }

    await contactStore.updateIdentity({ identity: storedIdentity })
    const result: Identity = await contactStore.getIdentity({ identityId: storedIdentity.id })

    expect(result).toBeDefined()
    expect(result.identifier.correlationId).toEqual(correlationId)
  })

  it('should get aggregate of identity roles on party', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
      identities: [
        {
          alias: 'test_alias1',
          roles: [IdentityRole.VERIFIER],
          identifier: {
            type: CorrelationIdentifierType.DID,
            correlationId: 'example_did1',
          },
        },
        {
          alias: 'test_alias2',
          roles: [IdentityRole.ISSUER],
          identifier: {
            type: CorrelationIdentifierType.DID,
            correlationId: 'example_did2',
          },
        },
        {
          alias: 'test_alias3',
          roles: [IdentityRole.HOLDER],
          identifier: {
            type: CorrelationIdentifierType.DID,
            correlationId: 'example_did3',
          },
        },
      ],
    }

    const savedParty: Party = await contactStore.addParty(party)
    const result: Party = await contactStore.getParty({ partyId: savedParty.id })

    expect(result.roles).toBeDefined()
    expect(result.roles.length).toEqual(3)
    expect(result.roles).toEqual([IdentityRole.VERIFIER, IdentityRole.ISSUER, IdentityRole.HOLDER])
  })

  it('should add relationship', async (): Promise<void> => {
    const party1: NonPersistedParty = {
      uri: 'example1.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name1',
      },
      contact: {
        firstName: 'example_first_name1',
        middleName: 'example_middle_name1',
        lastName: 'example_last_name1',
        displayName: 'example_display_name1',
      },
    }
    const savedParty1: Party = await contactStore.addParty(party1)
    expect(savedParty1).toBeDefined()

    const party2: NonPersistedParty = {
      uri: 'example2.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.EXTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
        name: 'example_name2',
      },
      contact: {
        firstName: 'example_first_name2',
        middleName: 'example_middle_name2',
        lastName: 'example_last_name2',
        displayName: 'example_display_name2',
      },
    }
    const savedParty2: Party = await contactStore.addParty(party2)
    expect(savedParty2).toBeDefined()

    const relationship: NonPersistedPartyRelationship = {
      leftId: savedParty1.id,
      rightId: savedParty2.id,
    }
    await contactStore.addRelationship(relationship)

    const result: Party = await contactStore.getParty({ partyId: savedParty1.id })

    expect(result).toBeDefined()
    expect(result.relationships.length).toEqual(1)
    expect(result.relationships[0].leftId).toEqual(savedParty1.id)
    expect(result.relationships[0].rightId).toEqual(savedParty2.id)
  })

  it('should get relationship', async (): Promise<void> => {
    const party1: NonPersistedParty = {
      uri: 'example1.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name1',
      },
      contact: {
        firstName: 'example_first_name1',
        middleName: 'example_middle_name1',
        lastName: 'example_last_name1',
        displayName: 'example_display_name1',
      },
    }
    const savedParty1: Party = await contactStore.addParty(party1)
    expect(savedParty1).toBeDefined()

    const party2: NonPersistedParty = {
      uri: 'example2.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
        name: 'example_name2',
      },
      contact: {
        firstName: 'example_first_name2',
        middleName: 'example_middle_name2',
        lastName: 'example_last_name2',
        displayName: 'example_display_name2',
      },
    }
    const savedParty2: Party = await contactStore.addParty(party2)
    expect(savedParty2).toBeDefined()

    const relationship: NonPersistedPartyRelationship = {
      leftId: savedParty1.id,
      rightId: savedParty2.id,
    }
    const savedRelationship: PartyRelationship = await contactStore.addRelationship(relationship)

    const result: PartyRelationship = await contactStore.getRelationship({ relationshipId: savedRelationship.id })

    expect(result).toBeDefined()
    expect(result.leftId).toEqual(savedParty1.id)
    expect(result.rightId).toEqual(savedParty2.id)
  })

  it('should throw error when getting relationship with unknown id', async (): Promise<void> => {
    const relationshipId = 'unknownRelationshipId'

    await expect(contactStore.getRelationship({ relationshipId })).rejects.toThrow(`No relationship found for id: ${relationshipId}`)
  })

  it('should get all relationships', async (): Promise<void> => {
    const party1: NonPersistedParty = {
      uri: 'example1.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name1',
      },
      contact: {
        firstName: 'example_first_name1',
        middleName: 'example_middle_name1',
        lastName: 'example_last_name1',
        displayName: 'example_display_name1',
      },
    }
    const savedParty1: Party = await contactStore.addParty(party1)
    expect(savedParty1).toBeDefined()

    const party2: NonPersistedParty = {
      uri: 'example2.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
        name: 'example_name2',
      },
      contact: {
        firstName: 'example_first_name2',
        middleName: 'example_middle_name2',
        lastName: 'example_last_name2',
        displayName: 'example_display_name2',
      },
    }
    const savedParty2: Party = await contactStore.addParty(party2)
    expect(savedParty2).toBeDefined()

    const relationship1: NonPersistedPartyRelationship = {
      leftId: savedParty1.id,
      rightId: savedParty2.id,
    }
    await contactStore.addRelationship(relationship1)

    const relationship2: NonPersistedPartyRelationship = {
      leftId: savedParty2.id,
      rightId: savedParty1.id,
    }
    await contactStore.addRelationship(relationship2)

    const result: Array<PartyRelationship> = await contactStore.getRelationships()

    expect(result).toBeDefined()
    expect(result.length).toEqual(2)
  })

  it('should get relationships by filter', async (): Promise<void> => {
    const party1: NonPersistedParty = {
      uri: 'example1.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name1',
      },
      contact: {
        firstName: 'example_first_name1',
        middleName: 'example_middle_name1',
        lastName: 'example_last_name1',
        displayName: 'example_display_name1',
      },
    }
    const savedParty1: Party = await contactStore.addParty(party1)
    expect(savedParty1).toBeDefined()

    const party2: NonPersistedParty = {
      uri: 'example2.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
        name: 'example_name2',
      },
      contact: {
        firstName: 'example_first_name2',
        middleName: 'example_middle_name2',
        lastName: 'example_last_name2',
        displayName: 'example_display_name2',
      },
    }
    const savedParty2: Party = await contactStore.addParty(party2)
    expect(savedParty2).toBeDefined()

    const relationship1: NonPersistedPartyRelationship = {
      leftId: savedParty1.id,
      rightId: savedParty2.id,
    }
    await contactStore.addRelationship(relationship1)

    const relationship2: NonPersistedPartyRelationship = {
      leftId: savedParty2.id,
      rightId: savedParty1.id,
    }
    await contactStore.addRelationship(relationship2)

    const args: GetRelationshipsArgs = {
      filter: [
        {
          leftId: savedParty1.id,
          rightId: savedParty2.id,
        },
      ],
    }

    const result: Array<PartyRelationship> = await contactStore.getRelationships(args)

    expect(result).toBeDefined()
    expect(result.length).toEqual(1)
  })

  it('should remove relationship', async (): Promise<void> => {
    const party1: NonPersistedParty = {
      uri: 'example1.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name1',
      },
      contact: {
        firstName: 'example_first_name1',
        middleName: 'example_middle_name1',
        lastName: 'example_last_name1',
        displayName: 'example_display_name1',
      },
    }
    const savedParty1: Party = await contactStore.addParty(party1)
    expect(savedParty1).toBeDefined()

    const party2: NonPersistedParty = {
      uri: 'example2.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.EXTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
        name: 'example_name2',
      },
      contact: {
        firstName: 'example_first_name2',
        middleName: 'example_middle_name2',
        lastName: 'example_last_name2',
        displayName: 'example_display_name2',
      },
    }
    const savedParty2: Party = await contactStore.addParty(party2)
    expect(savedParty2).toBeDefined()

    const relationship: NonPersistedPartyRelationship = {
      leftId: savedParty1.id,
      rightId: savedParty2.id,
    }
    const savedRelationship: PartyRelationship = await contactStore.addRelationship(relationship)
    expect(savedRelationship).toBeDefined()

    await contactStore.removeRelationship({ relationshipId: savedRelationship.id })

    const result: Party = await contactStore.getParty({ partyId: savedParty1.id })

    expect(result).toBeDefined()
    expect(result?.relationships?.length).toEqual(0)
  })

  it('should throw error when removing relationship with unknown id', async (): Promise<void> => {
    const relationshipId = 'unknownRelationshipId'

    await expect(contactStore.removeRelationship({ relationshipId })).rejects.toThrow(`No relationship found for id: ${relationshipId}`)
  })

  it('should return no relationships if filter does not match', async (): Promise<void> => {
    const args: GetRelationshipsArgs = {
      filter: [
        {
          leftId: 'unknown_id',
        },
      ],
    }
    const result: Array<PartyRelationship> = await contactStore.getRelationships(args)

    expect(result.length).toEqual(0)
  })

  it('should update relationship by id', async (): Promise<void> => {
    const party1: NonPersistedParty = {
      uri: 'example1.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name1',
      },
      contact: {
        firstName: 'example_first_name1',
        middleName: 'example_middle_name1',
        lastName: 'example_last_name1',
        displayName: 'example_display_name1',
      },
    }
    const savedParty1: Party = await contactStore.addParty(party1)
    expect(savedParty1).toBeDefined()

    const party2: NonPersistedParty = {
      uri: 'example2.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.EXTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
        name: 'example_name2',
      },
      contact: {
        firstName: 'example_first_name2',
        middleName: 'example_middle_name2',
        lastName: 'example_last_name2',
        displayName: 'example_display_name2',
      },
    }
    const savedParty2: Party = await contactStore.addParty(party2)
    expect(savedParty2).toBeDefined()

    const party3: NonPersistedParty = {
      uri: 'example3.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d287',
        name: 'example_name3',
      },
      contact: {
        firstName: 'example_first_name3',
        middleName: 'example_middle_name3',
        lastName: 'example_last_name3',
        displayName: 'example_display_name3',
      },
    }
    const savedParty3: Party = await contactStore.addParty(party3)
    expect(savedParty3).toBeDefined()

    const relationship: NonPersistedPartyRelationship = {
      leftId: savedParty1.id,
      rightId: savedParty2.id,
    }
    const savedRelationship: PartyRelationship = await contactStore.addRelationship(relationship)

    const updatedRelationship: PartyRelationship = {
      ...savedRelationship,
      rightId: savedParty3.id,
    }

    await contactStore.updateRelationship({ relationship: updatedRelationship })

    const result: Party = await contactStore.getParty({ partyId: savedParty1.id })

    expect(result).toBeDefined()
    expect(result.relationships.length).toEqual(1)
    expect(result.relationships[0].leftId).toEqual(savedParty1.id)
    expect(result.relationships[0].rightId).toEqual(savedParty3.id)
  })

  it('should throw error when updating relationship with unknown id', async (): Promise<void> => {
    const party1: NonPersistedParty = {
      uri: 'example1.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.EXTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name1',
      },
      contact: {
        firstName: 'example_first_name1',
        middleName: 'example_middle_name1',
        lastName: 'example_last_name1',
        displayName: 'example_display_name1',
      },
    }
    const savedParty1: Party = await contactStore.addParty(party1)
    expect(savedParty1).toBeDefined()

    const party2: NonPersistedParty = {
      uri: 'example2.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
        name: 'example_name2',
      },
      contact: {
        firstName: 'example_first_name2',
        middleName: 'example_middle_name2',
        lastName: 'example_last_name2',
        displayName: 'example_display_name2',
      },
    }
    const savedParty2: Party = await contactStore.addParty(party2)
    expect(savedParty2).toBeDefined()

    const relationship: NonPersistedPartyRelationship = {
      leftId: savedParty1.id,
      rightId: savedParty2.id,
    }
    const savedRelationship: PartyRelationship = await contactStore.addRelationship(relationship)

    const relationshipId = 'unknownRelationshipId'
    const updatedRelationship: PartyRelationship = {
      ...savedRelationship,
      id: relationshipId,
      rightId: savedParty2.id,
    }

    await expect(contactStore.updateRelationship({ relationship: updatedRelationship })).rejects.toThrow(
      `No party relationship found for id: ${relationshipId}`,
    )
  })

  it('should throw error when updating relationship with unknown right side id', async (): Promise<void> => {
    const party1: NonPersistedParty = {
      uri: 'example1.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.EXTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name1',
      },
      contact: {
        firstName: 'example_first_name1',
        middleName: 'example_middle_name1',
        lastName: 'example_last_name1',
        displayName: 'example_display_name1',
      },
    }
    const savedParty1: Party = await contactStore.addParty(party1)
    expect(savedParty1).toBeDefined()

    const party2: NonPersistedParty = {
      uri: 'example2.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
        name: 'example_name2',
      },
      contact: {
        firstName: 'example_first_name2',
        middleName: 'example_middle_name2',
        lastName: 'example_last_name2',
        displayName: 'example_display_name2',
      },
    }
    const savedParty2: Party = await contactStore.addParty(party2)
    expect(savedParty2).toBeDefined()

    const relationship: NonPersistedPartyRelationship = {
      leftId: savedParty1.id,
      rightId: savedParty2.id,
    }
    const savedRelationship: PartyRelationship = await contactStore.addRelationship(relationship)

    const partyId = 'unknownPartyId'
    const updatedRelationship: PartyRelationship = {
      ...savedRelationship,
      rightId: partyId,
    }

    await expect(contactStore.updateRelationship({ relationship: updatedRelationship })).rejects.toThrow(
      `No party found for right side of the relationship, party id: ${partyId}`,
    )
  })

  it('should throw error when updating relationship with unknown left side id', async (): Promise<void> => {
    const party1: NonPersistedParty = {
      uri: 'example1.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.EXTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name1',
      },
      contact: {
        firstName: 'example_first_name1',
        middleName: 'example_middle_name1',
        lastName: 'example_last_name1',
        displayName: 'example_display_name1',
      },
    }
    const savedParty1: Party = await contactStore.addParty(party1)
    expect(savedParty1).toBeDefined()

    const party2: NonPersistedParty = {
      uri: 'example2.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.EXTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
        name: 'example_name2',
      },
      contact: {
        firstName: 'example_first_name2',
        middleName: 'example_middle_name2',
        lastName: 'example_last_name2',
        displayName: 'example_display_name2',
      },
    }
    const savedParty2: Party = await contactStore.addParty(party2)
    expect(savedParty2).toBeDefined()

    const relationship: NonPersistedPartyRelationship = {
      leftId: savedParty1.id,
      rightId: savedParty2.id,
    }
    const savedRelationship: PartyRelationship = await contactStore.addRelationship(relationship)

    const partyId = 'unknownPartyId'
    const updatedRelationship: PartyRelationship = {
      ...savedRelationship,
      leftId: partyId,
    }

    await expect(contactStore.updateRelationship({ relationship: updatedRelationship })).rejects.toThrow(
      `No party found for left side of the relationship, party id: ${partyId}`,
    )
  })

  it('should add party type', async (): Promise<void> => {
    const partyType: NonPersistedPartyType = {
      type: PartyTypeType.NATURAL_PERSON,
      origin: PartyOrigin.EXTERNAL,
      tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
      name: 'example_name',
      description: 'example_description',
    }

    const savedPartyType: PartyType = await contactStore.addPartyType(partyType)
    const result: PartyType = await contactStore.getPartyType({ partyTypeId: savedPartyType.id })

    expect(result).toBeDefined()
    expect(result.name).toEqual(partyType.name)
    expect(result.type).toEqual(partyType.type)
    expect(result.origin).toEqual(partyType.origin)
    expect(result.tenantId).toEqual(partyType.tenantId)
    expect(result.description).toEqual(partyType.description)
    expect(result.lastUpdatedAt).toBeDefined()
    expect(result.createdAt).toBeDefined()
  })

  it('should get party types by filter', async (): Promise<void> => {
    const partyType1: NonPersistedPartyType = {
      type: PartyTypeType.NATURAL_PERSON,
      origin: PartyOrigin.EXTERNAL,
      tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
      name: 'example_name1',
      description: 'example_description1',
    }
    const savedPartyType1: PartyType = await contactStore.addPartyType(partyType1)
    expect(savedPartyType1).toBeDefined()

    const partyType2: NonPersistedPartyType = {
      type: PartyTypeType.NATURAL_PERSON,
      origin: PartyOrigin.EXTERNAL,
      tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d287',
      name: 'example_name2',
      description: 'example_description2',
    }
    const savedPartyType2: PartyType = await contactStore.addPartyType(partyType2)
    expect(savedPartyType2).toBeDefined()

    const result: Array<PartyType> = await contactStore.getPartyTypes({
      filter: [
        {
          type: PartyTypeType.NATURAL_PERSON,
          name: 'example_name1',
          description: 'example_description1',
        },
      ],
    })

    expect(result).toBeDefined()
    expect(result.length).toEqual(1)
  })

  it('should return no party types if filter does not match', async (): Promise<void> => {
    const partyType1: NonPersistedPartyType = {
      type: PartyTypeType.NATURAL_PERSON,
      origin: PartyOrigin.INTERNAL,
      tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
      name: 'example_name1',
      description: 'example_description1',
    }
    const savedPartyType1: PartyType = await contactStore.addPartyType(partyType1)
    expect(savedPartyType1).toBeDefined()

    const partyType2: NonPersistedPartyType = {
      type: PartyTypeType.NATURAL_PERSON,
      origin: PartyOrigin.INTERNAL,
      tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d287',
      name: 'example_name2',
      description: 'example_description2',
    }
    const savedPartyType2: PartyType = await contactStore.addPartyType(partyType2)
    expect(savedPartyType2).toBeDefined()

    const result: Array<PartyType> = await contactStore.getPartyTypes({
      filter: [
        {
          type: PartyTypeType.NATURAL_PERSON,
          name: 'unknown_name',
          description: 'unknown_description',
        },
      ],
    })

    expect(result).toBeDefined()
    expect(result.length).toEqual(0)
  })

  it('should throw error when updating party type with unknown id', async (): Promise<void> => {
    const partyType: NonPersistedPartyType = {
      type: PartyTypeType.NATURAL_PERSON,
      origin: PartyOrigin.INTERNAL,
      tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
      name: 'example_name',
      description: 'example_description',
    }
    const savedPartyType: PartyType = await contactStore.addPartyType(partyType)
    expect(savedPartyType).toBeDefined()

    const partyTypeId = 'unknownPartyTypeId'
    const updatedPartyType: PartyType = {
      ...savedPartyType,
      id: partyTypeId,
      description: 'new_example_description',
    }

    await expect(contactStore.updatePartyType({ partyType: updatedPartyType })).rejects.toThrow(`No party type found for id: ${partyTypeId}`)
  })

  it('should update party type by id', async (): Promise<void> => {
    const partyType: NonPersistedPartyType = {
      type: PartyTypeType.NATURAL_PERSON,
      origin: PartyOrigin.EXTERNAL,
      tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
      name: 'example_name',
      description: 'example_description',
    }
    const savedPartyType: PartyType = await contactStore.addPartyType(partyType)
    expect(savedPartyType).toBeDefined()

    const newDescription = 'new_example_description'
    const updatedPartyType: PartyType = {
      ...savedPartyType,
      description: newDescription,
    }

    const result: PartyType = await contactStore.updatePartyType({ partyType: updatedPartyType })

    expect(result).toBeDefined()
    expect(result.description).toEqual(newDescription)
  })

  it('should throw error when removing party type with unknown id', async (): Promise<void> => {
    const partyTypeId = 'unknownPartyTypeId'

    await expect(contactStore.removePartyType({ partyTypeId })).rejects.toThrow(`No party type found for id: ${partyTypeId}`)
  })

  it('should remove party type', async (): Promise<void> => {
    const partyType: NonPersistedPartyType = {
      type: PartyTypeType.NATURAL_PERSON,
      origin: PartyOrigin.INTERNAL,
      tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
      name: 'example_name',
      description: 'example_description',
    }
    const savedPartyType: PartyType = await contactStore.addPartyType(partyType)
    expect(savedPartyType).toBeDefined()

    const resultPartyType: PartyType = await contactStore.getPartyType({ partyTypeId: savedPartyType.id })
    expect(resultPartyType).toBeDefined()

    const includingMigrationPartyTypes: Array<PartyType> = await contactStore.getPartyTypes()
    // We are checking for 3 types here as we include the ones from the migrations
    expect(includingMigrationPartyTypes.length).toEqual(3)

    await contactStore.removePartyType({ partyTypeId: savedPartyType.id })

    const result: Array<PartyType> = await contactStore.getPartyTypes()

    expect(result).toBeDefined()
    expect(result.length).toEqual(2)
  })

  it('should throw error when removing party type attached to contact', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.EXTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

    await expect(contactStore.removePartyType({ partyTypeId: savedParty.partyType.id })).rejects.toThrow(
      `Unable to remove party type with id: ${savedParty.partyType.id}. Party type is in use`,
    )
  })

  it('Should save party with existing party type', async (): Promise<void> => {
    const partyType: NonPersistedPartyType = {
      type: PartyTypeType.NATURAL_PERSON,
      origin: PartyOrigin.INTERNAL,
      tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
      name: 'example_name',
    }
    const savedPartyType: PartyType = await contactStore.addPartyType(partyType)
    expect(savedPartyType).toBeDefined()

    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: savedPartyType,
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }

    const result: Party = await contactStore.addParty(party)

    expect(result).toBeDefined()
    expect(result?.partyType).toBeDefined()
    expect(result?.partyType.id).toEqual(savedPartyType.id)
    expect(result?.partyType.type).toEqual(savedPartyType.type)
    expect(result?.partyType.origin).toEqual(savedPartyType.origin)
    expect(result?.partyType.tenantId).toEqual(savedPartyType.tenantId)
    expect(result?.partyType.name).toEqual(savedPartyType.name)
  })

  it('should throw error when adding person party with wrong contact type', async (): Promise<void> => {
    const partyType = PartyTypeType.ORGANIZATION
    const partyTypeOrigin = PartyOrigin.INTERNAL
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: partyType,
        origin: partyTypeOrigin,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }

    await expect(contactStore.addParty(party)).rejects.toThrow(`Party type ${partyType}, does not match for provided contact`)
  })

  it('should throw error when adding organization party with wrong contact type', async (): Promise<void> => {
    const partyType = PartyTypeType.NATURAL_PERSON
    const partyTypeOrigin = PartyOrigin.EXTERNAL
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: partyType,
        origin: partyTypeOrigin,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        legalName: 'example_legal_name',
        displayName: 'example_display_name',
      },
    }

    await expect(contactStore.addParty(party)).rejects.toThrow(`Party type ${partyType}, does not match for provided contact`)
  })

  it('should get electronic address by id', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

    const electronicAddress: NonPersistedElectronicAddress = {
      type: 'email',
      electronicAddress: 'example_electronic_address',
    }
    const savedElectronicAddress: ElectronicAddress = await contactStore.addElectronicAddress({ partyId: savedParty.id, electronicAddress })
    expect(savedElectronicAddress).toBeDefined()

    const result: ElectronicAddress = await contactStore.getElectronicAddress({ electronicAddressId: savedElectronicAddress.id })

    expect(result).toBeDefined()
  })

  it('should throw error when getting electronic address with unknown id', async (): Promise<void> => {
    const electronicAddressId = 'unknownElectronicAddressId'

    await expect(contactStore.getElectronicAddress({ electronicAddressId })).rejects.toThrow(
      `No electronic address found for id: ${electronicAddressId}`,
    )
  })

  it('should get all electronic addresses for contact', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.EXTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

    const electronicAddress1: NonPersistedElectronicAddress = {
      type: 'email',
      electronicAddress: 'example_electronic_address1',
    }
    const savedElectronicAddress1: ElectronicAddress = await contactStore.addElectronicAddress({
      partyId: savedParty.id,
      electronicAddress: electronicAddress1,
    })
    expect(savedElectronicAddress1).toBeDefined()

    const electronicAddress2: NonPersistedElectronicAddress = {
      type: 'email',
      electronicAddress: 'example_electronic_address2',
    }
    const savedElectronicAddress2: ElectronicAddress = await contactStore.addElectronicAddress({
      partyId: savedParty.id,
      electronicAddress: electronicAddress2,
    })
    expect(savedElectronicAddress2).toBeDefined()

    const args: GetElectronicAddressesArgs = {
      filter: [{ partyId: savedParty.id }],
    }

    const result: Array<ElectronicAddress> = await contactStore.getElectronicAddresses(args)

    expect(result.length).toEqual(2)
  })

  it('should get all electronic addresses', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

    const electronicAddress1: NonPersistedElectronicAddress = {
      type: 'email',
      electronicAddress: 'example_electronic_address1',
    }
    const savedElectronicAddress1: ElectronicAddress = await contactStore.addElectronicAddress({
      partyId: savedParty.id,
      electronicAddress: electronicAddress1,
    })
    expect(savedElectronicAddress1).toBeDefined()

    const electronicAddress2: NonPersistedElectronicAddress = {
      type: 'email',
      electronicAddress: 'example_electronic_address2',
    }
    const savedElectronicAddress2: ElectronicAddress = await contactStore.addElectronicAddress({
      partyId: savedParty.id,
      electronicAddress: electronicAddress2,
    })
    expect(savedElectronicAddress2).toBeDefined()

    const result: Array<ElectronicAddress> = await contactStore.getElectronicAddresses()

    expect(result.length).toEqual(2)
  })

  it('should get electronic addresses by filter', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.EXTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

    const electronicAddress = 'example_electronic_address1'
    const electronicAddress1: NonPersistedElectronicAddress = {
      type: 'email',
      electronicAddress,
    }
    const savedElectronicAddress1: ElectronicAddress = await contactStore.addElectronicAddress({
      partyId: savedParty.id,
      electronicAddress: electronicAddress1,
    })
    expect(savedElectronicAddress1).toBeDefined()

    const electronicAddress2: NonPersistedElectronicAddress = {
      type: 'email',
      electronicAddress: 'example_electronic_address2',
    }
    const savedElectronicAddress2: ElectronicAddress = await contactStore.addElectronicAddress({
      partyId: savedParty.id,
      electronicAddress: electronicAddress2,
    })
    expect(savedElectronicAddress2).toBeDefined()

    const args: GetElectronicAddressesArgs = {
      filter: [{ electronicAddress }],
    }

    const result: Array<ElectronicAddress> = await contactStore.getElectronicAddresses(args)

    expect(result.length).toEqual(1)
  })

  it('should add electronic address to contact', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

    const electronicAddress: NonPersistedElectronicAddress = {
      type: 'email',
      electronicAddress: 'example_electronic_address',
    }
    const savedElectronicAddress: ElectronicAddress = await contactStore.addElectronicAddress({ partyId: savedParty.id, electronicAddress })
    expect(savedElectronicAddress).toBeDefined()

    const result: Party = await contactStore.getParty({ partyId: savedParty.id })
    expect(result.electronicAddresses.length).toEqual(1)
  })

  it('should update electronic address by id', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.EXTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

    const electronicAddress: NonPersistedElectronicAddress = {
      type: 'email',
      electronicAddress: 'example_electronic_address',
    }
    const savedElectronicAddress: ElectronicAddress = await contactStore.addElectronicAddress({ partyId: savedParty.id, electronicAddress })
    const newElectronicAddress = 'new_example_electronic_address'
    savedElectronicAddress.electronicAddress = newElectronicAddress

    await contactStore.updateElectronicAddress({ electronicAddress: savedElectronicAddress })
    const result: ElectronicAddress = await contactStore.getElectronicAddress({ electronicAddressId: savedElectronicAddress.id })

    expect(result).toBeDefined()
    expect(result.electronicAddress).toEqual(newElectronicAddress)
  })

  it('should remove electronic address', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

    const electronicAddress: NonPersistedElectronicAddress = {
      type: 'email',
      electronicAddress: 'example_electronic_address',
    }
    const savedElectronicAddress: ElectronicAddress = await contactStore.addElectronicAddress({ partyId: savedParty.id, electronicAddress })
    expect(savedElectronicAddress).toBeDefined()

    await contactStore.removeElectronicAddress({ electronicAddressId: savedElectronicAddress.id })

    await expect(contactStore.getElectronicAddress({ electronicAddressId: savedElectronicAddress.id })).rejects.toThrow(
      `No electronic address found for id: ${savedElectronicAddress.id}`,
    )
  })

  it('should throw error when removing electronic address with unknown id', async (): Promise<void> => {
    const electronicAddressId = 'unknownElectronicAddressId'

    await expect(contactStore.removeElectronicAddress({ electronicAddressId })).rejects.toThrow(
      `No electronic address found for id: ${electronicAddressId}`,
    )
  })

  it('should get physical address by id', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.EXTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

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
    const savedPhysicalAddress: PhysicalAddress = await contactStore.addPhysicalAddress({ partyId: savedParty.id, physicalAddress })
    expect(savedPhysicalAddress).toBeDefined()

    const result: PhysicalAddress = await contactStore.getPhysicalAddress({ physicalAddressId: savedPhysicalAddress.id })

    expect(result).toBeDefined()
  })

  it('should throw error when getting physical address with unknown id', async (): Promise<void> => {
    const physicalAddressId = 'unknownPhysicalAddressId'

    await expect(contactStore.getPhysicalAddress({ physicalAddressId })).rejects.toThrow(`No physical address found for id: ${physicalAddressId}`)
  })

  it('should get all physical addresses for contact', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

    const physicalAddress1: NonPersistedPhysicalAddress = {
      type: 'home',
      streetName: 'example_street_name',
      streetNumber: 'example_street_number',
      buildingName: 'example_building_name',
      postalCode: 'example_postal_code',
      cityName: 'example_city_name',
      provinceName: 'example_province_name',
      countryCode: 'example_country_code',
    }
    const savedPhysicalAddress1: PhysicalAddress = await contactStore.addPhysicalAddress({
      partyId: savedParty.id,
      physicalAddress: physicalAddress1,
    })
    expect(savedPhysicalAddress1).toBeDefined()

    const physicalAddress2: NonPersistedPhysicalAddress = {
      type: 'home',
      streetName: 'example_street_name',
      streetNumber: 'example_street_number',
      buildingName: 'example_building_name',
      postalCode: 'example_postal_code',
      cityName: 'example_city_name',
      provinceName: 'example_province_name',
      countryCode: 'example_country_code',
    }
    const savedPhysicalAddress2: PhysicalAddress = await contactStore.addPhysicalAddress({
      partyId: savedParty.id,
      physicalAddress: physicalAddress2,
    })
    expect(savedPhysicalAddress2).toBeDefined()

    const args: GetPhysicalAddressesArgs = {
      filter: [{ partyId: savedParty.id }],
    }

    const result: Array<PhysicalAddress> = await contactStore.getPhysicalAddresses(args)

    expect(result.length).toEqual(2)
  })

  it('should get all electronic addresses', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.EXTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

    const physicalAddress1: NonPersistedPhysicalAddress = {
      type: 'home',
      streetName: 'example_street_name',
      streetNumber: 'example_street_number',
      buildingName: 'example_building_name',
      postalCode: 'example_postal_code',
      cityName: 'example_city_name',
      provinceName: 'example_province_name',
      countryCode: 'example_country_code',
    }
    const savedPhysicalAddress1: PhysicalAddress = await contactStore.addPhysicalAddress({
      partyId: savedParty.id,
      physicalAddress: physicalAddress1,
    })
    expect(savedPhysicalAddress1).toBeDefined()

    const physicalAddress2: NonPersistedPhysicalAddress = {
      type: 'home',
      streetName: 'example_street_name',
      streetNumber: 'example_street_number',
      buildingName: 'example_building_name',
      postalCode: 'example_postal_code',
      cityName: 'example_city_name',
      provinceName: 'example_province_name',
      countryCode: 'example_country_code',
    }
    const savedPhysicalAddress2: PhysicalAddress = await contactStore.addPhysicalAddress({
      partyId: savedParty.id,
      physicalAddress: physicalAddress2,
    })
    expect(savedPhysicalAddress2).toBeDefined()

    const result: Array<PhysicalAddress> = await contactStore.getPhysicalAddresses()

    expect(result.length).toEqual(2)
  })

  it('should get electronic addresses by filter', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

    const streetName = 'example_electronic_address1'
    const physicalAddress1: NonPersistedPhysicalAddress = {
      type: 'home',
      streetName,
      streetNumber: 'example_street_number1',
      buildingName: 'example_building_name1',
      postalCode: 'example_postal_code1',
      cityName: 'example_city_name1',
      provinceName: 'example_province_name1',
      countryCode: 'example_country_code1',
    }
    const savedPhysicalAddress1: PhysicalAddress = await contactStore.addPhysicalAddress({
      partyId: savedParty.id,
      physicalAddress: physicalAddress1,
    })
    expect(savedPhysicalAddress1).toBeDefined()

    const physicalAddress2: NonPersistedPhysicalAddress = {
      type: 'home',
      streetName: 'example_street_name2',
      streetNumber: 'example_street_number2',
      buildingName: 'example_building_name2',
      postalCode: 'example_postal_code2',
      cityName: 'example_city_name2',
      provinceName: 'example_province_name2',
      countryCode: 'example_country_code2',
    }
    const savedPhysicalAddress2: PhysicalAddress = await contactStore.addPhysicalAddress({
      partyId: savedParty.id,
      physicalAddress: physicalAddress2,
    })
    expect(savedPhysicalAddress2).toBeDefined()

    const args: GetPhysicalAddressesArgs = {
      filter: [{ streetName }],
    }

    const result: Array<PhysicalAddress> = await contactStore.getPhysicalAddresses(args)

    expect(result.length).toEqual(1)
  })

  it('should add physical address to contact', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.EXTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

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
    const savedPhysicalAddress: PhysicalAddress = await contactStore.addPhysicalAddress({ partyId: savedParty.id, physicalAddress })
    expect(savedPhysicalAddress).toBeDefined()

    const result: Party = await contactStore.getParty({ partyId: savedParty.id })
    expect(result.physicalAddresses.length).toEqual(1)
  })

  it('should update physical address by id', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

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
    const savedPhysicalAddress: PhysicalAddress = await contactStore.addPhysicalAddress({ partyId: savedParty.id, physicalAddress })
    const newStreetName = 'new_example_street_name'
    savedPhysicalAddress.streetName = newStreetName

    await contactStore.updatePhysicalAddress({ physicalAddress: savedPhysicalAddress })
    const result: PhysicalAddress = await contactStore.getPhysicalAddress({ physicalAddressId: savedPhysicalAddress.id })

    expect(result).toBeDefined()
    expect(result.streetName).toEqual(newStreetName)
  })

  it('should remove physical address', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.EXTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }
    const savedParty: Party = await contactStore.addParty(party)
    expect(savedParty).toBeDefined()

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
    const savedPhysicalAddress: PhysicalAddress = await contactStore.addPhysicalAddress({ partyId: savedParty.id, physicalAddress })
    expect(savedPhysicalAddress).toBeDefined()

    await contactStore.removePhysicalAddress({ physicalAddressId: savedPhysicalAddress.id })

    await expect(contactStore.getPhysicalAddress({ physicalAddressId: savedPhysicalAddress.id })).rejects.toThrow(
      `No physical address found for id: ${savedPhysicalAddress.id}`,
    )
  })

  it('should throw error when removing physical address with unknown id', async (): Promise<void> => {
    const physicalAddressId = 'unknownPhysicalAddressId'

    await expect(contactStore.removePhysicalAddress({ physicalAddressId })).rejects.toThrow(`No physical address found for id: ${physicalAddressId}`)
  })
})
