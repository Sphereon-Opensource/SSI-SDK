import { DataSource } from 'typeorm'

import {
  CorrelationIdentifierEnum,
  DataStoreContactEntities,
  DataStoreMigrations,
  contactEntityFrom,
  connectionEntityFrom,
  identityEntityFrom,
  didAuthConfigEntityFrom,
  openIdConfigEntityFrom,
  ContactEntity,
  IdentityEntity,
  ConnectionTypeEnum,
  OpenIdConfigEntity,
  DidAuthConfigEntity,
  ConnectionEntity,
  CorrelationIdentifierEntity,
  IdentityMetadataItemEntity,
  IdentityRoleEnum,
} from '../index'

describe('Database entities tests', (): void => {
  let dbConnection: DataSource

  beforeEach(async (): Promise<void> => {
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
  })

  afterEach(async (): Promise<void> => {
    await (await dbConnection).destroy()
  })

  it('Should save contact to database', async (): Promise<void> => {
    const contact = {
      name: 'test_name',
      alias: 'test_alias',
      uri: 'example.com',
    }

    const contactEntity: ContactEntity = contactEntityFrom(contact)
    await dbConnection.getRepository(ContactEntity).save(contactEntity)

    const fromDb = await dbConnection.getRepository(ContactEntity).findOne({
      where: { name: contact.name },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.identities?.length).toEqual(0)
    expect(fromDb?.name).toEqual(contact.name)
    expect(fromDb?.alias).toEqual(contact.alias)
    expect(fromDb?.uri).toEqual(contact.uri)
  })

  it('should throw error when saving contact with blank name', async (): Promise<void> => {
    const contact = {
      name: '',
      alias: 'test_alias',
      uri: 'example.com',
    }

    const contactEntity: ContactEntity = contactEntityFrom(contact)

    await expect(dbConnection.getRepository(ContactEntity).save(contactEntity)).rejects.toThrow('Blank names are not allowed')
  })

  it('should throw error when saving contact with blank alias', async (): Promise<void> => {
    const contact = {
      name: 'test_name',
      alias: '',
      uri: 'example.com',
    }

    const contactEntity: ContactEntity = contactEntityFrom(contact)

    await expect(dbConnection.getRepository(ContactEntity).save(contactEntity)).rejects.toThrow('Blank aliases are not allowed')
  })

  it('Should enforce unique name for a contact', async (): Promise<void> => {
    const contactName = 'non_unique_name'
    const contact1 = {
      name: contactName,
      alias: 'unique_alias1',
      uri: 'example.com',
    }
    const contact1Entity: ContactEntity = contactEntityFrom(contact1)
    await dbConnection.getRepository(ContactEntity).save(contact1Entity)

    const contact2 = {
      name: contactName,
      alias: 'unique_alias2',
      uri: 'example.com',
    }
    const contact2Entity: ContactEntity = contactEntityFrom(contact2)

    await expect(dbConnection.getRepository(ContactEntity).save(contact2Entity)).rejects.toThrowError(
      'SQLITE_CONSTRAINT: UNIQUE constraint failed: Contact.name'
    )
  })

  it('Should enforce unique alias for a contact', async (): Promise<void> => {
    const alias = 'non_unique_alias'
    const contact1 = {
      name: 'unique_name1',
      alias,
      uri: 'example.com',
    }
    const contact1Entity: ContactEntity = contactEntityFrom(contact1)
    await dbConnection.getRepository(ContactEntity).save(contact1Entity)

    const contact2 = {
      name: 'unique_name2',
      alias,
      uri: 'example.com',
    }
    const contact2Entity: ContactEntity = contactEntityFrom(contact2)

    await expect(dbConnection.getRepository(ContactEntity).save(contact2Entity)).rejects.toThrowError(
      'SQLITE_CONSTRAINT: UNIQUE constraint failed: Contact.alias'
    )
  })

  it('Should enforce unique alias for an identity', async (): Promise<void> => {
    const alias = 'non_unique_alias'
    const identity1 = {
      alias,
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId: 'unique_correlationId1',
      },
    }
    const identity1Entity: IdentityEntity = identityEntityFrom(identity1)
    await dbConnection.getRepository(IdentityEntity).save(identity1Entity)

    const identity2 = {
      alias: alias,
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId: 'unique_correlationId2',
      },
    }
    const identity2Entity: IdentityEntity = identityEntityFrom(identity2)
    await expect(dbConnection.getRepository(IdentityEntity).save(identity2Entity)).rejects.toThrowError(
      'SQLITE_CONSTRAINT: UNIQUE constraint failed: Identity.alias'
    )
  })

  it('Should enforce unique correlationId for a identity', async (): Promise<void> => {
    const correlationId = 'non_unique_correlationId'
    const identity1 = {
      alias: 'unique_alias1',
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId,
      },
    }
    const identity1Entity: IdentityEntity = identityEntityFrom(identity1)
    await dbConnection.getRepository(IdentityEntity).save(identity1Entity)

    const identity2 = {
      alias: 'unique_alias2',
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId,
      },
    }
    const identity2Entity: IdentityEntity = identityEntityFrom(identity2)
    await expect(dbConnection.getRepository(IdentityEntity).save(identity2Entity)).rejects.toThrowError(
      'SQLITE_CONSTRAINT: UNIQUE constraint failed: CorrelationIdentifier.correlation_id'
    )
  })

  it('Should save identity to database', async (): Promise<void> => {
    const correlationId = 'example_did'
    const identity = {
      alias: correlationId,
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId,
      },
    }

    const identityEntity: IdentityEntity = identityEntityFrom(identity)

    await dbConnection.getRepository(IdentityEntity).save(identityEntity)

    const fromDb = await dbConnection.getRepository(IdentityEntity).findOne({
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
    const identity = {
      alias: '',
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId: 'example_did',
      },
    }

    const identityEntity: IdentityEntity = identityEntityFrom(identity)

    await expect(dbConnection.getRepository(IdentityEntity).save(identityEntity)).rejects.toThrow('Blank aliases are not allowed')
  })

  it('should throw error when saving identity with blank correlation id', async (): Promise<void> => {
    const identity = {
      alias: 'example_did',
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId: '',
      },
    }

    const identityEntity: IdentityEntity = identityEntityFrom(identity)

    await expect(dbConnection.getRepository(IdentityEntity).save(identityEntity)).rejects.toThrow('Blank correlation ids are not allowed')
  })

  it('should throw error when saving identity with blank metadata label', async (): Promise<void> => {
    const correlationId = 'example_did'
    const identity = {
      alias: correlationId,
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
      identifier: {
        type: CorrelationIdentifierEnum.DID,
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

    await expect(dbConnection.getRepository(IdentityEntity).save(identityEntity)).rejects.toThrow('Blank metadata labels are not allowed')
  })

  it('should throw error when saving identity with blank metadata value', async (): Promise<void> => {
    const correlationId = 'example_did'
    const identity = {
      alias: correlationId,
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
      identifier: {
        type: CorrelationIdentifierEnum.DID,
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

    await expect(dbConnection.getRepository(IdentityEntity).save(identityEntity)).rejects.toThrow('Blank metadata values are not allowed')
  })

  it('Should save identity with openid connection to database', async (): Promise<void> => {
    const correlationId = 'example.com'
    const identity = {
      alias: correlationId,
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
      identifier: {
        type: CorrelationIdentifierEnum.URL,
        correlationId,
      },
      connection: {
        type: ConnectionTypeEnum.OPENID_CONNECT,
        config: {
          clientId: '138d7bf8-c930-4c6e-b928-97d3a4928b01',
          clientSecret: '03b3955f-d020-4f2a-8a27-4e452d4e27a0',
          scopes: ['auth'],
          issuer: 'https://example.com/app-test',
          redirectUrl: 'app:/callback',
          dangerouslyAllowInsecureHttpRequests: true,
          clientAuthMethod: 'post' as const,
        },
      },
    }

    const identityEntity: IdentityEntity = identityEntityFrom(identity)

    await dbConnection.getRepository(IdentityEntity).save(identityEntity)

    const fromDb = await dbConnection.getRepository(IdentityEntity).findOne({
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
    expect(fromDb?.connection?.type).toEqual(identity.connection.type)
    expect(fromDb?.connection?.config).toBeDefined()
    expect((fromDb?.connection?.config as OpenIdConfigEntity).clientId).toEqual(identity.connection.config.clientId)
  })

  it('Should save identity with didauth connection to database', async (): Promise<void> => {
    const correlationId = 'example.com'
    const identity = {
      alias: correlationId,
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
      identifier: {
        type: CorrelationIdentifierEnum.URL,
        correlationId,
      },
      connection: {
        type: ConnectionTypeEnum.SIOPv2,
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

    const fromDb = await dbConnection.getRepository(IdentityEntity).findOne({
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
    expect(fromDb?.connection?.type).toEqual(identity.connection.type)
    expect(fromDb?.connection?.config).toBeDefined()
    expect((fromDb?.connection?.config as DidAuthConfigEntity).identifier).toEqual(identity.connection.config.identifier.did)
  })

  it('Should save connection with openid config to database', async (): Promise<void> => {
    const connection = {
      type: ConnectionTypeEnum.OPENID_CONNECT,
      config: {
        clientId: '138d7bf8-c930-4c6e-b928-97d3a4928b01',
        clientSecret: '03b3955f-d020-4f2a-8a27-4e452d4e27a0',
        scopes: ['auth'],
        issuer: 'https://example.com/app-test',
        redirectUrl: 'app:/callback',
        dangerouslyAllowInsecureHttpRequests: true,
        clientAuthMethod: 'post' as const,
      },
    }
    const connectionEntity = connectionEntityFrom(connection)
    await dbConnection.getRepository(ConnectionEntity).save(connectionEntity, {
      transaction: true,
    })

    const fromDb = await dbConnection.getRepository(ConnectionEntity).findOne({
      where: { type: connection.type },
    })

    expect(fromDb).toBeDefined()

    const fromDbConfig = await dbConnection.getRepository(OpenIdConfigEntity).findOne({
      where: { id: fromDb?.id },
    })

    expect(fromDbConfig).toBeDefined()
    expect(fromDb?.type).toEqual(connection.type)
    expect(fromDb?.config).toBeDefined()
    expect((fromDb?.config as OpenIdConfigEntity).clientId).toEqual(connection.config.clientId)
  })

  it('Should save connection with didauth config to database', async (): Promise<void> => {
    const connection = {
      type: ConnectionTypeEnum.SIOPv2,
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
    const connectionEntity = connectionEntityFrom(connection)
    await dbConnection.getRepository(ConnectionEntity).save(connectionEntity, {
      transaction: true,
    })

    const fromDb = await dbConnection.getRepository(ConnectionEntity).findOne({
      where: { type: connection.type },
    })

    expect(fromDb).toBeDefined()

    const fromDbConfig = await dbConnection.getRepository(DidAuthConfigEntity).findOne({
      where: { id: fromDb?.id },
    })

    expect(fromDbConfig).toBeDefined()
    expect(fromDb?.type).toEqual(connection.type)
    expect(fromDb?.config).toBeDefined()
    expect((fromDb?.config as DidAuthConfigEntity).identifier).toEqual(connection.config.identifier.did)
  })

  it('Should save openid config to database', async (): Promise<void> => {
    const clientId = '138d7bf8-c930-4c6e-b928-97d3a4928b01'
    const config = {
      clientId,
      clientSecret: '03b3955f-d020-4f2a-8a27-4e452d4e27a0',
      scopes: ['auth'],
      issuer: 'https://example.com/app-test',
      redirectUrl: 'app:/callback',
      dangerouslyAllowInsecureHttpRequests: true,
      clientAuthMethod: 'post' as const,
    }

    const configEntity = openIdConfigEntityFrom(config)
    await dbConnection.getRepository(OpenIdConfigEntity).save(configEntity, {
      transaction: true,
    })

    const fromDb = await dbConnection.getRepository(OpenIdConfigEntity).findOne({
      where: { clientId: config.clientId },
    })

    expect(fromDb).toBeDefined()
    expect((fromDb as OpenIdConfigEntity).clientId).toEqual(config.clientId)
  })

  it('Should save didauth config to database', async (): Promise<void> => {
    const sessionId = 'https://example.com/did:test:138d7bf8-c930-4c6e-b928-97d3a4928b01'
    const config = {
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

    const configEntity = didAuthConfigEntityFrom(config)
    await dbConnection.getRepository(DidAuthConfigEntity).save(configEntity, {
      transaction: true,
    })

    const fromDb = await dbConnection.getRepository(DidAuthConfigEntity).findOne({
      where: { sessionId: config.sessionId },
    })

    expect(fromDb).toBeDefined()
    expect((fromDb as DidAuthConfigEntity).identifier).toEqual(config.identifier.did)
  })

  it('Should delete contact and all child relations', async (): Promise<void> => {
    const contact = {
      name: 'relation_test_name',
      alias: 'relation_test_alias',
      uri: 'example.com',
    }

    const contactEntity: ContactEntity = contactEntityFrom(contact)
    const savedContact = await dbConnection.getRepository(ContactEntity).save(contactEntity)

    const correlationId = 'relation_example.com'
    const identity = {
      alias: correlationId,
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
      identifier: {
        type: CorrelationIdentifierEnum.URL,
        correlationId,
      },
      connection: {
        type: ConnectionTypeEnum.OPENID_CONNECT,
        config: {
          clientId: '138d7bf8-c930-4c6e-b928-97d3a4928b01',
          clientSecret: '03b3955f-d020-4f2a-8a27-4e452d4e27a0',
          scopes: ['auth'],
          issuer: 'https://example.com/app-test',
          redirectUrl: 'app:/callback',
          dangerouslyAllowInsecureHttpRequests: true,
          clientAuthMethod: 'post' as const,
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
    identityEntity.contact = savedContact

    const savedIdentity = await dbConnection.getRepository(IdentityEntity).save(identityEntity)

    expect(
      await dbConnection.getRepository(ContactEntity).findOne({
        where: { name: contact.name },
      })
    ).toBeDefined()

    await dbConnection.getRepository(ContactEntity).delete({ id: savedContact.id })

    // check contact
    await expect(
      await dbConnection.getRepository(ContactEntity).findOne({
        where: { name: contact.name },
      })
    ).toBeNull()

    // check identity
    expect(
      await dbConnection.getRepository(IdentityEntity).findOne({
        where: { alias: correlationId },
      })
    ).toBeNull()

    // check identity identifier
    expect(
      await dbConnection.getRepository(CorrelationIdentifierEntity).findOne({
        where: { id: savedIdentity.identifier.id },
      })
    ).toBeNull()

    // check identity connection
    expect(
      await dbConnection.getRepository(ConnectionEntity).findOne({
        where: { id: savedIdentity.connection!.id },
      })
    ).toBeNull()

    // check connection config
    expect(
      await dbConnection.getRepository(OpenIdConfigEntity).findOne({
        where: { id: savedIdentity.connection!.config.id },
      })
    ).toBeNull()

    // check identity metadata
    expect(
      await dbConnection.getRepository(IdentityMetadataItemEntity).findOne({
        where: { id: savedIdentity.metadata![0].id },
      })
    ).toBeNull()
  })

  it('Should delete identity and all child relations', async (): Promise<void> => {
    const contact = {
      name: 'relation_test_name',
      alias: 'relation_test_alias',
      uri: 'example.com',
    }

    const contactEntity: ContactEntity = contactEntityFrom(contact)
    const savedContact = await dbConnection.getRepository(ContactEntity).save(contactEntity)

    const correlationId = 'relation_example.com'
    const identity = {
      alias: correlationId,
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
      identifier: {
        type: CorrelationIdentifierEnum.URL,
        correlationId,
      },
      connection: {
        type: ConnectionTypeEnum.SIOPv2,
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
    identityEntity.contact = savedContact

    const savedIdentity = await dbConnection.getRepository(IdentityEntity).save(identityEntity)

    expect(
      await dbConnection.getRepository(ContactEntity).findOne({
        where: { name: contact.name },
      })
    ).toBeDefined()

    await dbConnection.getRepository(IdentityEntity).delete({ id: savedIdentity.id })

    // check identity
    expect(
      await dbConnection.getRepository(IdentityEntity).findOne({
        where: { alias: correlationId },
      })
    ).toBeNull()

    // check identity identifier
    expect(
      await dbConnection.getRepository(CorrelationIdentifierEntity).findOne({
        where: { id: savedIdentity.identifier.id },
      })
    ).toBeNull()

    // check identity connection
    expect(
      await dbConnection.getRepository(ConnectionEntity).findOne({
        where: { id: savedIdentity.connection!.id },
      })
    ).toBeNull()

    // check connection config
    expect(
      await dbConnection.getRepository(OpenIdConfigEntity).findOne({
        where: { id: savedIdentity.connection!.config.id },
      })
    ).toBeNull()

    // check identity metadata
    expect(
      await dbConnection.getRepository(IdentityMetadataItemEntity).findOne({
        where: { id: savedIdentity.metadata![0].id },
      })
    ).toBeNull()
  })

  it('Should not delete contact when deleting identity', async (): Promise<void> => {
    const contact = {
      name: 'relation_test_name',
      alias: 'relation_test_alias',
      uri: 'example.com',
    }

    const contactEntity: ContactEntity = contactEntityFrom(contact)
    const savedContact = await dbConnection.getRepository(ContactEntity).save(contactEntity)

    const correlationId = 'relation_example.com'
    const identity = {
      alias: correlationId,
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
      identifier: {
        type: CorrelationIdentifierEnum.URL,
        correlationId,
      },
      connection: {
        type: ConnectionTypeEnum.SIOPv2,
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
    identityEntity.contact = savedContact

    const savedIdentity = await dbConnection.getRepository(IdentityEntity).save(identityEntity)

    await dbConnection.getRepository(IdentityEntity).delete({ id: savedIdentity.id })

    // check identity
    expect(
      await dbConnection.getRepository(IdentityEntity).findOne({
        where: { id: savedIdentity.id },
      })
    ).toBeNull()

    // check contact
    expect(
      await dbConnection.getRepository(ContactEntity).findOne({
        where: { name: contact.name },
      })
    ).toBeDefined()
  })

  it('Should set creation date when saving contact', async (): Promise<void> => {
    const contact = {
      name: 'test_name',
      alias: 'test_alias',
      uri: 'example.com',
    }

    const contactEntity: ContactEntity = contactEntityFrom(contact)
    await dbConnection.getRepository(ContactEntity).save(contactEntity)

    const fromDb = await dbConnection.getRepository(ContactEntity).findOne({
      where: { name: contact.name },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.createdAt).toBeDefined()
  })

  it('Should not update creation date when updating contact', async (): Promise<void> => {
    const contact = {
      name: 'test_name',
      alias: 'test_alias',
      uri: 'example.com',
    }

    const contactEntity: ContactEntity = contactEntityFrom(contact)
    const savedContact = await dbConnection.getRepository(ContactEntity).save(contactEntity)
    const newContactName = 'new_name'
    await dbConnection.getRepository(ContactEntity).save({ ...savedContact, name: newContactName })

    const fromDb = await dbConnection.getRepository(ContactEntity).findOne({
      where: { id: savedContact.id },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.createdAt).toEqual(savedContact?.createdAt)
  })

  it('Should set creation date when saving identity', async (): Promise<void> => {
    const correlationId = 'example_did'
    const identity = {
      alias: correlationId,
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId,
      },
    }

    const identityEntity: IdentityEntity = identityEntityFrom(identity)
    await dbConnection.getRepository(IdentityEntity).save(identityEntity)

    const fromDb = await dbConnection.getRepository(IdentityEntity).findOne({
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
    const identity = {
      alias: correlationId,
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId,
      },
    }

    const identityEntity: IdentityEntity = identityEntityFrom(identity)
    const savedIdentity = await dbConnection.getRepository(IdentityEntity).save(identityEntity)
    const newCorrelationId = 'new_example_did'
    await dbConnection
      .getRepository(IdentityEntity)
      .save({ ...savedIdentity, identifier: { ...savedIdentity.identifier, correlationId: newCorrelationId } })

    const fromDb = await dbConnection.getRepository(IdentityEntity).findOne({
      where: {
        identifier: {
          correlationId: newCorrelationId,
        },
      },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.createdAt).toEqual(savedIdentity?.createdAt)
  })

  it('Should set last updated date when saving contact', async (): Promise<void> => {
    const contact = {
      name: 'test_name',
      alias: 'test_alias',
      uri: 'example.com',
    }

    const contactEntity: ContactEntity = contactEntityFrom(contact)
    await dbConnection.getRepository(ContactEntity).save(contactEntity)

    const fromDb = await dbConnection.getRepository(ContactEntity).findOne({
      where: { name: contact.name },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.lastUpdatedAt).toBeDefined()
  })

  it('Should update last updated date when updating contact', async (): Promise<void> => {
    const contact = {
      name: 'test_name',
      alias: 'test_alias',
      uri: 'example.com',
    }

    const contactEntity: ContactEntity = contactEntityFrom(contact)
    const savedContact = await dbConnection.getRepository(ContactEntity).save(contactEntity)

    // waiting here to get a different timestamp
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const newContactName = 'new_name'
    await dbConnection.getRepository(ContactEntity).save({ ...savedContact, name: newContactName })

    const fromDb = await dbConnection.getRepository(ContactEntity).findOne({
      where: { id: savedContact.id },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.lastUpdatedAt).not.toEqual(savedContact?.lastUpdatedAt)
  })

  it('Should set last updated date when saving identity', async (): Promise<void> => {
    const correlationId = 'example_did'
    const identity = {
      alias: correlationId,
      roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId,
      },
    }

    const identityEntity: IdentityEntity = identityEntityFrom(identity)
    await dbConnection.getRepository(IdentityEntity).save(identityEntity)

    const fromDb = await dbConnection.getRepository(IdentityEntity).findOne({
      where: {
        identifier: {
          correlationId,
        },
      },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.lastUpdatedAt).toBeDefined()
  })
})
