import { DataSource, FindOptionsWhere } from 'typeorm'
import { DataStoreContactEntities, DataStoreMigrations, PartyOrigin } from '../index'
import { BaseContactEntity } from '../entities/contact/BaseContactEntity'
import { ConnectionEntity } from '../entities/contact/ConnectionEntity'
import { CorrelationIdentifierEntity } from '../entities/contact/CorrelationIdentifierEntity'
import { DidAuthConfigEntity } from '../entities/contact/DidAuthConfigEntity'
import { ElectronicAddressEntity } from '../entities/contact/ElectronicAddressEntity'
import { IdentityEntity } from '../entities/contact/IdentityEntity'
import { IdentityMetadataItemEntity } from '../entities/contact/IdentityMetadataItemEntity'
import { NaturalPersonEntity } from '../entities/contact/NaturalPersonEntity'
import { OpenIdConfigEntity } from '../entities/contact/OpenIdConfigEntity'
import { OrganizationEntity } from '../entities/contact/OrganizationEntity'
import { PartyEntity } from '../entities/contact/PartyEntity'
import { PartyRelationshipEntity } from '../entities/contact/PartyRelationshipEntity'
import { PartyTypeEntity } from '../entities/contact/PartyTypeEntity'
import { PhysicalAddressEntity } from '../entities/contact/PhysicalAddressEntity'
import {
  ConnectionType,
  CorrelationIdentifierType,
  IdentityRole,
  NaturalPerson,
  NonPersistedConnection,
  NonPersistedDidAuthConfig,
  NonPersistedElectronicAddress,
  NonPersistedIdentity,
  NonPersistedNaturalPerson,
  NonPersistedOpenIdConfig,
  NonPersistedOrganization,
  NonPersistedParty,
  NonPersistedPartyType,
  NonPersistedPhysicalAddress,
  Organization,
  PartyTypeType,
} from '../types'
import {
  connectionEntityFrom,
  didAuthConfigEntityFrom,
  electronicAddressEntityFrom,
  identityEntityFrom,
  naturalPersonEntityFrom,
  openIdConfigEntityFrom,
  organizationEntityFrom,
  partyEntityFrom,
  partyRelationshipEntityFrom,
  partyTypeEntityFrom,
  physicalAddressEntityFrom,
} from '../utils/contact/MappingUtils'

// TODO write test adding two contacts reusing the same contactType

describe('Database entities tests', (): void => {
  let dbConnection: DataSource

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
  })

  afterEach(async (): Promise<void> => {
    await (await dbConnection).destroy()
  })

  it('Should save person party to database', async (): Promise<void> => {
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

    const partyEntity: PartyEntity = partyEntityFrom(party)
    const savedParty: PartyEntity = await dbConnection.getRepository(PartyEntity).save(partyEntity, {
      transaction: true,
    })

    const fromDb: PartyEntity | null = await dbConnection.getRepository(PartyEntity).findOne({
      where: { id: savedParty.id },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.identities?.length).toEqual(0)
    expect(fromDb?.uri).toEqual(party.uri)
    expect(fromDb?.partyType).toBeDefined()
    expect(fromDb?.partyType.type).toEqual(party.partyType.type)
    expect(fromDb?.partyType.origin).toEqual(party.partyType.origin)
    expect(fromDb?.partyType.tenantId).toEqual(party.partyType.tenantId)
    expect(fromDb?.partyType.name).toEqual(party.partyType.name)
    expect(fromDb?.contact).toBeDefined()
    expect((<NaturalPersonEntity>fromDb?.contact).firstName).toEqual((<NaturalPerson>party.contact).firstName)
    expect((<NaturalPersonEntity>fromDb?.contact).middleName).toEqual((<NaturalPerson>party.contact).middleName)
    expect((<NaturalPersonEntity>fromDb?.contact).lastName).toEqual((<NaturalPerson>party.contact).lastName)
    expect((<NaturalPersonEntity>fromDb?.contact).displayName).toEqual((<NaturalPerson>party.contact).displayName)
  })

  it('Should save organization party to database', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.ORGANIZATION,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        legalName: 'example_legal_name',
        displayName: 'example_display_name',
      },
    }

    const partyEntity: PartyEntity = partyEntityFrom(party)
    const savedParty: PartyEntity = await dbConnection.getRepository(PartyEntity).save(partyEntity, {
      transaction: true,
    })

    const fromDb: PartyEntity | null = await dbConnection.getRepository(PartyEntity).findOne({
      where: { id: savedParty.id },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.identities?.length).toEqual(0)
    expect(fromDb?.uri).toEqual(party.uri)
    expect(fromDb?.partyType).toBeDefined()
    expect(fromDb?.partyType.type).toEqual(party.partyType.type)
    expect(fromDb?.partyType.origin).toEqual(party.partyType.origin)
    expect(fromDb?.partyType.tenantId).toEqual(party.partyType.tenantId)
    expect(fromDb?.partyType.name).toEqual(party.partyType.name)
    expect(fromDb?.contact).toBeDefined()
    expect((<OrganizationEntity>fromDb?.contact).legalName).toEqual((<Organization>party.contact).legalName)
    expect((<OrganizationEntity>fromDb?.contact).displayName).toEqual((<Organization>party.contact).displayName)
  })

  it('Should result in party relationship for the owner side only', async (): Promise<void> => {
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

    const partyEntity1: PartyEntity = partyEntityFrom(party1)
    const savedParty1: PartyEntity = await dbConnection.getRepository(PartyEntity).save(partyEntity1, {
      transaction: true,
    })

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

    const partyEntity2: PartyEntity = partyEntityFrom(party2)
    const savedParty2: PartyEntity = await dbConnection.getRepository(PartyEntity).save(partyEntity2, {
      transaction: true,
    })

    const relationship: PartyRelationshipEntity = partyRelationshipEntityFrom({
      leftId: savedParty1.id,
      rightId: savedParty2.id,
    })

    await dbConnection.getRepository(PartyRelationshipEntity).save(relationship, {
      transaction: true,
    })

    const fromDb1: PartyEntity | null = await dbConnection.getRepository(PartyEntity).findOne({
      where: { id: savedParty1.id },
    })

    const fromDb2: PartyEntity | null = await dbConnection.getRepository(PartyEntity).findOne({
      where: { id: savedParty2.id },
    })

    expect(fromDb1).toBeDefined()
    expect(fromDb1?.relationships.length).toEqual(1)
    expect(fromDb2).toBeDefined()
    expect(fromDb2?.relationships.length).toEqual(0)
  })

  it('should throw error when saving person party with blank first name', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName: '',
        middleName: 'example_middle_name1',
        lastName: 'example_last_name1',
        displayName: 'example_display_name1',
      },
    }

    const partyEntity: PartyEntity = partyEntityFrom(party)

    await expect(dbConnection.getRepository(PartyEntity).save(partyEntity)).rejects.toThrowError('Blank first names are not allowed')
  })

  it('should throw error when saving person party with blank middle name', async (): Promise<void> => {
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
        middleName: '',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }

    const partyEntity: PartyEntity = partyEntityFrom(party)

    await expect(dbConnection.getRepository(PartyEntity).save(partyEntity)).rejects.toThrowError('Blank middle names are not allowed')
  })

  it('should throw error when saving person party with blank last name', async (): Promise<void> => {
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
        lastName: '',
        displayName: 'example_display_name',
      },
    }

    const partyEntity: PartyEntity = partyEntityFrom(party)

    await expect(dbConnection.getRepository(PartyEntity).save(partyEntity)).rejects.toThrowError('Blank last names are not allowed')
  })

  it('should throw error when saving person party with blank display name', async (): Promise<void> => {
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
        displayName: '',
      },
    }

    const partyEntity: PartyEntity = partyEntityFrom(party)

    await expect(dbConnection.getRepository(PartyEntity).save(partyEntity)).rejects.toThrowError('Blank display names are not allowed')
  })

  it('should throw error when saving organization party with blank legal name', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.ORGANIZATION,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        legalName: '',
        displayName: 'example_legal_name',
      },
    }

    const partyEntity: PartyEntity = partyEntityFrom(party)

    await expect(dbConnection.getRepository(PartyEntity).save(partyEntity)).rejects.toThrowError('Blank legal names are not allowed')
  })

  it('should throw error when saving organization party with blank display name', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.ORGANIZATION,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        legalName: 'example_first_name',
        displayName: '',
      },
    }

    const partyEntity: PartyEntity = partyEntityFrom(party)

    await expect(dbConnection.getRepository(PartyEntity).save(partyEntity)).rejects.toThrowError('Blank display names are not allowed')
  })

  it('should throw error when saving party with blank party type name', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.EXTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: '',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }

    const partyEntity: PartyEntity = partyEntityFrom(party)

    await expect(dbConnection.getRepository(PartyEntity).save(partyEntity)).rejects.toThrowError('Blank names are not allowed')
  })

  it('should throw error when saving party with blank party type description', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
        description: '',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }

    const partyEntity: PartyEntity = partyEntityFrom(party)

    await expect(dbConnection.getRepository(PartyEntity).save(partyEntity)).rejects.toThrowError('Blank descriptions are not allowed')
  })

  it('should throw error when saving party with blank party type tenant id', async (): Promise<void> => {
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.EXTERNAL,
        tenantId: '',
        name: 'example_name',
      },
      contact: {
        firstName: 'example_first_name',
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }

    const partyEntity: PartyEntity = partyEntityFrom(party)

    await expect(dbConnection.getRepository(PartyEntity).save(partyEntity)).rejects.toThrowError("Blank tenant id's are not allowed")
  })

  it('Should enforce unique alias for an identity', async (): Promise<void> => {
    const alias = 'non_unique_alias'
    const identity1: NonPersistedIdentity = {
      alias,
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
      identifier: {
        type: CorrelationIdentifierType.DID,
        correlationId: 'unique_correlationId1',
      },
    }
    const identity1Entity: IdentityEntity = identityEntityFrom(identity1)
    await dbConnection.getRepository(IdentityEntity).save(identity1Entity)

    const identity2: NonPersistedIdentity = {
      alias: alias,
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
      identifier: {
        type: CorrelationIdentifierType.DID,
        correlationId: 'unique_correlationId2',
      },
    }
    const identity2Entity: IdentityEntity = identityEntityFrom(identity2)
    await expect(dbConnection.getRepository(IdentityEntity).save(identity2Entity)).rejects.toThrowError(
      'SQLITE_CONSTRAINT: UNIQUE constraint failed: Identity.alias',
    )
  })

  it('Should enforce unique correlationId for a identity', async (): Promise<void> => {
    const correlationId = 'non_unique_correlationId'
    const identity1: NonPersistedIdentity = {
      alias: 'unique_alias1',
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
      identifier: {
        type: CorrelationIdentifierType.DID,
        correlationId,
      },
    }
    const identity1Entity: IdentityEntity = identityEntityFrom(identity1)
    await dbConnection.getRepository(IdentityEntity).save(identity1Entity)

    const identity2: NonPersistedIdentity = {
      alias: 'unique_alias2',
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
      identifier: {
        type: CorrelationIdentifierType.DID,
        correlationId,
      },
    }
    const identity2Entity: IdentityEntity = identityEntityFrom(identity2)
    await expect(dbConnection.getRepository(IdentityEntity).save(identity2Entity)).rejects.toThrowError(
      'SQLITE_CONSTRAINT: UNIQUE constraint failed: CorrelationIdentifier.correlation_id',
    )
  })

  it('Should save identity to database', async (): Promise<void> => {
    const correlationId = 'example_did'
    const identity: NonPersistedIdentity = {
      alias: correlationId,
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
      identifier: {
        type: CorrelationIdentifierType.DID,
        correlationId,
      },
    }

    const identityEntity: IdentityEntity = identityEntityFrom(identity)

    await dbConnection.getRepository(IdentityEntity).save(identityEntity)

    const fromDb: IdentityEntity | null = await dbConnection.getRepository(IdentityEntity).findOne({
      where: {
        identifier: {
          correlationId,
        },
      },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.connection).toBeNull()
    expect(fromDb?.identifier).toBeDefined()
    expect(fromDb?.identifier.correlationId).toEqual(identity.identifier.correlationId)
    expect(fromDb?.identifier.type).toEqual(identity.identifier.type)
  })

  it('should throw error when saving identity with blank alias', async (): Promise<void> => {
    const identity: NonPersistedIdentity = {
      alias: '',
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
      identifier: {
        type: CorrelationIdentifierType.DID,
        correlationId: 'example_did',
      },
    }

    const identityEntity: IdentityEntity = identityEntityFrom(identity)

    await expect(dbConnection.getRepository(IdentityEntity).save(identityEntity)).rejects.toThrowError('Blank aliases are not allowed')
  })

  it('should throw error when saving identity with blank correlation id', async (): Promise<void> => {
    const identity: NonPersistedIdentity = {
      alias: 'example_did',
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
      identifier: {
        type: CorrelationIdentifierType.DID,
        correlationId: '',
      },
    }

    const identityEntity: IdentityEntity = identityEntityFrom(identity)

    await expect(dbConnection.getRepository(IdentityEntity).save(identityEntity)).rejects.toThrowError('Blank correlation ids are not allowed')
  })

  it('should throw error when saving identity with blank metadata label', async (): Promise<void> => {
    const correlationId = 'example_did'
    const identity: NonPersistedIdentity = {
      alias: correlationId,
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
      identifier: {
        type: CorrelationIdentifierType.DID,
        correlationId,
      },
      metadata: [
        {
          label: '',
          value: 'example_value',
        },
      ],
    }

    const identityEntity: IdentityEntity = identityEntityFrom(identity)

    await expect(dbConnection.getRepository(IdentityEntity).save(identityEntity)).rejects.toThrowError('Blank metadata labels are not allowed')
  })

  it('should throw error when saving identity with blank metadata value', async (): Promise<void> => {
    const correlationId = 'example_did'
    const identity: NonPersistedIdentity = {
      alias: correlationId,
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
      identifier: {
        type: CorrelationIdentifierType.DID,
        correlationId,
      },
      metadata: [
        {
          label: 'example_label',
          value: '',
        },
      ],
    }

    const identityEntity: IdentityEntity = identityEntityFrom(identity)

    await expect(dbConnection.getRepository(IdentityEntity).save(identityEntity)).rejects.toThrowError('Blank metadata values are not allowed')
  })

  it('Should save identity with openid connection to database', async (): Promise<void> => {
    const correlationId = 'example.com'
    const identity: NonPersistedIdentity = {
      alias: correlationId,
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
      identifier: {
        type: CorrelationIdentifierType.URL,
        correlationId,
      },
      connection: {
        type: ConnectionType.OPENID_CONNECT,
        config: {
          clientId: '138d7bf8-c930-4c6e-b928-97d3a4928b01',
          clientSecret: '03b3955f-d020-4f2a-8a27-4e452d4e27a0',
          scopes: ['auth'],
          issuer: 'https://example.com/app-test',
          redirectUrl: 'app:/callback',
          dangerouslyAllowInsecureHttpRequests: true,
          clientAuthMethod: <const>'post',
        },
      },
    }

    const identityEntity: IdentityEntity = identityEntityFrom(identity)

    await dbConnection.getRepository(IdentityEntity).save(identityEntity)

    const fromDb: IdentityEntity | null = await dbConnection.getRepository(IdentityEntity).findOne({
      where: {
        identifier: {
          correlationId,
        },
      },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.connection).toBeDefined()
    expect(fromDb?.identifier).toBeDefined()
    expect(fromDb?.identifier.correlationId).toEqual(identity.identifier.correlationId)
    expect(fromDb?.identifier.type).toEqual(identity.identifier.type)
    expect(fromDb?.connection?.type).toEqual(identity.connection?.type)
    expect(fromDb?.connection?.config).toBeDefined()
    expect((<OpenIdConfigEntity>fromDb?.connection?.config).clientId).toEqual((<NonPersistedOpenIdConfig>identity.connection?.config).clientId)
  })

  it('Should save identity with didauth connection to database', async (): Promise<void> => {
    const correlationId = 'example.com'
    const identity: NonPersistedIdentity = {
      alias: correlationId,
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
      identifier: {
        type: CorrelationIdentifierType.URL,
        correlationId,
      },
      connection: {
        type: ConnectionType.SIOPv2,
        config: {
          identifier: {
            did: 'did:test:138d7bf8-c930-4c6e-b928-97d3a4928b01',
            provider: 'test_provider',
            keys: [],
            services: [],
          },
          redirectUrl: 'https://example.com',
          stateId: 'e91f3510-5ce9-42ee-83b7-fa68ff323d27',
          sessionId: 'https://example.com/did:test:138d7bf8-c930-4c6e-b928-97d3a4928b01',
        },
      },
    }

    const identityEntity: IdentityEntity = identityEntityFrom(identity)

    await dbConnection.getRepository(IdentityEntity).save(identityEntity)

    const fromDb: IdentityEntity | null = await dbConnection.getRepository(IdentityEntity).findOne({
      where: {
        identifier: {
          correlationId,
        },
      },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.connection).toBeDefined()
    expect(fromDb?.identifier).toBeDefined()
    expect(fromDb?.identifier.correlationId).toEqual(identity.identifier.correlationId)
    expect(fromDb?.identifier.type).toEqual(identity.identifier.type)
    expect(fromDb?.connection?.type).toEqual(identity.connection?.type)
    expect(fromDb?.connection?.config).toBeDefined()
    expect((<DidAuthConfigEntity>fromDb?.connection?.config).identifier).toEqual(
      (<NonPersistedDidAuthConfig>identity.connection?.config).identifier.did,
    )
  })

  it('Should save connection with openid config to database', async (): Promise<void> => {
    const connection: NonPersistedConnection = {
      type: ConnectionType.OPENID_CONNECT,
      config: {
        clientId: '138d7bf8-c930-4c6e-b928-97d3a4928b01',
        clientSecret: '03b3955f-d020-4f2a-8a27-4e452d4e27a0',
        scopes: ['auth'],
        issuer: 'https://example.com/app-test',
        redirectUrl: 'app:/callback',
        dangerouslyAllowInsecureHttpRequests: true,
        clientAuthMethod: <const>'post',
      },
    }
    const connectionEntity: ConnectionEntity = connectionEntityFrom(connection)
    await dbConnection.getRepository(ConnectionEntity).save(connectionEntity, {
      transaction: true,
    })

    const fromDb: ConnectionEntity | null = await dbConnection.getRepository(ConnectionEntity).findOne({
      where: { type: connection.type },
    })

    expect(fromDb).toBeDefined()

    const fromDbConfig: OpenIdConfigEntity | null = await dbConnection.getRepository(OpenIdConfigEntity).findOne({
      where: { id: fromDb?.id },
    })

    expect(fromDbConfig).toBeDefined()
    expect(fromDb?.type).toEqual(connection.type)
    expect(fromDb?.config).toBeDefined()
    expect((<OpenIdConfigEntity>fromDb?.config).clientId).toEqual((<NonPersistedOpenIdConfig>connection.config).clientId)
  })

  it('Should save connection with didauth config to database', async (): Promise<void> => {
    const connection: NonPersistedConnection = {
      type: ConnectionType.SIOPv2,
      config: {
        identifier: {
          did: 'did:test:138d7bf8-c930-4c6e-b928-97d3a4928b01',
          provider: 'test_provider',
          keys: [],
          services: [],
        },
        redirectUrl: 'https://example.com',
        stateId: 'e91f3510-5ce9-42ee-83b7-fa68ff323d27',
        sessionId: 'https://example.com/did:test:138d7bf8-c930-4c6e-b928-97d3a4928b01',
      },
    }
    const connectionEntity: ConnectionEntity = connectionEntityFrom(connection)
    await dbConnection.getRepository(ConnectionEntity).save(connectionEntity, {
      transaction: true,
    })

    const fromDb: ConnectionEntity | null = await dbConnection.getRepository(ConnectionEntity).findOne({
      where: { type: connection.type },
    })

    expect(fromDb).toBeDefined()

    const fromDbConfig: DidAuthConfigEntity | null = await dbConnection.getRepository(DidAuthConfigEntity).findOne({
      where: { id: fromDb?.id },
    })

    expect(fromDbConfig).toBeDefined()
    expect(fromDb?.type).toEqual(connection.type)
    expect(fromDb?.config).toBeDefined()
    expect((<DidAuthConfigEntity>fromDb?.config).identifier).toEqual((<NonPersistedDidAuthConfig>connection.config).identifier.did)
  })

  it('Should save openid config to database', async (): Promise<void> => {
    const clientId = '138d7bf8-c930-4c6e-b928-97d3a4928b01'
    const config: NonPersistedOpenIdConfig = {
      clientId,
      clientSecret: '03b3955f-d020-4f2a-8a27-4e452d4e27a0',
      scopes: ['auth'],
      issuer: 'https://example.com/app-test',
      redirectUrl: 'app:/callback',
      dangerouslyAllowInsecureHttpRequests: true,
      clientAuthMethod: <const>'post',
    }

    const configEntity: OpenIdConfigEntity = openIdConfigEntityFrom(config)
    await dbConnection.getRepository(OpenIdConfigEntity).save(configEntity, {
      transaction: true,
    })

    const fromDb: OpenIdConfigEntity | null = await dbConnection.getRepository(OpenIdConfigEntity).findOne({
      where: { clientId: config.clientId },
    })

    expect(fromDb).toBeDefined()
    expect((<OpenIdConfigEntity>fromDb).clientId).toEqual(config.clientId)
  })

  it('Should save didauth config to database', async (): Promise<void> => {
    const sessionId = 'https://example.com/did:test:138d7bf8-c930-4c6e-b928-97d3a4928b01'
    const config: NonPersistedDidAuthConfig = {
      identifier: {
        did: 'did:test:138d7bf8-c930-4c6e-b928-97d3a4928b01',
        provider: 'test_provider',
        keys: [],
        services: [],
      },
      redirectUrl: 'https://example.com',
      stateId: 'e91f3510-5ce9-42ee-83b7-fa68ff323d27',
      sessionId,
    }

    const configEntity: DidAuthConfigEntity = didAuthConfigEntityFrom(config)
    await dbConnection.getRepository(DidAuthConfigEntity).save(configEntity, {
      transaction: true,
    })

    const fromDb: DidAuthConfigEntity | null = await dbConnection.getRepository(DidAuthConfigEntity).findOne({
      where: { sessionId: config.sessionId },
    })

    expect(fromDb).toBeDefined()
    expect((<DidAuthConfigEntity>fromDb).identifier).toEqual(config.identifier.did)
  })

  it('Should delete party and all child relations', async (): Promise<void> => {
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

    const partyEntity1: PartyEntity = partyEntityFrom(party1)
    const savedParty1: PartyEntity | null = await dbConnection.getRepository(PartyEntity).save(partyEntity1)

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

    const partyEntity2: PartyEntity = partyEntityFrom(party2)
    const savedParty2: PartyEntity | null = await dbConnection.getRepository(PartyEntity).save(partyEntity2)

    expect(savedParty2).toBeDefined()

    const correlationId = 'relation_example.com'
    const identity: NonPersistedIdentity = {
      alias: correlationId,
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
      identifier: {
        type: CorrelationIdentifierType.URL,
        correlationId,
      },
      connection: {
        type: ConnectionType.OPENID_CONNECT,
        config: {
          clientId: '138d7bf8-c930-4c6e-b928-97d3a4928b01',
          clientSecret: '03b3955f-d020-4f2a-8a27-4e452d4e27a0',
          scopes: ['auth'],
          issuer: 'https://example.com/app-test',
          redirectUrl: 'app:/callback',
          dangerouslyAllowInsecureHttpRequests: true,
          clientAuthMethod: <const>'post',
        },
      },
      metadata: [
        {
          label: 'example_label',
          value: 'example_value',
        },
      ],
    }

    const identityEntity: IdentityEntity = identityEntityFrom(identity)
    identityEntity.party = savedParty1

    const savedIdentity: IdentityEntity | null = await dbConnection.getRepository(IdentityEntity).save(identityEntity)

    expect(savedIdentity).toBeDefined()

    const electronicAddress: NonPersistedElectronicAddress = {
      type: 'email',
      electronicAddress: 'example_electronic_address',
    }
    const electronicAddressEntity: ElectronicAddressEntity = electronicAddressEntityFrom(electronicAddress)
    electronicAddressEntity.party = savedParty1

    const savedElectronicAddress: ElectronicAddressEntity | null = await dbConnection
      .getRepository(ElectronicAddressEntity)
      .save(electronicAddressEntity)

    expect(savedElectronicAddress).toBeDefined()

    const relationship: PartyRelationshipEntity = partyRelationshipEntityFrom({
      leftId: savedParty1.id,
      rightId: savedParty2.id,
    })

    const savedRelationship: PartyRelationshipEntity | null = await dbConnection.getRepository(PartyRelationshipEntity).save(relationship, {
      transaction: true,
    })

    expect(savedRelationship).toBeDefined()

    expect(
      await dbConnection.getRepository(PartyEntity).findOne({
        where: { id: savedParty1.id },
      }),
    ).toBeDefined()

    await dbConnection.getRepository(PartyEntity).delete({ id: savedParty1.id })

    // check party
    await expect(
      await dbConnection.getRepository(PartyEntity).findOne({
        where: { id: savedParty1.id },
      }),
    ).toBeNull()

    // check identity
    expect(
      await dbConnection.getRepository(IdentityEntity).findOne({
        where: { id: savedParty1.id },
      }),
    ).toBeNull()

    // check identity identifier
    expect(
      await dbConnection.getRepository(CorrelationIdentifierEntity).findOne({
        where: { id: savedIdentity.identifier.id },
      }),
    ).toBeNull()

    // check identity connection
    expect(
      await dbConnection.getRepository(ConnectionEntity).findOne({
        where: { id: savedIdentity.connection!.id },
      }),
    ).toBeNull()

    // check connection config
    expect(
      await dbConnection.getRepository(OpenIdConfigEntity).findOne({
        where: { id: savedIdentity.connection!.config.id },
      }),
    ).toBeNull()

    // check identity metadata
    expect(
      await dbConnection.getRepository(IdentityMetadataItemEntity).findOne({
        where: { id: savedIdentity.metadata![0].id },
      }),
    ).toBeNull()

    // check electronic address
    expect(
      await dbConnection.getRepository(ElectronicAddressEntity).findOne({
        where: { id: savedParty1.id },
      }),
    ).toBeNull()

    // check contact
    expect(
      await dbConnection.getRepository(BaseContactEntity).findOne({
        where: { id: savedParty1.contact.id },
      }),
    ).toBeNull()

    // check party type
    expect(
      await dbConnection.getRepository(PartyTypeEntity).findOne({
        where: { id: savedParty1.partyType.id },
      }),
    ).toBeDefined()

    // check relation
    expect(
      await dbConnection.getRepository(PartyRelationshipEntity).findOne({
        where: { id: savedRelationship.id },
      }),
    ).toBeNull()
  })

  it('Should delete identity and all child relations', async (): Promise<void> => {
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

    const partyEntity: PartyEntity = partyEntityFrom(party)
    const savedParty: PartyEntity | null = await dbConnection.getRepository(PartyEntity).save(partyEntity)

    expect(savedParty).toBeDefined()

    const correlationId = 'relation_example.com'
    const identity: NonPersistedIdentity = {
      alias: correlationId,
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
      identifier: {
        type: CorrelationIdentifierType.URL,
        correlationId,
      },
      connection: {
        type: ConnectionType.SIOPv2,
        config: {
          identifier: {
            did: 'did:test:138d7bf8-c930-4c6e-b928-97d3a4928b01',
            provider: 'test_provider',
            keys: [],
            services: [],
          },
          redirectUrl: 'https://example.com',
          stateId: 'e91f3510-5ce9-42ee-83b7-fa68ff323d27',
          sessionId: 'https://example.com/did:test:138d7bf8-c930-4c6e-b928-97d3a4928b01',
        },
      },
      metadata: [
        {
          label: 'example_label',
          value: 'example_value',
        },
      ],
    }

    const identityEntity: IdentityEntity = identityEntityFrom(identity)
    identityEntity.party = savedParty

    const savedIdentity: IdentityEntity | null = await dbConnection.getRepository(IdentityEntity).save(identityEntity)

    expect(
      await dbConnection.getRepository(PartyEntity).findOne({
        where: { id: savedParty.id },
      }),
    ).toBeDefined()

    await dbConnection.getRepository(IdentityEntity).delete({ id: savedIdentity.id })

    // check identity
    expect(
      await dbConnection.getRepository(IdentityEntity).findOne({
        where: { alias: correlationId },
      }),
    ).toBeNull()

    // check identity identifier
    expect(
      await dbConnection.getRepository(CorrelationIdentifierEntity).findOne({
        where: { id: savedIdentity.identifier.id },
      }),
    ).toBeNull()

    // check identity connection
    expect(
      await dbConnection.getRepository(ConnectionEntity).findOne({
        where: { id: savedIdentity.connection!.id },
      }),
    ).toBeNull()

    // check connection config
    expect(
      await dbConnection.getRepository(OpenIdConfigEntity).findOne({
        where: { id: savedIdentity.connection!.config.id },
      }),
    ).toBeNull()

    // check identity metadata
    expect(
      await dbConnection.getRepository(IdentityMetadataItemEntity).findOne({
        where: { id: savedIdentity.metadata![0].id },
      }),
    ).toBeNull()
  })

  it('Should not delete party when deleting identity', async (): Promise<void> => {
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

    const partyEntity: PartyEntity = partyEntityFrom(party)
    const savedParty: PartyEntity | null = await dbConnection.getRepository(PartyEntity).save(partyEntity)

    expect(savedParty).toBeDefined()

    const correlationId = 'relation_example.com'
    const identity: NonPersistedIdentity = {
      alias: correlationId,
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
      identifier: {
        type: CorrelationIdentifierType.URL,
        correlationId,
      },
      connection: {
        type: ConnectionType.SIOPv2,
        config: {
          identifier: {
            did: 'did:test:138d7bf8-c930-4c6e-b928-97d3a4928b01',
            provider: 'test_provider',
            keys: [],
            services: [],
          },
          redirectUrl: 'https://example.com',
          stateId: 'e91f3510-5ce9-42ee-83b7-fa68ff323d27',
          sessionId: 'https://example.com/did:test:138d7bf8-c930-4c6e-b928-97d3a4928b01',
        },
      },
      metadata: [
        {
          label: 'example_label',
          value: 'example_value',
        },
      ],
    }

    const identityEntity: IdentityEntity = identityEntityFrom(identity)
    identityEntity.party = savedParty

    const savedIdentity: IdentityEntity | null = await dbConnection.getRepository(IdentityEntity).save(identityEntity)

    expect(savedIdentity).toBeDefined()

    await dbConnection.getRepository(IdentityEntity).delete({ id: savedIdentity.id })

    // check identity
    expect(
      await dbConnection.getRepository(IdentityEntity).findOne({
        where: { id: savedIdentity.id },
      }),
    ).toBeNull()

    // check party
    expect(
      await dbConnection.getRepository(PartyEntity).findOne({
        where: { id: savedParty.id },
      }),
    ).toBeDefined()
  })

  it('Should set creation date when saving party', async (): Promise<void> => {
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

    const partyEntity: PartyEntity = partyEntityFrom(party)
    const savedParty: PartyEntity | null = await dbConnection.getRepository(PartyEntity).save(partyEntity)

    const fromDb: PartyEntity | null = await dbConnection.getRepository(PartyEntity).findOne({
      where: { id: savedParty.id },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.createdAt).toBeDefined()
  })

  it('Should not update creation date when updating party', async (): Promise<void> => {
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

    const partyEntity: PartyEntity = partyEntityFrom(party)
    const savedParty: PartyEntity | null = await dbConnection.getRepository(PartyEntity).save(partyEntity)

    expect(savedParty).toBeDefined()

    const newContactFirstName = 'new_first_name'
    await dbConnection.getRepository(PartyEntity).save({
      ...savedParty,
      contact: {
        ...savedParty.contact,
        firstName: newContactFirstName,
      },
    })

    const fromDb: PartyEntity | null = await dbConnection.getRepository(PartyEntity).findOne({
      where: { id: savedParty.id },
    })

    expect(fromDb).toBeDefined()
    expect((<NaturalPersonEntity>fromDb?.contact).firstName).toEqual(newContactFirstName)
    expect(fromDb?.createdAt).toEqual(savedParty?.createdAt)
  })

  it('Should set creation date when saving identity', async (): Promise<void> => {
    const correlationId = 'example_did'
    const identity: NonPersistedIdentity = {
      alias: correlationId,
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
      identifier: {
        type: CorrelationIdentifierType.DID,
        correlationId,
      },
    }

    const identityEntity: IdentityEntity = identityEntityFrom(identity)
    await dbConnection.getRepository(IdentityEntity).save(identityEntity)

    const fromDb: IdentityEntity | null = await dbConnection.getRepository(IdentityEntity).findOne({
      where: {
        identifier: {
          correlationId,
        },
      },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.createdAt).toBeDefined()
  })

  it('Should not update creation date when saving identity', async (): Promise<void> => {
    const correlationId = 'example_did'
    const identity: NonPersistedIdentity = {
      alias: correlationId,
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
      identifier: {
        type: CorrelationIdentifierType.DID,
        correlationId,
      },
    }

    const identityEntity: IdentityEntity = identityEntityFrom(identity)
    const savedIdentity: IdentityEntity | null = await dbConnection.getRepository(IdentityEntity).save(identityEntity)
    const newCorrelationId = 'new_example_did'
    await dbConnection
      .getRepository(IdentityEntity)
      .save({ ...savedIdentity, identifier: { ...savedIdentity.identifier, correlationId: newCorrelationId } })

    const fromDb: IdentityEntity | null = await dbConnection.getRepository(IdentityEntity).findOne({
      where: {
        identifier: {
          correlationId: newCorrelationId,
        },
      },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.createdAt).toEqual(savedIdentity?.createdAt)
  })

  it('Should set last updated date when saving party', async (): Promise<void> => {
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

    const partyEntity: PartyEntity = partyEntityFrom(party)
    const savedParty: PartyEntity | null = await dbConnection.getRepository(PartyEntity).save(partyEntity)

    const fromDb: PartyEntity | null = await dbConnection.getRepository(PartyEntity).findOne({
      where: { id: savedParty.id },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.lastUpdatedAt).toBeDefined()
  })

  it('Should update last updated date when updating party', async (): Promise<void> => {
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

    const partyEntity: PartyEntity = partyEntityFrom(party)
    const savedParty: PartyEntity | null = await dbConnection.getRepository(PartyEntity).save(partyEntity)
    expect(savedParty).toBeDefined()

    // waiting here to get a different timestamp
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const newContactFirstName = 'new_first_name'
    await dbConnection.getRepository(PartyEntity).save({
      ...savedParty,
      // FIXME there is still an issue when updating nested objects, the parent does not update
      // https://github.com/typeorm/typeorm/issues/5378
      uri: 'new uri', // TODO remove this to trigger the bug
      contact: {
        ...savedParty.contact,
        firstName: newContactFirstName,
      },
    })

    const fromDb: PartyEntity | null = await dbConnection.getRepository(PartyEntity).findOne({
      where: { id: savedParty.id },
    })

    expect(fromDb).toBeDefined()
    expect((<NaturalPersonEntity>fromDb?.contact).firstName).toEqual(newContactFirstName)
    expect(fromDb?.lastUpdatedAt).not.toEqual(savedParty?.lastUpdatedAt)
  })

  it('Should set last updated date when saving party type', async (): Promise<void> => {
    const partyType: NonPersistedPartyType = {
      type: PartyTypeType.NATURAL_PERSON,
      origin: PartyOrigin.EXTERNAL,
      tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
      name: 'example_name',
    }

    const partyTypeEntity: PartyTypeEntity = partyTypeEntityFrom(partyType)
    const savedPartyType: PartyTypeEntity | null = await dbConnection.getRepository(PartyTypeEntity).save(partyTypeEntity)

    const fromDb: PartyTypeEntity | null = await dbConnection.getRepository(PartyTypeEntity).findOne({
      where: { id: savedPartyType.id },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.lastUpdatedAt).toBeDefined()
  })

  it('Should set last creation date when saving party type', async (): Promise<void> => {
    const partyType: NonPersistedPartyType = {
      type: PartyTypeType.NATURAL_PERSON,
      origin: PartyOrigin.INTERNAL,
      tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
      name: 'example_name',
    }

    const partyTypeEntity: PartyTypeEntity = partyTypeEntityFrom(partyType)
    const savedPartyType: PartyTypeEntity | null = await dbConnection.getRepository(PartyTypeEntity).save(partyTypeEntity)

    const fromDb: PartyTypeEntity | null = await dbConnection.getRepository(PartyTypeEntity).findOne({
      where: { id: savedPartyType.id },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.createdAt).toBeDefined()
  })

  it('Should set last updated date when saving identity', async (): Promise<void> => {
    const correlationId = 'example_did'
    const identity: NonPersistedIdentity = {
      alias: correlationId,
      roles: [IdentityRole.ISSUER, IdentityRole.VERIFIER],
      identifier: {
        type: CorrelationIdentifierType.DID,
        correlationId,
      },
    }

    const identityEntity: IdentityEntity = identityEntityFrom(identity)
    await dbConnection.getRepository(IdentityEntity).save(identityEntity)

    const fromDb: IdentityEntity | null = await dbConnection.getRepository(IdentityEntity).findOne({
      where: {
        identifier: {
          correlationId,
        },
      },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.lastUpdatedAt).toBeDefined()
  })

  it('Should enforce unique type and tenant id combination when saving party type', async (): Promise<void> => {
    const tenantId = 'non_unique_value'
    const name = 'non_unique_value'
    const partyType1: NonPersistedPartyType = {
      type: PartyTypeType.NATURAL_PERSON,
      origin: PartyOrigin.EXTERNAL,
      tenantId,
      name,
    }

    const partyTypeEntity1: PartyTypeEntity = partyTypeEntityFrom(partyType1)
    const savedPartyType1: PartyTypeEntity | null = await dbConnection.getRepository(PartyTypeEntity).save(partyTypeEntity1)

    expect(savedPartyType1).toBeDefined()

    const partyType2: NonPersistedPartyType = {
      type: PartyTypeType.NATURAL_PERSON,
      origin: PartyOrigin.INTERNAL,
      tenantId,
      name,
    }

    const partyTypeEntity2: PartyTypeEntity = partyTypeEntityFrom(partyType2)
    await expect(dbConnection.getRepository(PartyTypeEntity).save(partyTypeEntity2)).rejects.toThrowError(
      'SQLITE_CONSTRAINT: UNIQUE constraint failed: PartyType.type, PartyType.tenant_id',
    )
  })

  it('Should enforce unique name when saving party type', async (): Promise<void> => {
    const name = 'non_unique_value'
    const partyType1: NonPersistedPartyType = {
      type: PartyTypeType.NATURAL_PERSON,
      origin: PartyOrigin.INTERNAL,
      tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
      name,
    }

    const partyTypeEntity1: PartyTypeEntity = partyTypeEntityFrom(partyType1)
    const savedPartyType1: PartyTypeEntity | null = await dbConnection.getRepository(PartyTypeEntity).save(partyTypeEntity1)

    expect(savedPartyType1).toBeDefined()

    const partyType2: NonPersistedPartyType = {
      type: PartyTypeType.NATURAL_PERSON,
      origin: PartyOrigin.INTERNAL,
      tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
      name,
    }

    const partyTypeEntity2: PartyTypeEntity = partyTypeEntityFrom(partyType2)
    await expect(dbConnection.getRepository(PartyTypeEntity).save(partyTypeEntity2)).rejects.toThrowError(
      'SQLITE_CONSTRAINT: UNIQUE constraint failed: PartyType.name',
    )
  })

  it('Should enforce unique legal name when saving organization', async (): Promise<void> => {
    const legalName = 'non_unique_value'
    const organization1: NonPersistedOrganization = {
      legalName,
      displayName: 'example_display_name',
    }

    const organizationEntity1: OrganizationEntity = organizationEntityFrom(organization1)
    const savedOrganization1: OrganizationEntity | null = await dbConnection.getRepository(OrganizationEntity).save(organizationEntity1, {
      transaction: true,
    })

    expect(savedOrganization1).toBeDefined()

    const organization2: NonPersistedOrganization = {
      legalName,
      displayName: 'example_display_name',
    }

    const organizationEntity2: OrganizationEntity = organizationEntityFrom(organization2)
    await expect(dbConnection.getRepository(OrganizationEntity).save(organizationEntity2)).rejects.toThrowError(
      'SQLITE_CONSTRAINT: UNIQUE constraint failed: BaseContact.legal_name',
    )
  })

  it('Should enforce unique legal name when saving organization', async (): Promise<void> => {
    const legalName = 'example_legal_name'
    const organization1: NonPersistedOrganization = {
      legalName,
      displayName: 'example_display_name',
    }

    const organizationEntity1: OrganizationEntity = organizationEntityFrom(organization1)
    const savedOrganization1: OrganizationEntity | null = await dbConnection.getRepository(OrganizationEntity).save(organizationEntity1, {
      transaction: true,
    })

    expect(savedOrganization1).toBeDefined()

    const organization2: NonPersistedOrganization = {
      legalName,
      displayName: 'example_display_name',
    }

    const organizationEntity2: OrganizationEntity = organizationEntityFrom(organization2)
    await expect(dbConnection.getRepository(OrganizationEntity).save(organizationEntity2)).rejects.toThrowError(
      'SQLITE_CONSTRAINT: UNIQUE constraint failed: BaseContact.legal_name',
    )
  })

  it('Should save party relationship to database', async (): Promise<void> => {
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

    const partyEntity1: PartyEntity = partyEntityFrom(party1)
    const savedParty1: PartyEntity = await dbConnection.getRepository(PartyEntity).save(partyEntity1, {
      transaction: true,
    })

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

    const partyEntity2: PartyEntity = partyEntityFrom(party2)
    const savedParty2: PartyEntity = await dbConnection.getRepository(PartyEntity).save(partyEntity2, {
      transaction: true,
    })

    expect(savedParty2).toBeDefined()

    const relationship: PartyRelationshipEntity = partyRelationshipEntityFrom({
      leftId: savedParty1.id,
      rightId: savedParty2.id,
    })

    await dbConnection.getRepository(PartyRelationshipEntity).save(relationship, {
      transaction: true,
    })

    // TODO check the relation field
    const fromDb: PartyEntity | null = await dbConnection.getRepository(PartyEntity).findOne({
      where: { id: partyEntity1.id },
    })

    expect(fromDb).toBeDefined()
  })

  it('Should set last updated date when saving party relationship', async (): Promise<void> => {
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

    const partyEntity1: PartyEntity = partyEntityFrom(party1)
    const savedParty1: PartyEntity = await dbConnection.getRepository(PartyEntity).save(partyEntity1, {
      transaction: true,
    })

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

    const partyEntity2: PartyEntity = partyEntityFrom(party2)
    const savedParty2: PartyEntity = await dbConnection.getRepository(PartyEntity).save(partyEntity2, {
      transaction: true,
    })

    const relationship: PartyRelationshipEntity = partyRelationshipEntityFrom({
      leftId: savedParty1.id,
      rightId: savedParty2.id,
    })

    await dbConnection.getRepository(PartyRelationshipEntity).save(relationship, {
      transaction: true,
    })

    const fromDb: PartyEntity | null = await dbConnection.getRepository(PartyEntity).findOne({
      where: { id: partyEntity1.id },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.lastUpdatedAt).toBeDefined()
  })

  it('Should set creation date when saving party relationship', async (): Promise<void> => {
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

    const partyEntity1: PartyEntity = partyEntityFrom(party1)
    const savedParty1: PartyEntity = await dbConnection.getRepository(PartyEntity).save(partyEntity1, {
      transaction: true,
    })

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

    const partyEntity2: PartyEntity = partyEntityFrom(party2)
    const savedParty2: PartyEntity = await dbConnection.getRepository(PartyEntity).save(partyEntity2, {
      transaction: true,
    })

    const relationship: PartyRelationshipEntity = partyRelationshipEntityFrom({
      leftId: savedParty1.id,
      rightId: savedParty2.id,
    })

    await dbConnection.getRepository(PartyRelationshipEntity).save(relationship, {
      transaction: true,
    })

    const fromDb: PartyEntity | null = await dbConnection.getRepository(PartyEntity).findOne({
      where: { id: partyEntity1.id },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.createdAt).toBeDefined()
  })

  it('Should save bidirectional party relationships to database', async (): Promise<void> => {
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

    const partyEntity1: PartyEntity = partyEntityFrom(party1)
    const savedParty1: PartyEntity = await dbConnection.getRepository(PartyEntity).save(partyEntity1, {
      transaction: true,
    })

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

    const partyEntity2: PartyEntity = partyEntityFrom(party2)
    const savedParty2: PartyEntity = await dbConnection.getRepository(PartyEntity).save(partyEntity2, {
      transaction: true,
    })

    expect(savedParty2).toBeDefined()

    const relationship1: PartyRelationshipEntity = partyRelationshipEntityFrom({
      leftId: savedParty1.id,
      rightId: savedParty2.id,
    })

    const savedRelationship1: PartyRelationshipEntity | null = await dbConnection.getRepository(PartyRelationshipEntity).save(relationship1, {
      transaction: true,
    })

    expect(savedRelationship1).toBeDefined()

    const relationship2: PartyRelationshipEntity = partyRelationshipEntityFrom({
      leftId: savedParty2.id,
      rightId: savedParty1.id,
    })

    const savedRelationship2: PartyRelationshipEntity | null = await dbConnection.getRepository(PartyRelationshipEntity).save(relationship2, {
      transaction: true,
    })

    expect(savedRelationship2).toBeDefined()

    const fromDb: PartyRelationshipEntity | null = await dbConnection.getRepository(PartyRelationshipEntity).findOne({
      where: { id: savedRelationship2.id },
    })

    expect(fromDb).toBeDefined()
  })

  it('Should enforce unique owner combination for party relationship', async (): Promise<void> => {
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

    const partyEntity1: PartyEntity = partyEntityFrom(party1)
    const savedParty1: PartyEntity = await dbConnection.getRepository(PartyEntity).save(partyEntity1, {
      transaction: true,
    })

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

    const partyEntity2: PartyEntity = partyEntityFrom(party2)
    const savedParty2: PartyEntity = await dbConnection.getRepository(PartyEntity).save(partyEntity2, {
      transaction: true,
    })

    expect(savedParty2).toBeDefined()

    const relationship1: PartyRelationshipEntity = partyRelationshipEntityFrom({
      leftId: savedParty1.id,
      rightId: savedParty2.id,
    })

    const savedRelationship1: PartyRelationshipEntity | null = await dbConnection.getRepository(PartyRelationshipEntity).save(relationship1, {
      transaction: true,
    })

    expect(savedRelationship1).toBeDefined()

    const relationship2: PartyRelationshipEntity = partyRelationshipEntityFrom({
      leftId: savedParty1.id,
      rightId: savedParty2.id,
    })

    await expect(dbConnection.getRepository(PartyRelationshipEntity).save(relationship2)).rejects.toThrowError(
      'SQLITE_CONSTRAINT: UNIQUE constraint failed: PartyRelationship.left_id, PartyRelationship.right_id',
    )
  })

  it('Should save party type to database', async (): Promise<void> => {
    const partyType: NonPersistedPartyType = {
      type: PartyTypeType.NATURAL_PERSON,
      origin: PartyOrigin.INTERNAL,
      tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
      name: 'example_name',
    }

    const partyTypeEntity: PartyTypeEntity = partyTypeEntityFrom(partyType)
    const savedPartyType: PartyTypeEntity | null = await dbConnection.getRepository(PartyTypeEntity).save(partyTypeEntity)

    const fromDb: PartyTypeEntity | null = await dbConnection.getRepository(PartyTypeEntity).findOne({
      where: { id: savedPartyType.id },
    })

    expect(fromDb).toBeDefined()
  })

  it('Should save person to database', async (): Promise<void> => {
    const person: NonPersistedNaturalPerson = {
      firstName: 'example_first_name',
      lastName: 'lastName2',
      displayName: 'displayName',
    }

    const personEntity: NaturalPersonEntity = naturalPersonEntityFrom(person)
    const savedPerson: NaturalPersonEntity | null = await dbConnection.getRepository(NaturalPersonEntity).save(personEntity, {
      transaction: true,
    })

    const fromDb: NaturalPersonEntity | null = await dbConnection.getRepository(NaturalPersonEntity).findOne({
      where: { id: savedPerson.id },
    })

    expect(fromDb).toBeDefined()
  })

  it('Should set last updated date when saving person', async (): Promise<void> => {
    const person: NonPersistedNaturalPerson = {
      firstName: 'example_first_name',
      lastName: 'lastName2',
      displayName: 'displayName',
    }

    const personEntity: NaturalPersonEntity = naturalPersonEntityFrom(person)
    const savedPerson: NaturalPersonEntity | null = await dbConnection.getRepository(NaturalPersonEntity).save(personEntity, {
      transaction: true,
    })

    const fromDb: NaturalPersonEntity | null = await dbConnection.getRepository(NaturalPersonEntity).findOne({
      where: { id: savedPerson.id },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.lastUpdatedAt).toBeDefined()
  })

  it('Should set creation date when saving person', async (): Promise<void> => {
    const person: NonPersistedNaturalPerson = {
      firstName: 'example_first_name',
      lastName: 'lastName2',
      displayName: 'displayName',
    }

    const personEntity: NaturalPersonEntity = naturalPersonEntityFrom(person)
    const savedPerson: NaturalPersonEntity | null = await dbConnection.getRepository(NaturalPersonEntity).save(personEntity, {
      transaction: true,
    })

    const fromDb: NaturalPersonEntity | null = await dbConnection.getRepository(NaturalPersonEntity).findOne({
      where: { id: savedPerson.id },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.createdAt).toBeDefined()
  })

  it('Should save organization to database', async (): Promise<void> => {
    const organization: NonPersistedOrganization = {
      legalName: 'example_legal_name',
      displayName: 'example_display_name',
    }

    const organizationEntity: OrganizationEntity = organizationEntityFrom(organization)
    const savedOrganization: OrganizationEntity | null = await dbConnection.getRepository(OrganizationEntity).save(organizationEntity, {
      transaction: true,
    })

    const fromDb: OrganizationEntity | null = await dbConnection.getRepository(OrganizationEntity).findOne({
      where: { id: savedOrganization.id },
    })

    expect(fromDb).toBeDefined()
  })

  it('Should set last updated date when saving organization', async (): Promise<void> => {
    const organization: NonPersistedOrganization = {
      legalName: 'example_legal_name',
      displayName: 'example_display_name',
    }

    const organizationEntity: OrganizationEntity = organizationEntityFrom(organization)
    const savedOrganization: OrganizationEntity | null = await dbConnection.getRepository(OrganizationEntity).save(organizationEntity, {
      transaction: true,
    })

    const fromDb: OrganizationEntity | null = await dbConnection.getRepository(OrganizationEntity).findOne({
      where: { id: savedOrganization.id },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.lastUpdatedAt).toBeDefined()
  })

  it('Should set creation date when saving organization', async (): Promise<void> => {
    const organization: NonPersistedOrganization = {
      legalName: 'example_legal_name',
      displayName: 'example_display_name',
    }

    const organizationEntity: OrganizationEntity = organizationEntityFrom(organization)
    const savedOrganization: OrganizationEntity | null = await dbConnection.getRepository(OrganizationEntity).save(organizationEntity, {
      transaction: true,
    })

    const fromDb: OrganizationEntity | null = await dbConnection.getRepository(OrganizationEntity).findOne({
      where: { id: savedOrganization.id },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.createdAt).toBeDefined()
  })

  it('Should get party based on person information', async (): Promise<void> => {
    const firstName = 'example_first_name'
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.NATURAL_PERSON,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        firstName,
        middleName: 'example_middle_name',
        lastName: 'example_last_name',
        displayName: 'example_display_name',
      },
    }

    const partyEntity: PartyEntity = partyEntityFrom(party)
    await dbConnection.getRepository(PartyEntity).save(partyEntity, {
      transaction: true,
    })

    const fromDb: PartyEntity | null = await dbConnection.getRepository(PartyEntity).findOne({
      where: {
        contact: {
          firstName,
        } as FindOptionsWhere<BaseContactEntity>, //NaturalPersonEntity | OrganizationEntity
      },
    })

    expect(fromDb).toBeDefined()
  })

  it('Should get party based on organization information', async (): Promise<void> => {
    const legalName = 'example_legal_name'
    const party: NonPersistedParty = {
      uri: 'example.com',
      partyType: {
        type: PartyTypeType.ORGANIZATION,
        origin: PartyOrigin.INTERNAL,
        tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
        name: 'example_name',
      },
      contact: {
        legalName,
        displayName: 'example_display_name',
      },
    }

    const partyEntity: PartyEntity = partyEntityFrom(party)
    await dbConnection.getRepository(PartyEntity).save(partyEntity, {
      transaction: true,
    })

    const fromDb: PartyEntity | null = await dbConnection.getRepository(PartyEntity).findOne({
      where: {
        contact: {
          legalName,
        } as FindOptionsWhere<BaseContactEntity>, //NaturalPersonEntity | OrganizationEntity
      },
    })

    expect(fromDb).toBeDefined()
  })

  it("Should enforce unique party id's for relationship sides", async (): Promise<void> => {
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

    const partyEntity: PartyEntity = partyEntityFrom(party)
    const savedParty: PartyEntity = await dbConnection.getRepository(PartyEntity).save(partyEntity, {
      transaction: true,
    })

    expect(savedParty).toBeDefined()

    const relationship: PartyRelationshipEntity = partyRelationshipEntityFrom({
      leftId: savedParty.id,
      rightId: savedParty.id,
    })

    await expect(dbConnection.getRepository(PartyRelationshipEntity).save(relationship)).rejects.toThrowError(
      'Cannot use the same id for both sides of the relationship',
    )
  })

  it('Should delete party relationship', async (): Promise<void> => {
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

    const partyEntity1: PartyEntity = partyEntityFrom(party1)
    const savedParty1: PartyEntity = await dbConnection.getRepository(PartyEntity).save(partyEntity1, {
      transaction: true,
    })

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

    const partyEntity2: PartyEntity = partyEntityFrom(party2)
    const savedParty2: PartyEntity = await dbConnection.getRepository(PartyEntity).save(partyEntity2, {
      transaction: true,
    })

    expect(savedParty2).toBeDefined()

    const relationship: PartyRelationshipEntity = partyRelationshipEntityFrom({
      leftId: savedParty1.id,
      rightId: savedParty2.id,
    })

    const savedRelationship: PartyRelationshipEntity | null = await dbConnection.getRepository(PartyRelationshipEntity).save(relationship, {
      transaction: true,
    })

    expect(savedRelationship).toBeDefined()

    await dbConnection.getRepository(PartyRelationshipEntity).delete({ id: savedRelationship.id })

    await expect(
      await dbConnection.getRepository(PartyRelationshipEntity).findOne({
        where: { id: savedRelationship.id },
      }),
    ).toBeNull()
  })

  it('Should delete party type', async (): Promise<void> => {
    const partyType: NonPersistedPartyType = {
      type: PartyTypeType.NATURAL_PERSON,
      origin: PartyOrigin.INTERNAL,
      tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
      name: 'example_name',
    }

    const partyTypeEntity: PartyTypeEntity = partyTypeEntityFrom(partyType)
    const savedPartyType: PartyTypeEntity | null = await dbConnection.getRepository(PartyTypeEntity).save(partyTypeEntity)

    expect(savedPartyType).toBeDefined()

    await dbConnection.getRepository(PartyTypeEntity).delete({ id: savedPartyType.id })

    await expect(
      await dbConnection.getRepository(PartyTypeEntity).findOne({
        where: { id: savedPartyType.id },
      }),
    ).toBeNull()
  })

  it('Should not be able to remove party type when used by parties', async (): Promise<void> => {
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

    const partyEntity: PartyEntity = partyEntityFrom(party)
    const savedParty: PartyEntity | null = await dbConnection.getRepository(PartyEntity).save(partyEntity, {
      transaction: true,
    })

    expect(savedParty).toBeDefined()

    await expect(dbConnection.getRepository(PartyTypeEntity).delete({ id: savedParty.partyType.id })).rejects.toThrowError(
      'FOREIGN KEY constraint failed',
    )
  })

  it('Should save party with existing party type', async (): Promise<void> => {
    const partyType: NonPersistedPartyType = {
      type: PartyTypeType.NATURAL_PERSON,
      origin: PartyOrigin.INTERNAL,
      tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
      name: 'example_name',
    }

    const partyTypeEntity: PartyTypeEntity = partyTypeEntityFrom(partyType)
    const savedPartyType: PartyTypeEntity | null = await dbConnection.getRepository(PartyTypeEntity).save(partyTypeEntity)

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

    const partyEntity: PartyEntity = partyEntityFrom(party)
    partyEntity.partyType = savedPartyType
    await dbConnection.getRepository(PartyEntity).save(partyEntity, {
      transaction: true,
    })

    const fromDb: PartyEntity | null = await dbConnection.getRepository(PartyEntity).findOne({
      where: { id: partyEntity.id },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.partyType).toBeDefined()
    expect(fromDb?.partyType.id).toEqual(savedPartyType.id)
    expect(fromDb?.partyType.type).toEqual(savedPartyType.type)
    expect(fromDb?.partyType.origin).toEqual(savedPartyType.origin)
    expect(fromDb?.partyType.tenantId).toEqual(savedPartyType.tenantId)
    expect(fromDb?.partyType.name).toEqual(savedPartyType.name)
  })

  it('Should not update creation date when saving party type', async (): Promise<void> => {
    const partyType: NonPersistedPartyType = {
      type: PartyTypeType.NATURAL_PERSON,
      origin: PartyOrigin.INTERNAL,
      tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
      name: 'example_name',
    }

    const partyTypeEntity: PartyTypeEntity = partyTypeEntityFrom(partyType)
    const savedPartyType: PartyTypeEntity | null = await dbConnection.getRepository(PartyTypeEntity).save(partyTypeEntity)
    await dbConnection.getRepository(PartyTypeEntity).save({ ...savedPartyType, type: PartyTypeType.ORGANIZATION })

    const fromDb: PartyTypeEntity | null = await dbConnection.getRepository(PartyTypeEntity).findOne({
      where: {
        type: PartyTypeType.ORGANIZATION,
      },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.createdAt).toEqual(savedPartyType?.createdAt)
  })

  it('Should save email electronic address to database', async (): Promise<void> => {
    const electronicAddress: NonPersistedElectronicAddress = {
      type: 'email',
      electronicAddress: 'example_email_address',
    }

    const electronicAddressEntity: ElectronicAddressEntity = electronicAddressEntityFrom(electronicAddress)
    const savedElectronicAddress: ElectronicAddressEntity = await dbConnection.getRepository(ElectronicAddressEntity).save(electronicAddressEntity, {
      transaction: true,
    })

    const fromDb: ElectronicAddressEntity | null = await dbConnection.getRepository(ElectronicAddressEntity).findOne({
      where: { id: savedElectronicAddress.id },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.type).toEqual(electronicAddress.type)
    expect(fromDb?.electronicAddress).toEqual(electronicAddress.electronicAddress)
    expect(fromDb?.createdAt).toBeDefined()
    expect(fromDb?.lastUpdatedAt).toBeDefined()
  })

  it('Should save phone electronic address to database', async (): Promise<void> => {
    const electronicAddress: NonPersistedElectronicAddress = {
      type: 'phone',
      electronicAddress: 'example_phone_number',
    }

    const electronicAddressEntity: ElectronicAddressEntity = electronicAddressEntityFrom(electronicAddress)
    const savedElectronicAddress: ElectronicAddressEntity = await dbConnection.getRepository(ElectronicAddressEntity).save(electronicAddressEntity, {
      transaction: true,
    })

    const fromDb: ElectronicAddressEntity | null = await dbConnection.getRepository(ElectronicAddressEntity).findOne({
      where: { id: savedElectronicAddress.id },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.type).toEqual(electronicAddress.type)
    expect(fromDb?.electronicAddress).toEqual(electronicAddress.electronicAddress)
    expect(fromDb?.createdAt).toBeDefined()
    expect(fromDb?.lastUpdatedAt).toBeDefined()
  })

  it('should throw error when saving electronic address with blank electronic address', async (): Promise<void> => {
    const electronicAddress: NonPersistedElectronicAddress = {
      type: 'email',
      electronicAddress: '',
    }

    const electronicAddressEntity: ElectronicAddressEntity = electronicAddressEntityFrom(electronicAddress)

    await expect(dbConnection.getRepository(ElectronicAddressEntity).save(electronicAddressEntity)).rejects.toThrowError(
      'Blank electronic addresses are not allowed',
    )
  })

  it('Should save home physical address to database', async (): Promise<void> => {
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

    const physicalAddressEntity: PhysicalAddressEntity = physicalAddressEntityFrom(physicalAddress)
    const savedPhysicalAddress: PhysicalAddressEntity = await dbConnection.getRepository(PhysicalAddressEntity).save(physicalAddressEntity, {
      transaction: true,
    })

    const fromDb: PhysicalAddressEntity | null = await dbConnection.getRepository(PhysicalAddressEntity).findOne({
      where: { id: savedPhysicalAddress.id },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.type).toEqual(physicalAddress.type)
    expect(fromDb?.streetName).toEqual(physicalAddress.streetName)
    expect(fromDb?.streetNumber).toEqual(physicalAddress.streetNumber)
    expect(fromDb?.buildingName).toEqual(physicalAddress.buildingName)
    expect(fromDb?.postalCode).toEqual(physicalAddress.postalCode)
    expect(fromDb?.cityName).toEqual(physicalAddress.cityName)
    expect(fromDb?.provinceName).toEqual(physicalAddress.provinceName)
    expect(fromDb?.countryCode).toEqual(physicalAddress.countryCode)
    expect(fromDb?.createdAt).toBeDefined()
    expect(fromDb?.lastUpdatedAt).toBeDefined()
  })

  it('Should save visit physical address to database', async (): Promise<void> => {
    const physicalAddress: NonPersistedPhysicalAddress = {
      type: 'visit',
      streetName: 'example_street_name',
      streetNumber: 'example_street_number',
      buildingName: 'example_building_name',
      postalCode: 'example_postal_code',
      cityName: 'example_city_name',
      provinceName: 'example_province_name',
      countryCode: 'example_country_code',
    }

    const physicalAddressEntity: PhysicalAddressEntity = physicalAddressEntityFrom(physicalAddress)
    const savedPhysicalAddress: PhysicalAddressEntity = await dbConnection.getRepository(PhysicalAddressEntity).save(physicalAddressEntity, {
      transaction: true,
    })

    const fromDb: PhysicalAddressEntity | null = await dbConnection.getRepository(PhysicalAddressEntity).findOne({
      where: { id: savedPhysicalAddress.id },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.type).toEqual(physicalAddress.type)
    expect(fromDb?.streetName).toEqual(physicalAddress.streetName)
    expect(fromDb?.streetNumber).toEqual(physicalAddress.streetNumber)
    expect(fromDb?.buildingName).toEqual(physicalAddress.buildingName)
    expect(fromDb?.postalCode).toEqual(physicalAddress.postalCode)
    expect(fromDb?.cityName).toEqual(physicalAddress.cityName)
    expect(fromDb?.provinceName).toEqual(physicalAddress.provinceName)
    expect(fromDb?.countryCode).toEqual(physicalAddress.countryCode)
    expect(fromDb?.createdAt).toBeDefined()
    expect(fromDb?.lastUpdatedAt).toBeDefined()
  })

  it('Should save postal physical address to database', async (): Promise<void> => {
    const physicalAddress: NonPersistedPhysicalAddress = {
      type: 'postal',
      streetName: 'example_street_name',
      streetNumber: 'example_street_number',
      buildingName: 'example_building_name',
      postalCode: 'example_postal_code',
      cityName: 'example_city_name',
      provinceName: 'example_province_name',
      countryCode: 'example_country_code',
    }

    const physicalAddressEntity: PhysicalAddressEntity = physicalAddressEntityFrom(physicalAddress)
    const savedPhysicalAddress: PhysicalAddressEntity = await dbConnection.getRepository(PhysicalAddressEntity).save(physicalAddressEntity, {
      transaction: true,
    })

    const fromDb: PhysicalAddressEntity | null = await dbConnection.getRepository(PhysicalAddressEntity).findOne({
      where: { id: savedPhysicalAddress.id },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.type).toEqual(physicalAddress.type)
    expect(fromDb?.streetName).toEqual(physicalAddress.streetName)
    expect(fromDb?.streetNumber).toEqual(physicalAddress.streetNumber)
    expect(fromDb?.buildingName).toEqual(physicalAddress.buildingName)
    expect(fromDb?.postalCode).toEqual(physicalAddress.postalCode)
    expect(fromDb?.cityName).toEqual(physicalAddress.cityName)
    expect(fromDb?.provinceName).toEqual(physicalAddress.provinceName)
    expect(fromDb?.countryCode).toEqual(physicalAddress.countryCode)
    expect(fromDb?.createdAt).toBeDefined()
    expect(fromDb?.lastUpdatedAt).toBeDefined()
  })

  it('should throw error when saving physical address with blank street name', async (): Promise<void> => {
    const physicalAddress: NonPersistedPhysicalAddress = {
      type: 'home',
      streetName: '',
      streetNumber: 'example_street_number',
      buildingName: 'example_building_name',
      postalCode: 'example_postal_code',
      cityName: 'example_city_name',
      provinceName: 'example_province_name',
      countryCode: 'example_country_code',
    }

    const physicalAddressEntity: PhysicalAddressEntity = physicalAddressEntityFrom(physicalAddress)

    await expect(dbConnection.getRepository(PhysicalAddressEntity).save(physicalAddressEntity)).rejects.toThrowError(
      'Blank street names are not allowed',
    )
  })

  it('should throw error when saving physical address with blank street number', async (): Promise<void> => {
    const physicalAddress: NonPersistedPhysicalAddress = {
      type: 'home',
      streetName: 'example_street_name',
      streetNumber: '',
      buildingName: 'example_building_name',
      postalCode: 'example_postal_code',
      cityName: 'example_city_name',
      provinceName: 'example_province_name',
      countryCode: 'example_country_code',
    }

    const physicalAddressEntity: PhysicalAddressEntity = physicalAddressEntityFrom(physicalAddress)

    await expect(dbConnection.getRepository(PhysicalAddressEntity).save(physicalAddressEntity)).rejects.toThrowError(
      'Blank street numbers are not allowed',
    )
  })

  it('should throw error when saving physical address with blank building name', async (): Promise<void> => {
    const physicalAddress: NonPersistedPhysicalAddress = {
      type: 'home',
      streetName: 'example_street_name',
      streetNumber: 'example_street_number',
      buildingName: '',
      postalCode: 'example_postal_code',
      cityName: 'example_city_name',
      provinceName: 'example_province_name',
      countryCode: 'example_country_code',
    }

    const physicalAddressEntity: PhysicalAddressEntity = physicalAddressEntityFrom(physicalAddress)

    await expect(dbConnection.getRepository(PhysicalAddressEntity).save(physicalAddressEntity)).rejects.toThrowError(
      'Blank building names are not allowed',
    )
  })

  it('should throw error when saving physical address with blank postal code', async (): Promise<void> => {
    const physicalAddress: NonPersistedPhysicalAddress = {
      type: 'home',
      streetName: 'example_street_name',
      streetNumber: 'example_street_number',
      buildingName: 'example_building_name',
      postalCode: '',
      cityName: 'example_city_name',
      provinceName: 'example_province_name',
      countryCode: 'example_country_code',
    }

    const physicalAddressEntity: PhysicalAddressEntity = physicalAddressEntityFrom(physicalAddress)

    await expect(dbConnection.getRepository(PhysicalAddressEntity).save(physicalAddressEntity)).rejects.toThrowError(
      'Blank postal codes are not allowed',
    )
  })

  it('should throw error when saving physical address with blank city name', async (): Promise<void> => {
    const physicalAddress: NonPersistedPhysicalAddress = {
      type: 'home',
      streetName: 'example_street_name',
      streetNumber: 'example_street_number',
      buildingName: 'example_building_name',
      postalCode: 'example_postal_code',
      cityName: '',
      provinceName: 'example_province_name',
      countryCode: 'example_country_code',
    }

    const physicalAddressEntity: PhysicalAddressEntity = physicalAddressEntityFrom(physicalAddress)

    await expect(dbConnection.getRepository(PhysicalAddressEntity).save(physicalAddressEntity)).rejects.toThrowError(
      'Blank city names are not allowed',
    )
  })

  it('should throw error when saving physical address with blank province name', async (): Promise<void> => {
    const physicalAddress: NonPersistedPhysicalAddress = {
      type: 'home',
      streetName: 'example_street_name',
      streetNumber: 'example_street_number',
      buildingName: 'example_building_name',
      postalCode: 'example_postal_code',
      cityName: 'example_city_name',
      provinceName: '',
      countryCode: 'example_country_code',
    }

    const physicalAddressEntity: PhysicalAddressEntity = physicalAddressEntityFrom(physicalAddress)

    await expect(dbConnection.getRepository(PhysicalAddressEntity).save(physicalAddressEntity)).rejects.toThrowError(
      'Blank province names are not allowed',
    )
  })

  it('should throw error when saving physical address with blank country code', async (): Promise<void> => {
    const physicalAddress: NonPersistedPhysicalAddress = {
      type: 'home',
      streetName: 'example_street_name',
      streetNumber: 'example_street_number',
      buildingName: 'example_building_name',
      postalCode: 'example_postal_code',
      cityName: 'example_city_name',
      provinceName: 'example_province_name',
      countryCode: '',
    }

    const physicalAddressEntity: PhysicalAddressEntity = physicalAddressEntityFrom(physicalAddress)

    await expect(dbConnection.getRepository(PhysicalAddressEntity).save(physicalAddressEntity)).rejects.toThrowError(
      'Blank country codes are not allowed',
    )
  })
})
