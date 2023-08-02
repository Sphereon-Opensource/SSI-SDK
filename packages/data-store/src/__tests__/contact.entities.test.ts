import { DataSource
  // , FindOptionsWhere
} from 'typeorm'

import { DataStoreContactEntities
  , DataStoreMigrations
} from '../index'
import {
  IBasicContact,
  ContactTypeEnum,
  IPerson,
  // IOrganization,
  // IdentityRoleEnum,
  // CorrelationIdentifierEnum,
  // ConnectionTypeEnum,
  // BasicContactType,
  // BasicOrganization,
  // BasicPerson,
  // IBasicConnection,
  // IBasicIdentity,
  // BasicDidAuthConfig,
  // BasicOpenIdConfig,
} from '../types'
import { PersonEntity
  // , personEntityFrom
} from '../entities/contact/PersonEntity'
// import { OrganizationEntity, organizationEntityFrom } from '../entities/contact/OrganizationEntity'
// import { ContactRelationshipEntity, contactRelationshipEntityFrom } from '../entities/contact/ContactRelationshipEntity'
// import { ContactTypeEntity, contactTypeEntityFrom } from '../entities/contact/ContactTypeEntity'
import { ContactEntity, contactEntityFrom } from '../entities/contact/ContactEntity'
// import { IdentityEntity, identityEntityFrom } from '../entities/contact/IdentityEntity'
// import { OpenIdConfigEntity, openIdConfigEntityFrom } from '../entities/contact/OpenIdConfigEntity'
// import { DidAuthConfigEntity, didAuthConfigEntityFrom } from '../entities/contact/DidAuthConfigEntity'
// import { ConnectionEntity, connectionEntityFrom } from '../entities/contact/ConnectionEntity'
// import { CorrelationIdentifierEntity } from '../entities/contact/CorrelationIdentifierEntity'
// import { IdentityMetadataItemEntity } from '../entities/contact/IdentityMetadataItemEntity'
// import { ContactOwnerEntity } from '../entities/contact/ContactOwnerEntity'

describe('Database entities tests', (): void => {
  let dbConnection: DataSource

  // beforeEach(async (): Promise<void> => {
  //   dbConnection = await new DataSource({
  //     type: 'sqlite',
  //     database: ':memory:',
  //     logging: 'all',
  //     migrationsRun: false,
  //     // migrations: DataStoreMigrations,
  //     synchronize: true, //false
  //     entities: DataStoreContactEntities,
  //   }).initialize()
  //   // await dbConnection.runMigrations()
  //   // expect(await dbConnection.showMigrations()).toBeFalsy()
  // })

  beforeEach(async (): Promise<void> => {
    dbConnection = await new DataSource({
      type: 'sqlite',
      database: ':memory:',
      logging: 'all',
      migrationsRun: false,
      migrations: DataStoreMigrations,
      synchronize: false, //false
      entities: DataStoreContactEntities,
    }).initialize()
    await dbConnection.runMigrations()
    expect(await dbConnection.showMigrations()).toBeFalsy()
  })

  afterEach(async (): Promise<void> => {
    await (await dbConnection).destroy()
  })

  it('Should save person contact to database', async (): Promise<void> => {
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

    const contactEntity: ContactEntity = contactEntityFrom(contact)
    await dbConnection.getRepository(ContactEntity).save(contactEntity, {
      transaction: true,
    })

    const fromDb: ContactEntity | null = await dbConnection.getRepository(ContactEntity).findOne({
      where: { id: contactEntity.id },
    })

    expect(fromDb).toBeDefined()
    expect(fromDb?.identities?.length).toEqual(0)
    expect(fromDb?.uri).toEqual(contact.uri)
    expect(fromDb?.contactType).toBeDefined()
    expect(fromDb?.contactType.type).toEqual(contact.contactType.type)
    expect(fromDb?.contactType.tenantId).toEqual(contact.contactType.tenantId)
    expect(fromDb?.contactType.name).toEqual(contact.contactType.name)
    expect(fromDb?.contactOwner).toBeDefined()
    expect((<PersonEntity>fromDb?.contactOwner).firstName).toEqual((<IPerson>contact.contactOwner).firstName)
    expect((<PersonEntity>fromDb?.contactOwner).middleName).toEqual((<IPerson>contact.contactOwner).middleName)
    expect((<PersonEntity>fromDb?.contactOwner).lastName).toEqual((<IPerson>contact.contactOwner).lastName)
    expect((<PersonEntity>fromDb?.contactOwner).displayName).toEqual((<IPerson>contact.contactOwner).displayName)
  })
  //
  // it('Should save organization contact to database', async (): Promise<void> => {
  //   const contact: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: {
  //       type: ContactTypeEnum.ORGANIZATION,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name',
  //     },
  //     contactOwner: {
  //       legalName: 'example_legal_name',
  //       displayName: 'example_display_name',
  //       cocNumber: 'example_coc_number',
  //     },
  //   }
  //
  //   const contactEntity: ContactEntity = contactEntityFrom(contact)
  //   await dbConnection.getRepository(ContactEntity).save(contactEntity, {
  //     transaction: true,
  //   })
  //
  //   const fromDb: ContactEntity | null = await dbConnection.getRepository(ContactEntity).findOne({
  //     where: { id: contactEntity.id },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  //   expect(fromDb?.identities?.length).toEqual(0)
  //   expect(fromDb?.uri).toEqual(contact.uri)
  //   expect(fromDb?.contactType).toBeDefined()
  //   expect(fromDb?.contactType.type).toEqual(contact.contactType.type)
  //   expect(fromDb?.contactType.tenantId).toEqual(contact.contactType.tenantId)
  //   expect(fromDb?.contactType.name).toEqual(contact.contactType.name)
  //   expect(fromDb?.contactOwner).toBeDefined()
  //   expect((<OrganizationEntity>fromDb?.contactOwner).legalName).toEqual((<IOrganization>contact.contactOwner).legalName)
  //   expect((<OrganizationEntity>fromDb?.contactOwner).displayName).toEqual((<IOrganization>contact.contactOwner).displayName)
  //   expect((<OrganizationEntity>fromDb?.contactOwner).cocNumber).toEqual((<IOrganization>contact.contactOwner).cocNumber)
  // })
  //
  // it('Should result in contact relationship for the owner side only', async (): Promise<void> => {
  //   const contact1: IBasicContact = {
  //     uri: 'example1.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name1',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name1',
  //       middleName: 'example_middle_name1',
  //       lastName: 'example_last_name1',
  //       displayName: 'example_display_name1',
  //     },
  //   }
  //
  //   const contactEntity1: ContactEntity = contactEntityFrom(contact1)
  //   const savedContact1: ContactEntity = await dbConnection.getRepository(ContactEntity).save(contactEntity1, {
  //     transaction: true,
  //   })
  //
  //   const contact2: IBasicContact = {
  //     uri: 'example2.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
  //       name: 'example_name2',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name2',
  //       middleName: 'example_middle_name2',
  //       lastName: 'example_last_name2',
  //       displayName: 'example_display_name2',
  //     },
  //   }
  //
  //   const contactEntity2: ContactEntity = contactEntityFrom(contact2)
  //   const savedContact2: ContactEntity = await dbConnection.getRepository(ContactEntity).save(contactEntity2, {
  //     transaction: true,
  //   })
  //
  //   const relationship: ContactRelationshipEntity = contactRelationshipEntityFrom({
  //     left: savedContact1,
  //     right: savedContact2,
  //   })
  //
  //   await dbConnection.getRepository(ContactRelationshipEntity).save(relationship, {
  //     transaction: true,
  //   })
  //
  //   const fromDb1: ContactEntity | null = await dbConnection.getRepository(ContactEntity).findOne({
  //     where: { id: savedContact1.id },
  //   })
  //
  //   const fromDb2: ContactEntity | null = await dbConnection.getRepository(ContactEntity).findOne({
  //     where: { id: savedContact2.id },
  //   })
  //
  //   expect(fromDb1).toBeDefined()
  //   expect(fromDb1?.relationships.length).toEqual(1)
  //   expect(fromDb2).toBeDefined()
  //   expect(fromDb2?.relationships.length).toEqual(0)
  // })
  //
  // it('should throw error when saving person contact with blank first name', async (): Promise<void> => {
  //   const contact: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name',
  //     },
  //     contactOwner: {
  //       firstName: '',
  //       middleName: 'example_middle_name1',
  //       lastName: 'example_last_name1',
  //       displayName: 'example_display_name1',
  //     },
  //   }
  //
  //   const contactEntity: ContactEntity = contactEntityFrom(contact)
  //
  //   await expect(dbConnection.getRepository(ContactEntity).save(contactEntity)).rejects.toThrowError('Blank first names are not allowed')
  // })
  //
  // it('should throw error when saving person contact with blank middle name', async (): Promise<void> => {
  //   const contact: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name',
  //       middleName: '',
  //       lastName: 'example_last_name',
  //       displayName: 'example_display_name',
  //     },
  //   }
  //
  //   const contactEntity: ContactEntity = contactEntityFrom(contact)
  //
  //   await expect(dbConnection.getRepository(ContactEntity).save(contactEntity)).rejects.toThrowError('Blank middle names are not allowed')
  // })
  //
  // it('should throw error when saving person contact with blank last name', async (): Promise<void> => {
  //   const contact: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name',
  //       middleName: 'example_middle_name',
  //       lastName: '',
  //       displayName: 'example_display_name',
  //     },
  //   }
  //
  //   const contactEntity: ContactEntity = contactEntityFrom(contact)
  //
  //   await expect(dbConnection.getRepository(ContactEntity).save(contactEntity)).rejects.toThrowError('Blank last names are not allowed')
  // })
  //
  // it('should throw error when saving person contact with blank display name', async (): Promise<void> => {
  //   const contact: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name',
  //       middleName: 'example_middle_name',
  //       lastName: 'example_last_name',
  //       displayName: '',
  //     },
  //   }
  //
  //   const contactEntity: ContactEntity = contactEntityFrom(contact)
  //
  //   await expect(dbConnection.getRepository(ContactEntity).save(contactEntity)).rejects.toThrowError('Blank display names are not allowed')
  // })
  //
  // it('should throw error when saving organization contact with blank legal name', async (): Promise<void> => {
  //   const contact: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: {
  //       type: ContactTypeEnum.ORGANIZATION,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name',
  //     },
  //     contactOwner: {
  //       legalName: '',
  //       displayName: 'example_legal_name',
  //       cocNumber: 'example_coc_number',
  //     },
  //   }
  //
  //   const contactEntity: ContactEntity = contactEntityFrom(contact)
  //
  //   await expect(dbConnection.getRepository(ContactEntity).save(contactEntity)).rejects.toThrowError('Blank legal names are not allowed')
  // })
  //
  // it('should throw error when saving organization contact with blank display name', async (): Promise<void> => {
  //   const contact: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: {
  //       type: ContactTypeEnum.ORGANIZATION,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name',
  //     },
  //     contactOwner: {
  //       legalName: 'example_first_name',
  //       displayName: '',
  //       cocNumber: 'example_coc_number',
  //     },
  //   }
  //
  //   const contactEntity: ContactEntity = contactEntityFrom(contact)
  //
  //   await expect(dbConnection.getRepository(ContactEntity).save(contactEntity)).rejects.toThrowError('Blank display names are not allowed')
  // })
  //
  // it('should throw error when saving organization contact with blank coc number', async (): Promise<void> => {
  //   const contact: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: {
  //       type: ContactTypeEnum.ORGANIZATION,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name',
  //     },
  //     contactOwner: {
  //       legalName: 'example_first_name',
  //       displayName: 'example_display_name',
  //       cocNumber: '',
  //     },
  //   }
  //
  //   const contactEntity: ContactEntity = contactEntityFrom(contact)
  //
  //   await expect(dbConnection.getRepository(ContactEntity).save(contactEntity)).rejects.toThrowError('Blank coc numbers are not allowed')
  // })
  //
  // it('should throw error when saving contact with blank contact type name', async (): Promise<void> => {
  //   const contact: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: '',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name',
  //       middleName: 'example_middle_name',
  //       lastName: 'example_last_name',
  //       displayName: 'example_display_name',
  //     },
  //   }
  //
  //   const contactEntity: ContactEntity = contactEntityFrom(contact)
  //
  //   await expect(dbConnection.getRepository(ContactEntity).save(contactEntity)).rejects.toThrowError('Blank names are not allowed')
  // })
  //
  // it('should throw error when saving contact with blank contact type description', async (): Promise<void> => {
  //   const contact: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name',
  //       description: '',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name',
  //       middleName: 'example_middle_name',
  //       lastName: 'example_last_name',
  //       displayName: 'example_display_name',
  //     },
  //   }
  //
  //   const contactEntity: ContactEntity = contactEntityFrom(contact)
  //
  //   await expect(dbConnection.getRepository(ContactEntity).save(contactEntity)).rejects.toThrowError('Blank descriptions are not allowed')
  // })
  //
  // it('should throw error when saving contact with blank contact type tenant id', async (): Promise<void> => {
  //   const contact: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '',
  //       name: 'example_name',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name',
  //       middleName: 'example_middle_name',
  //       lastName: 'example_last_name',
  //       displayName: 'example_display_name',
  //     },
  //   }
  //
  //   const contactEntity: ContactEntity = contactEntityFrom(contact)
  //
  //   await expect(dbConnection.getRepository(ContactEntity).save(contactEntity)).rejects.toThrowError("Blank tenant id's are not allowed")
  // })
  //
  // it('Should enforce unique display name for a person contact', async (): Promise<void> => {
  //   const contactDisplayName = 'non_unique_name'
  //   const contact1: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
  //       name: 'example_name',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name',
  //       middleName: 'example_middle_name',
  //       lastName: 'example_last_name',
  //       displayName: contactDisplayName,
  //     },
  //   }
  //   const contact1Entity: ContactEntity = contactEntityFrom(contact1)
  //   await dbConnection.getRepository(ContactEntity).save(contact1Entity)
  //
  //   const contact2: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name',
  //       middleName: 'example_middle_name',
  //       lastName: 'example_last_name',
  //       displayName: contactDisplayName,
  //     },
  //   }
  //   const contact2Entity: ContactEntity = contactEntityFrom(contact2)
  //
  //   await expect(dbConnection.getRepository(ContactEntity).save(contact2Entity)).rejects.toThrowError(
  //     'SQLITE_CONSTRAINT: UNIQUE constraint failed: contact_type_entity.name'
  //   )
  // })
  //
  // it('Should enforce unique display name for a organization contact', async (): Promise<void> => {
  //   const contactDisplayName = 'non_unique_name'
  //   const contact1: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: {
  //       type: ContactTypeEnum.ORGANIZATION,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
  //       name: 'example_name',
  //     },
  //     contactOwner: {
  //       legalName: 'example_first_name',
  //       displayName: contactDisplayName,
  //       cocNumber: 'example_coc_number',
  //     },
  //   }
  //   const contact1Entity: ContactEntity = contactEntityFrom(contact1)
  //   await dbConnection.getRepository(ContactEntity).save(contact1Entity)
  //
  //   const contact2: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: {
  //       type: ContactTypeEnum.ORGANIZATION,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name',
  //     },
  //     contactOwner: {
  //       legalName: 'example_first_name',
  //       displayName: contactDisplayName,
  //       cocNumber: 'example_coc_number',
  //     },
  //   }
  //   const contact2Entity: ContactEntity = contactEntityFrom(contact2)
  //
  //   await expect(dbConnection.getRepository(ContactEntity).save(contact2Entity)).rejects.toThrowError(
  //     'SQLITE_CONSTRAINT: UNIQUE constraint failed: contact_type_entity.name'
  //   )
  // })
  //
  // it('Should enforce unique alias for an identity', async (): Promise<void> => {
  //   const alias = 'non_unique_alias'
  //   const identity1: IBasicIdentity = {
  //     alias,
  //     roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
  //     identifier: {
  //       type: CorrelationIdentifierEnum.DID,
  //       correlationId: 'unique_correlationId1',
  //     },
  //   }
  //   const identity1Entity: IdentityEntity = identityEntityFrom(identity1)
  //   await dbConnection.getRepository(IdentityEntity).save(identity1Entity)
  //
  //   const identity2: IBasicIdentity = {
  //     alias: alias,
  //     roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
  //     identifier: {
  //       type: CorrelationIdentifierEnum.DID,
  //       correlationId: 'unique_correlationId2',
  //     },
  //   }
  //   const identity2Entity: IdentityEntity = identityEntityFrom(identity2)
  //   await expect(dbConnection.getRepository(IdentityEntity).save(identity2Entity)).rejects.toThrowError(
  //     'SQLITE_CONSTRAINT: UNIQUE constraint failed: Identity.alias'
  //   )
  // })
  //
  // it('Should enforce unique correlationId for a identity', async (): Promise<void> => {
  //   const correlationId = 'non_unique_correlationId'
  //   const identity1: IBasicIdentity = {
  //     alias: 'unique_alias1',
  //     roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
  //     identifier: {
  //       type: CorrelationIdentifierEnum.DID,
  //       correlationId,
  //     },
  //   }
  //   const identity1Entity: IdentityEntity = identityEntityFrom(identity1)
  //   await dbConnection.getRepository(IdentityEntity).save(identity1Entity)
  //
  //   const identity2: IBasicIdentity = {
  //     alias: 'unique_alias2',
  //     roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
  //     identifier: {
  //       type: CorrelationIdentifierEnum.DID,
  //       correlationId,
  //     },
  //   }
  //   const identity2Entity: IdentityEntity = identityEntityFrom(identity2)
  //   await expect(dbConnection.getRepository(IdentityEntity).save(identity2Entity)).rejects.toThrowError(
  //     'SQLITE_CONSTRAINT: UNIQUE constraint failed: CorrelationIdentifier.correlation_id'
  //   )
  // })
  //
  // it('Should save identity to database', async (): Promise<void> => {
  //   const correlationId = 'example_did'
  //   const identity: IBasicIdentity = {
  //     alias: correlationId,
  //     roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
  //     identifier: {
  //       type: CorrelationIdentifierEnum.DID,
  //       correlationId,
  //     },
  //   }
  //
  //   const identityEntity: IdentityEntity = identityEntityFrom(identity)
  //
  //   await dbConnection.getRepository(IdentityEntity).save(identityEntity)
  //
  //   const fromDb: IdentityEntity | null = await dbConnection.getRepository(IdentityEntity).findOne({
  //     where: {
  //       identifier: {
  //         correlationId,
  //       },
  //     },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  //   expect(fromDb?.connection).toBeNull()
  //   expect(fromDb?.identifier).toBeDefined()
  //   expect(fromDb?.identifier.correlationId).toEqual(identity.identifier.correlationId)
  //   expect(fromDb?.identifier.type).toEqual(identity.identifier.type)
  // })
  //
  // it('should throw error when saving identity with blank alias', async (): Promise<void> => {
  //   const identity: IBasicIdentity = {
  //     alias: '',
  //     roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
  //     identifier: {
  //       type: CorrelationIdentifierEnum.DID,
  //       correlationId: 'example_did',
  //     },
  //   }
  //
  //   const identityEntity: IdentityEntity = identityEntityFrom(identity)
  //
  //   await expect(dbConnection.getRepository(IdentityEntity).save(identityEntity)).rejects.toThrowError('Blank aliases are not allowed')
  // })
  //
  // it('should throw error when saving identity with blank correlation id', async (): Promise<void> => {
  //   const identity: IBasicIdentity = {
  //     alias: 'example_did',
  //     roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
  //     identifier: {
  //       type: CorrelationIdentifierEnum.DID,
  //       correlationId: '',
  //     },
  //   }
  //
  //   const identityEntity: IdentityEntity = identityEntityFrom(identity)
  //
  //   await expect(dbConnection.getRepository(IdentityEntity).save(identityEntity)).rejects.toThrowError('Blank correlation ids are not allowed')
  // })
  //
  // it('should throw error when saving identity with blank metadata label', async (): Promise<void> => {
  //   const correlationId = 'example_did'
  //   const identity: IBasicIdentity = {
  //     alias: correlationId,
  //     roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
  //     identifier: {
  //       type: CorrelationIdentifierEnum.DID,
  //       correlationId,
  //     },
  //     metadata: [
  //       {
  //         label: '',
  //         value: 'example_value',
  //       },
  //     ],
  //   }
  //
  //   const identityEntity: IdentityEntity = identityEntityFrom(identity)
  //
  //   await expect(dbConnection.getRepository(IdentityEntity).save(identityEntity)).rejects.toThrowError('Blank metadata labels are not allowed')
  // })
  //
  // it('should throw error when saving identity with blank metadata value', async (): Promise<void> => {
  //   const correlationId = 'example_did'
  //   const identity: IBasicIdentity = {
  //     alias: correlationId,
  //     roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
  //     identifier: {
  //       type: CorrelationIdentifierEnum.DID,
  //       correlationId,
  //     },
  //     metadata: [
  //       {
  //         label: 'example_label',
  //         value: '',
  //       },
  //     ],
  //   }
  //
  //   const identityEntity: IdentityEntity = identityEntityFrom(identity)
  //
  //   await expect(dbConnection.getRepository(IdentityEntity).save(identityEntity)).rejects.toThrowError('Blank metadata values are not allowed')
  // })
  //
  // it('Should save identity with openid connection to database', async (): Promise<void> => {
  //   const correlationId = 'example.com'
  //   const identity: IBasicIdentity = {
  //     alias: correlationId,
  //     roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
  //     identifier: {
  //       type: CorrelationIdentifierEnum.URL,
  //       correlationId,
  //     },
  //     connection: {
  //       type: ConnectionTypeEnum.OPENID_CONNECT,
  //       config: {
  //         clientId: '138d7bf8-c930-4c6e-b928-97d3a4928b01',
  //         clientSecret: '03b3955f-d020-4f2a-8a27-4e452d4e27a0',
  //         scopes: ['auth'],
  //         issuer: 'https://example.com/app-test',
  //         redirectUrl: 'app:/callback',
  //         dangerouslyAllowInsecureHttpRequests: true,
  //         clientAuthMethod: <const>'post',
  //       },
  //     },
  //   }
  //
  //   const identityEntity: IdentityEntity = identityEntityFrom(identity)
  //
  //   await dbConnection.getRepository(IdentityEntity).save(identityEntity)
  //
  //   const fromDb: IdentityEntity | null = await dbConnection.getRepository(IdentityEntity).findOne({
  //     where: {
  //       identifier: {
  //         correlationId,
  //       },
  //     },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  //   expect(fromDb?.connection).toBeDefined()
  //   expect(fromDb?.identifier).toBeDefined()
  //   expect(fromDb?.identifier.correlationId).toEqual(identity.identifier.correlationId)
  //   expect(fromDb?.identifier.type).toEqual(identity.identifier.type)
  //   expect(fromDb?.connection?.type).toEqual(identity.connection?.type)
  //   expect(fromDb?.connection?.config).toBeDefined()
  //   expect((<OpenIdConfigEntity>fromDb?.connection?.config).clientId).toEqual((<BasicOpenIdConfig>identity.connection?.config).clientId)
  // })
  //
  // it('Should save identity with didauth connection to database', async (): Promise<void> => {
  //   const correlationId = 'example.com'
  //   const identity: IBasicIdentity = {
  //     alias: correlationId,
  //     roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
  //     identifier: {
  //       type: CorrelationIdentifierEnum.URL,
  //       correlationId,
  //     },
  //     connection: {
  //       type: ConnectionTypeEnum.SIOPv2,
  //       config: {
  //         identifier: {
  //           did: 'did:test:138d7bf8-c930-4c6e-b928-97d3a4928b01',
  //           provider: 'test_provider',
  //           keys: [],
  //           services: [],
  //         },
  //         redirectUrl: 'https://example.com',
  //         stateId: 'e91f3510-5ce9-42ee-83b7-fa68ff323d27',
  //         sessionId: 'https://example.com/did:test:138d7bf8-c930-4c6e-b928-97d3a4928b01',
  //       },
  //     },
  //   }
  //
  //   const identityEntity: IdentityEntity = identityEntityFrom(identity)
  //
  //   await dbConnection.getRepository(IdentityEntity).save(identityEntity)
  //
  //   const fromDb: IdentityEntity | null = await dbConnection.getRepository(IdentityEntity).findOne({
  //     where: {
  //       identifier: {
  //         correlationId,
  //       },
  //     },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  //   expect(fromDb?.connection).toBeDefined()
  //   expect(fromDb?.identifier).toBeDefined()
  //   expect(fromDb?.identifier.correlationId).toEqual(identity.identifier.correlationId)
  //   expect(fromDb?.identifier.type).toEqual(identity.identifier.type)
  //   expect(fromDb?.connection?.type).toEqual(identity.connection?.type)
  //   expect(fromDb?.connection?.config).toBeDefined()
  //   expect((<DidAuthConfigEntity>fromDb?.connection?.config).identifier).toEqual((<BasicDidAuthConfig>identity.connection?.config).identifier.did)
  // })
  //
  // it('Should save connection with openid config to database', async (): Promise<void> => {
  //   const connection: IBasicConnection = {
  //     type: ConnectionTypeEnum.OPENID_CONNECT,
  //     config: {
  //       clientId: '138d7bf8-c930-4c6e-b928-97d3a4928b01',
  //       clientSecret: '03b3955f-d020-4f2a-8a27-4e452d4e27a0',
  //       scopes: ['auth'],
  //       issuer: 'https://example.com/app-test',
  //       redirectUrl: 'app:/callback',
  //       dangerouslyAllowInsecureHttpRequests: true,
  //       clientAuthMethod: <const>'post',
  //     },
  //   }
  //   const connectionEntity: ConnectionEntity = connectionEntityFrom(connection)
  //   await dbConnection.getRepository(ConnectionEntity).save(connectionEntity, {
  //     transaction: true,
  //   })
  //
  //   const fromDb: ConnectionEntity | null = await dbConnection.getRepository(ConnectionEntity).findOne({
  //     where: { type: connection.type },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  //
  //   const fromDbConfig: OpenIdConfigEntity | null = await dbConnection.getRepository(OpenIdConfigEntity).findOne({
  //     where: { id: fromDb?.id },
  //   })
  //
  //   expect(fromDbConfig).toBeDefined()
  //   expect(fromDb?.type).toEqual(connection.type)
  //   expect(fromDb?.config).toBeDefined()
  //   expect((<OpenIdConfigEntity>fromDb?.config).clientId).toEqual((<BasicOpenIdConfig>connection.config).clientId)
  // })
  //
  // it('Should save connection with didauth config to database', async (): Promise<void> => {
  //   const connection: IBasicConnection = {
  //     type: ConnectionTypeEnum.SIOPv2,
  //     config: {
  //       identifier: {
  //         did: 'did:test:138d7bf8-c930-4c6e-b928-97d3a4928b01',
  //         provider: 'test_provider',
  //         keys: [],
  //         services: [],
  //       },
  //       redirectUrl: 'https://example.com',
  //       stateId: 'e91f3510-5ce9-42ee-83b7-fa68ff323d27',
  //       sessionId: 'https://example.com/did:test:138d7bf8-c930-4c6e-b928-97d3a4928b01',
  //     },
  //   }
  //   const connectionEntity: ConnectionEntity = connectionEntityFrom(connection)
  //   await dbConnection.getRepository(ConnectionEntity).save(connectionEntity, {
  //     transaction: true,
  //   })
  //
  //   const fromDb: ConnectionEntity | null = await dbConnection.getRepository(ConnectionEntity).findOne({
  //     where: { type: connection.type },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  //
  //   const fromDbConfig: DidAuthConfigEntity | null = await dbConnection.getRepository(DidAuthConfigEntity).findOne({
  //     where: { id: fromDb?.id },
  //   })
  //
  //   expect(fromDbConfig).toBeDefined()
  //   expect(fromDb?.type).toEqual(connection.type)
  //   expect(fromDb?.config).toBeDefined()
  //   expect((<DidAuthConfigEntity>fromDb?.config).identifier).toEqual((<BasicDidAuthConfig>connection.config).identifier.did)
  // })
  //
  // it('Should save openid config to database', async (): Promise<void> => {
  //   const clientId = '138d7bf8-c930-4c6e-b928-97d3a4928b01'
  //   const config: BasicOpenIdConfig = {
  //     clientId,
  //     clientSecret: '03b3955f-d020-4f2a-8a27-4e452d4e27a0',
  //     scopes: ['auth'],
  //     issuer: 'https://example.com/app-test',
  //     redirectUrl: 'app:/callback',
  //     dangerouslyAllowInsecureHttpRequests: true,
  //     clientAuthMethod: <const>'post',
  //   }
  //
  //   const configEntity: OpenIdConfigEntity = openIdConfigEntityFrom(config)
  //   await dbConnection.getRepository(OpenIdConfigEntity).save(configEntity, {
  //     transaction: true,
  //   })
  //
  //   const fromDb: OpenIdConfigEntity | null = await dbConnection.getRepository(OpenIdConfigEntity).findOne({
  //     where: { clientId: config.clientId },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  //   expect((<OpenIdConfigEntity>fromDb).clientId).toEqual(config.clientId)
  // })
  //
  // it('Should save didauth config to database', async (): Promise<void> => {
  //   const sessionId = 'https://example.com/did:test:138d7bf8-c930-4c6e-b928-97d3a4928b01'
  //   const config: BasicDidAuthConfig = {
  //     identifier: {
  //       did: 'did:test:138d7bf8-c930-4c6e-b928-97d3a4928b01',
  //       provider: 'test_provider',
  //       keys: [],
  //       services: [],
  //     },
  //     redirectUrl: 'https://example.com',
  //     stateId: 'e91f3510-5ce9-42ee-83b7-fa68ff323d27',
  //     sessionId,
  //   }
  //
  //   const configEntity: DidAuthConfigEntity = didAuthConfigEntityFrom(config)
  //   await dbConnection.getRepository(DidAuthConfigEntity).save(configEntity, {
  //     transaction: true,
  //   })
  //
  //   const fromDb: DidAuthConfigEntity | null = await dbConnection.getRepository(DidAuthConfigEntity).findOne({
  //     where: { sessionId: config.sessionId },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  //   expect((<DidAuthConfigEntity>fromDb).identifier).toEqual(config.identifier.did)
  // })
  //
  // it('Should delete contact and all child relations', async (): Promise<void> => {
  //   const contact1: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name1',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name1',
  //       middleName: 'example_middle_name1',
  //       lastName: 'example_last_name1',
  //       displayName: 'example_display_name1',
  //     },
  //   }
  //
  //   const contactEntity1: ContactEntity = contactEntityFrom(contact1)
  //   const savedContact1: ContactEntity | null = await dbConnection.getRepository(ContactEntity).save(contactEntity1)
  //
  //   expect(savedContact1).toBeDefined()
  //
  //   const contact2: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
  //       name: 'example_name2',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name2',
  //       middleName: 'example_middle_name2',
  //       lastName: 'example_last_name2',
  //       displayName: 'example_display_name2',
  //     },
  //   }
  //
  //   const contactEntity2: ContactEntity = contactEntityFrom(contact2)
  //   const savedContact2: ContactEntity | null = await dbConnection.getRepository(ContactEntity).save(contactEntity2)
  //
  //   expect(savedContact2).toBeDefined()
  //
  //   const correlationId = 'relation_example.com'
  //   const identity: IBasicIdentity = {
  //     alias: correlationId,
  //     roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
  //     identifier: {
  //       type: CorrelationIdentifierEnum.URL,
  //       correlationId,
  //     },
  //     connection: {
  //       type: ConnectionTypeEnum.OPENID_CONNECT,
  //       config: {
  //         clientId: '138d7bf8-c930-4c6e-b928-97d3a4928b01',
  //         clientSecret: '03b3955f-d020-4f2a-8a27-4e452d4e27a0',
  //         scopes: ['auth'],
  //         issuer: 'https://example.com/app-test',
  //         redirectUrl: 'app:/callback',
  //         dangerouslyAllowInsecureHttpRequests: true,
  //         clientAuthMethod: <const>'post',
  //       },
  //     },
  //     metadata: [
  //       {
  //         label: 'example_label',
  //         value: 'example_value',
  //       },
  //     ],
  //   }
  //
  //   const identityEntity: IdentityEntity = identityEntityFrom(identity)
  //   identityEntity.contact = savedContact1
  //
  //   const savedIdentity: IdentityEntity | null = await dbConnection.getRepository(IdentityEntity).save(identityEntity)
  //
  //   expect(savedIdentity).toBeDefined()
  //
  //   const relationship: ContactRelationshipEntity = contactRelationshipEntityFrom({
  //     left: savedContact1,
  //     right: savedContact2,
  //   })
  //
  //   const savedRelationship: ContactRelationshipEntity | null = await dbConnection.getRepository(ContactRelationshipEntity).save(relationship, {
  //     transaction: true,
  //   })
  //
  //   expect(savedRelationship).toBeDefined()
  //
  //   expect(
  //     await dbConnection.getRepository(ContactEntity).findOne({
  //       where: { id: savedContact1.id },
  //     })
  //   ).toBeDefined()
  //
  //   await dbConnection.getRepository(ContactEntity).delete({ id: savedContact1.id })
  //
  //   // check contact
  //   await expect(
  //     await dbConnection.getRepository(ContactEntity).findOne({
  //       where: { id: savedContact1.id },
  //     })
  //   ).toBeNull()
  //
  //   // check identity
  //   expect(
  //     await dbConnection.getRepository(IdentityEntity).findOne({
  //       where: { id: savedContact1.id },
  //     })
  //   ).toBeNull()
  //
  //   // check identity identifier
  //   expect(
  //     await dbConnection.getRepository(CorrelationIdentifierEntity).findOne({
  //       where: { id: savedIdentity.identifier.id },
  //     })
  //   ).toBeNull()
  //
  //   // check identity connection
  //   expect(
  //     await dbConnection.getRepository(ConnectionEntity).findOne({
  //       where: { id: savedIdentity.connection!.id },
  //     })
  //   ).toBeNull()
  //
  //   // check connection config
  //   expect(
  //     await dbConnection.getRepository(OpenIdConfigEntity).findOne({
  //       where: { id: savedIdentity.connection!.config.id },
  //     })
  //   ).toBeNull()
  //
  //   // check identity metadata
  //   expect(
  //     await dbConnection.getRepository(IdentityMetadataItemEntity).findOne({
  //       where: { id: savedIdentity.metadata![0].id },
  //     })
  //   ).toBeNull()
  //
  //   // check contact owner
  //   expect(
  //     await dbConnection.getRepository(ContactOwnerEntity).findOne({
  //       where: { id: savedContact1.contactOwner.id },
  //     })
  //   ).toBeNull()
  //
  //   // check contact type
  //   expect(
  //     await dbConnection.getRepository(ContactTypeEntity).findOne({
  //       where: { id: savedContact1.contactType.id },
  //     })
  //   ).toBeDefined()
  //
  //   // check relation
  //   expect(
  //     await dbConnection.getRepository(ContactRelationshipEntity).findOne({
  //       where: { id: savedRelationship.id },
  //     })
  //   ).toBeNull()
  // })
  //
  // it('Should delete identity and all child relations', async (): Promise<void> => {
  //   const contact: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name',
  //       middleName: 'example_middle_name',
  //       lastName: 'example_last_name',
  //       displayName: 'example_display_name',
  //     },
  //   }
  //
  //   const contactEntity: ContactEntity = contactEntityFrom(contact)
  //   const savedContact: ContactEntity | null = await dbConnection.getRepository(ContactEntity).save(contactEntity)
  //
  //   expect(savedContact).toBeDefined()
  //
  //   const correlationId = 'relation_example.com'
  //   const identity: IBasicIdentity = {
  //     alias: correlationId,
  //     roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
  //     identifier: {
  //       type: CorrelationIdentifierEnum.URL,
  //       correlationId,
  //     },
  //     connection: {
  //       type: ConnectionTypeEnum.SIOPv2,
  //       config: {
  //         identifier: {
  //           did: 'did:test:138d7bf8-c930-4c6e-b928-97d3a4928b01',
  //           provider: 'test_provider',
  //           keys: [],
  //           services: [],
  //         },
  //         redirectUrl: 'https://example.com',
  //         stateId: 'e91f3510-5ce9-42ee-83b7-fa68ff323d27',
  //         sessionId: 'https://example.com/did:test:138d7bf8-c930-4c6e-b928-97d3a4928b01',
  //       },
  //     },
  //     metadata: [
  //       {
  //         label: 'example_label',
  //         value: 'example_value',
  //       },
  //     ],
  //   }
  //
  //   const identityEntity: IdentityEntity = identityEntityFrom(identity)
  //   identityEntity.contact = savedContact
  //
  //   const savedIdentity: IdentityEntity | null = await dbConnection.getRepository(IdentityEntity).save(identityEntity)
  //
  //   expect(
  //     await dbConnection.getRepository(ContactEntity).findOne({
  //       where: { id: savedContact.id },
  //     })
  //   ).toBeDefined()
  //
  //   await dbConnection.getRepository(IdentityEntity).delete({ id: savedIdentity.id })
  //
  //   // check identity
  //   expect(
  //     await dbConnection.getRepository(IdentityEntity).findOne({
  //       where: { alias: correlationId },
  //     })
  //   ).toBeNull()
  //
  //   // check identity identifier
  //   expect(
  //     await dbConnection.getRepository(CorrelationIdentifierEntity).findOne({
  //       where: { id: savedIdentity.identifier.id },
  //     })
  //   ).toBeNull()
  //
  //   // check identity connection
  //   expect(
  //     await dbConnection.getRepository(ConnectionEntity).findOne({
  //       where: { id: savedIdentity.connection!.id },
  //     })
  //   ).toBeNull()
  //
  //   // check connection config
  //   expect(
  //     await dbConnection.getRepository(OpenIdConfigEntity).findOne({
  //       where: { id: savedIdentity.connection!.config.id },
  //     })
  //   ).toBeNull()
  //
  //   // check identity metadata
  //   expect(
  //     await dbConnection.getRepository(IdentityMetadataItemEntity).findOne({
  //       where: { id: savedIdentity.metadata![0].id },
  //     })
  //   ).toBeNull()
  // })
  //
  // it('Should not delete contact when deleting identity', async (): Promise<void> => {
  //   const contact: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name',
  //       middleName: 'example_middle_name',
  //       lastName: 'example_last_name',
  //       displayName: 'example_display_name',
  //     },
  //   }
  //
  //   const contactEntity: ContactEntity = contactEntityFrom(contact)
  //   const savedContact: ContactEntity | null = await dbConnection.getRepository(ContactEntity).save(contactEntity)
  //
  //   expect(savedContact).toBeDefined()
  //
  //   const correlationId = 'relation_example.com'
  //   const identity: IBasicIdentity = {
  //     alias: correlationId,
  //     roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
  //     identifier: {
  //       type: CorrelationIdentifierEnum.URL,
  //       correlationId,
  //     },
  //     connection: {
  //       type: ConnectionTypeEnum.SIOPv2,
  //       config: {
  //         identifier: {
  //           did: 'did:test:138d7bf8-c930-4c6e-b928-97d3a4928b01',
  //           provider: 'test_provider',
  //           keys: [],
  //           services: [],
  //         },
  //         redirectUrl: 'https://example.com',
  //         stateId: 'e91f3510-5ce9-42ee-83b7-fa68ff323d27',
  //         sessionId: 'https://example.com/did:test:138d7bf8-c930-4c6e-b928-97d3a4928b01',
  //       },
  //     },
  //     metadata: [
  //       {
  //         label: 'example_label',
  //         value: 'example_value',
  //       },
  //     ],
  //   }
  //
  //   const identityEntity: IdentityEntity = identityEntityFrom(identity)
  //   identityEntity.contact = savedContact
  //
  //   const savedIdentity: IdentityEntity | null = await dbConnection.getRepository(IdentityEntity).save(identityEntity)
  //
  //   expect(savedIdentity).toBeDefined()
  //
  //   await dbConnection.getRepository(IdentityEntity).delete({ id: savedIdentity.id })
  //
  //   // check identity
  //   expect(
  //     await dbConnection.getRepository(IdentityEntity).findOne({
  //       where: { id: savedIdentity.id },
  //     })
  //   ).toBeNull()
  //
  //   // check contact
  //   expect(
  //     await dbConnection.getRepository(ContactEntity).findOne({
  //       where: { id: savedContact.id },
  //     })
  //   ).toBeDefined()
  // })
  //
  // it('Should set creation date when saving contact', async (): Promise<void> => {
  //   const contact: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name',
  //       middleName: 'example_middle_name',
  //       lastName: 'example_last_name',
  //       displayName: 'example_display_name',
  //     },
  //   }
  //
  //   const contactEntity: ContactEntity = contactEntityFrom(contact)
  //   const savedContact: ContactEntity | null = await dbConnection.getRepository(ContactEntity).save(contactEntity)
  //
  //   const fromDb: ContactEntity | null = await dbConnection.getRepository(ContactEntity).findOne({
  //     where: { id: savedContact.id },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  //   expect(fromDb?.createdAt).toBeDefined()
  // })
  //
  // it('Should not update creation date when updating contact', async (): Promise<void> => {
  //   const contact: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name',
  //       middleName: 'example_middle_name',
  //       lastName: 'example_last_name',
  //       displayName: 'example_display_name',
  //     },
  //   }
  //
  //   const contactEntity: ContactEntity = contactEntityFrom(contact)
  //   const savedContact: ContactEntity | null = await dbConnection.getRepository(ContactEntity).save(contactEntity)
  //
  //   expect(savedContact).toBeDefined()
  //
  //   const newContactFirstName = 'new_first_name'
  //   await dbConnection.getRepository(ContactEntity).save({
  //     ...savedContact,
  //     contactOwner: {
  //       ...savedContact.contactOwner,
  //       firstName: newContactFirstName,
  //     },
  //   })
  //
  //   const fromDb: ContactEntity | null = await dbConnection.getRepository(ContactEntity).findOne({
  //     where: { id: savedContact.id },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  //   expect((<PersonEntity>fromDb?.contactOwner).firstName).toEqual(newContactFirstName)
  //   expect(fromDb?.createdAt).toEqual(savedContact?.createdAt)
  // })
  //
  // it('Should set creation date when saving identity', async (): Promise<void> => {
  //   const correlationId = 'example_did'
  //   const identity: IBasicIdentity = {
  //     alias: correlationId,
  //     roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
  //     identifier: {
  //       type: CorrelationIdentifierEnum.DID,
  //       correlationId,
  //     },
  //   }
  //
  //   const identityEntity: IdentityEntity = identityEntityFrom(identity)
  //   await dbConnection.getRepository(IdentityEntity).save(identityEntity)
  //
  //   const fromDb: IdentityEntity | null = await dbConnection.getRepository(IdentityEntity).findOne({
  //     where: {
  //       identifier: {
  //         correlationId,
  //       },
  //     },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  //   expect(fromDb?.createdAt).toBeDefined()
  // })
  //
  // it('Should not update creation date when saving identity', async (): Promise<void> => {
  //   const correlationId = 'example_did'
  //   const identity: IBasicIdentity = {
  //     alias: correlationId,
  //     roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
  //     identifier: {
  //       type: CorrelationIdentifierEnum.DID,
  //       correlationId,
  //     },
  //   }
  //
  //   const identityEntity: IdentityEntity = identityEntityFrom(identity)
  //   const savedIdentity: IdentityEntity | null = await dbConnection.getRepository(IdentityEntity).save(identityEntity)
  //   const newCorrelationId = 'new_example_did'
  //   await dbConnection
  //     .getRepository(IdentityEntity)
  //     .save({ ...savedIdentity, identifier: { ...savedIdentity.identifier, correlationId: newCorrelationId } })
  //
  //   const fromDb: IdentityEntity | null = await dbConnection.getRepository(IdentityEntity).findOne({
  //     where: {
  //       identifier: {
  //         correlationId: newCorrelationId,
  //       },
  //     },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  //   expect(fromDb?.createdAt).toEqual(savedIdentity?.createdAt)
  // })
  //
  // it('Should set last updated date when saving contact', async (): Promise<void> => {
  //   const contact: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name',
  //       middleName: 'example_middle_name',
  //       lastName: 'example_last_name',
  //       displayName: 'example_display_name',
  //     },
  //   }
  //
  //   const contactEntity: ContactEntity = contactEntityFrom(contact)
  //   const savedContact: ContactEntity | null = await dbConnection.getRepository(ContactEntity).save(contactEntity)
  //
  //   const fromDb: ContactEntity | null = await dbConnection.getRepository(ContactEntity).findOne({
  //     where: { id: savedContact.id },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  //   expect(fromDb?.lastUpdatedAt).toBeDefined()
  // })
  //
  // // TODO there is still an issue when updating nested objects, the parent does not update
  // it('Should update last updated date when updating contact', async (): Promise<void> => {
  //   const contact: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name',
  //       middleName: 'example_middle_name',
  //       lastName: 'example_last_name',
  //       displayName: 'example_display_name',
  //     },
  //   }
  //
  //   const contactEntity: ContactEntity = contactEntityFrom(contact)
  //   const savedContact: ContactEntity | null = await dbConnection.getRepository(ContactEntity).save(contactEntity)
  //
  //   expect(savedContact).toBeDefined()
  //
  //   // waiting here to get a different timestamp
  //   await new Promise((resolve) => setTimeout(resolve, 2000))
  //
  //   const newContactFirstName = 'new_first_name'
  //   await dbConnection.getRepository(ContactEntity).save({
  //     ...savedContact,
  //     uri: 'new uri', // TODO remove this to trigger the bug
  //     contactOwner: {
  //       ...savedContact.contactOwner,
  //       firstName: newContactFirstName,
  //     },
  //   })
  //
  //   const fromDb: ContactEntity | null = await dbConnection.getRepository(ContactEntity).findOne({
  //     where: { id: savedContact.id },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  //   expect((<PersonEntity>fromDb?.contactOwner).firstName).toEqual(newContactFirstName)
  //   expect(fromDb?.lastUpdatedAt).not.toEqual(savedContact?.lastUpdatedAt)
  // })
  //
  // it('Should set last updated date when saving contact type', async (): Promise<void> => {
  //   const contactType: BasicContactType = {
  //     type: ContactTypeEnum.PERSON,
  //     tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //     name: 'example_name',
  //   }
  //
  //   const contactTypeEntity: ContactTypeEntity = contactTypeEntityFrom(contactType)
  //   const savedContactType: ContactTypeEntity | null = await dbConnection.getRepository(ContactTypeEntity).save(contactTypeEntity)
  //
  //   const fromDb: ContactTypeEntity | null = await dbConnection.getRepository(ContactTypeEntity).findOne({
  //     where: { id: savedContactType.id },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  //   expect(fromDb?.lastUpdatedAt).toBeDefined()
  // })
  //
  // it('Should set last creation date when saving contact type', async (): Promise<void> => {
  //   const contactType: BasicContactType = {
  //     type: ContactTypeEnum.PERSON,
  //     tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //     name: 'example_name',
  //   }
  //
  //   const contactTypeEntity: ContactTypeEntity = contactTypeEntityFrom(contactType)
  //   const savedContactType: ContactTypeEntity | null = await dbConnection.getRepository(ContactTypeEntity).save(contactTypeEntity)
  //
  //   const fromDb: ContactTypeEntity | null = await dbConnection.getRepository(ContactTypeEntity).findOne({
  //     where: { id: savedContactType.id },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  //   expect(fromDb?.createdAt).toBeDefined()
  // })
  //
  // it('Should set last updated date when saving identity', async (): Promise<void> => {
  //   const correlationId = 'example_did'
  //   const identity: IBasicIdentity = {
  //     alias: correlationId,
  //     roles: [IdentityRoleEnum.ISSUER, IdentityRoleEnum.VERIFIER],
  //     identifier: {
  //       type: CorrelationIdentifierEnum.DID,
  //       correlationId,
  //     },
  //   }
  //
  //   const identityEntity: IdentityEntity = identityEntityFrom(identity)
  //   await dbConnection.getRepository(IdentityEntity).save(identityEntity)
  //
  //   const fromDb: IdentityEntity | null = await dbConnection.getRepository(IdentityEntity).findOne({
  //     where: {
  //       identifier: {
  //         correlationId,
  //       },
  //     },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  //   expect(fromDb?.lastUpdatedAt).toBeDefined()
  // })
  //
  // it('Should enforce unique type and tenant id combination when saving contact type', async (): Promise<void> => {
  //   const tenantId = 'non_unique_value'
  //   const name = 'non_unique_value'
  //   const contactType1: BasicContactType = {
  //     type: ContactTypeEnum.PERSON,
  //     tenantId,
  //     name,
  //   }
  //
  //   const contactTypeEntity1: ContactTypeEntity = contactTypeEntityFrom(contactType1)
  //   const savedContactType1: ContactTypeEntity | null = await dbConnection.getRepository(ContactTypeEntity).save(contactTypeEntity1)
  //
  //   expect(savedContactType1).toBeDefined()
  //
  //   const contactType2: BasicContactType = {
  //     type: ContactTypeEnum.PERSON,
  //     tenantId,
  //     name,
  //   }
  //
  //   const contactTypeEntity2: ContactTypeEntity = contactTypeEntityFrom(contactType2)
  //   await expect(dbConnection.getRepository(ContactTypeEntity).save(contactTypeEntity2)).rejects.toThrowError(
  //     'SQLITE_CONSTRAINT: UNIQUE constraint failed: contact_type_entity.type, contact_type_entity.tenantId'
  //   )
  // })
  //
  // it('Should enforce unique name when saving contact type', async (): Promise<void> => {
  //   const name = 'non_unique_value'
  //   const contactType1: BasicContactType = {
  //     type: ContactTypeEnum.PERSON,
  //     tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //     name,
  //   }
  //
  //   const contactTypeEntity1: ContactTypeEntity = contactTypeEntityFrom(contactType1)
  //   const savedContactType1: ContactTypeEntity | null = await dbConnection.getRepository(ContactTypeEntity).save(contactTypeEntity1)
  //
  //   expect(savedContactType1).toBeDefined()
  //
  //   const contactType2: BasicContactType = {
  //     type: ContactTypeEnum.PERSON,
  //     tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
  //     name,
  //   }
  //
  //   const contactTypeEntity2: ContactTypeEntity = contactTypeEntityFrom(contactType2)
  //   await expect(dbConnection.getRepository(ContactTypeEntity).save(contactTypeEntity2)).rejects.toThrowError(
  //     'SQLITE_CONSTRAINT: UNIQUE constraint failed: contact_type_entity.name'
  //   )
  // })
  //
  // it('Should enforce unique legal name when saving organization', async (): Promise<void> => {
  //   const legalName = 'non_unique_value'
  //   const organization1: BasicOrganization = {
  //     legalName,
  //     displayName: 'example_display_name',
  //   }
  //
  //   const organizationEntity1: OrganizationEntity = organizationEntityFrom(organization1)
  //   const savedOrganization1: OrganizationEntity | null = await dbConnection.getRepository(OrganizationEntity).save(organizationEntity1, {
  //     transaction: true,
  //   })
  //
  //   expect(savedOrganization1).toBeDefined()
  //
  //   const organization2: BasicOrganization = {
  //     legalName,
  //     displayName: 'example_display_name',
  //   }
  //
  //   const organizationEntity2: OrganizationEntity = organizationEntityFrom(organization2)
  //   await expect(dbConnection.getRepository(OrganizationEntity).save(organizationEntity2)).rejects.toThrowError(
  //     'SQLITE_CONSTRAINT: UNIQUE constraint failed: ContactOwner.legalName'
  //   )
  // })
  //
  // it('Should enforce unique display name when saving organization', async (): Promise<void> => {
  //   const displayName = 'non_unique_value'
  //   const organization1: BasicOrganization = {
  //     legalName: 'example_legal_name1',
  //     displayName,
  //   }
  //
  //   const organizationEntity1: OrganizationEntity = organizationEntityFrom(organization1)
  //   const savedOrganization1: OrganizationEntity | null = await dbConnection.getRepository(OrganizationEntity).save(organizationEntity1, {
  //     transaction: true,
  //   })
  //
  //   expect(savedOrganization1).toBeDefined()
  //
  //   const organization2: BasicOrganization = {
  //     legalName: 'example_legal_name2',
  //     displayName,
  //   }
  //
  //   const organizationEntity2: OrganizationEntity = organizationEntityFrom(organization2)
  //   await expect(dbConnection.getRepository(OrganizationEntity).save(organizationEntity2)).rejects.toThrowError(
  //     'SQLITE_CONSTRAINT: UNIQUE constraint failed: ContactOwner.displayName'
  //   )
  // })
  //
  // it('Should enforce unique legal name when saving organization', async (): Promise<void> => {
  //   const legalName = 'example_legal_name'
  //   const organization1: BasicOrganization = {
  //     legalName,
  //     displayName: 'example_display_name',
  //   }
  //
  //   const organizationEntity1: OrganizationEntity = organizationEntityFrom(organization1)
  //   const savedOrganization1: OrganizationEntity | null = await dbConnection.getRepository(OrganizationEntity).save(organizationEntity1, {
  //     transaction: true,
  //   })
  //
  //   expect(savedOrganization1).toBeDefined()
  //
  //   const organization2: BasicOrganization = {
  //     legalName,
  //     displayName: 'example_display_name',
  //   }
  //
  //   const organizationEntity2: OrganizationEntity = organizationEntityFrom(organization2)
  //   await expect(dbConnection.getRepository(OrganizationEntity).save(organizationEntity2)).rejects.toThrowError(
  //     'SQLITE_CONSTRAINT: UNIQUE constraint failed: ContactOwner.legalName'
  //   )
  // })
  //
  // it('Should enforce unique coc number when saving organization per tenant id', async (): Promise<void> => {
  //   const contact: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: {
  //       type: ContactTypeEnum.ORGANIZATION,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name',
  //     },
  //     contactOwner: {
  //       legalName: 'example_legal_name',
  //       displayName: 'example_display_name',
  //       cocNumber: 'example_coc_number',
  //     },
  //   }
  //
  //   const contactEntity: ContactEntity = contactEntityFrom(contact)
  //   await dbConnection.getRepository(ContactEntity).save(contactEntity, {
  //     transaction: true,
  //   })
  //
  //   const contact2: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name2',
  //     },
  //     contactOwner: {
  //       legalName: 'example_legal_name2',
  //       displayName: 'example_display_name2',
  //       cocNumber: 'example_coc_number',
  //     },
  //   }
  //
  //   const contactEntity2: ContactEntity = contactEntityFrom(contact2)
  //   await expect(dbConnection.getRepository(ContactEntity).save(contactEntity2, { transaction: true })).rejects.toThrowError(
  //     'Coc number already in use'
  //   )
  // })
  //
  // it('Should enforce unique display name when saving person', async (): Promise<void> => {
  //   const displayName = 'non_unique_value'
  //   const person1: BasicPerson = {
  //     firstName: 'example_first_name1',
  //     lastName: 'lastName2',
  //     displayName,
  //   }
  //
  //   const personEntity1: PersonEntity = personEntityFrom(person1)
  //   const savedPerson1: PersonEntity | null = await dbConnection.getRepository(PersonEntity).save(personEntity1, {
  //     transaction: true,
  //   })
  //
  //   expect(savedPerson1).toBeDefined()
  //
  //   const person2: BasicPerson = {
  //     firstName: 'example_first_name2',
  //     lastName: 'lastName2',
  //     displayName,
  //   }
  //
  //   const personEntity2: PersonEntity = personEntityFrom(person2)
  //   await expect(dbConnection.getRepository(PersonEntity).save(personEntity2)).rejects.toThrowError(
  //     'SQLITE_CONSTRAINT: UNIQUE constraint failed: ContactOwner.displayName'
  //   )
  // })
  //
  // it('Should save contact relationship to database', async (): Promise<void> => {
  //   const contact1: IBasicContact = {
  //     uri: 'example1.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name1',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name1',
  //       middleName: 'example_middle_name1',
  //       lastName: 'example_last_name1',
  //       displayName: 'example_display_name1',
  //     },
  //   }
  //
  //   const contactEntity1: ContactEntity = contactEntityFrom(contact1)
  //   const savedContact1: ContactEntity = await dbConnection.getRepository(ContactEntity).save(contactEntity1, {
  //     transaction: true,
  //   })
  //
  //   expect(savedContact1).toBeDefined()
  //
  //   const contact2: IBasicContact = {
  //     uri: 'example2.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
  //       name: 'example_name2',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name2',
  //       middleName: 'example_middle_name2',
  //       lastName: 'example_last_name2',
  //       displayName: 'example_display_name2',
  //     },
  //   }
  //
  //   const contactEntity2: ContactEntity = contactEntityFrom(contact2)
  //   const savedContact2: ContactEntity = await dbConnection.getRepository(ContactEntity).save(contactEntity2, {
  //     transaction: true,
  //   })
  //
  //   expect(savedContact2).toBeDefined()
  //
  //   const relationship: ContactRelationshipEntity = contactRelationshipEntityFrom({
  //     left: savedContact1,
  //     right: savedContact2,
  //   })
  //
  //   await dbConnection.getRepository(ContactRelationshipEntity).save(relationship, {
  //     transaction: true,
  //   })
  //
  //   // TODO check the relation field
  //   const fromDb: ContactEntity | null = await dbConnection.getRepository(ContactEntity).findOne({
  //     where: { id: contactEntity1.id },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  // })
  //
  // it('Should set last updated date when saving contact relationship', async (): Promise<void> => {
  //   const contact1: IBasicContact = {
  //     uri: 'example1.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name1',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name1',
  //       middleName: 'example_middle_name1',
  //       lastName: 'example_last_name1',
  //       displayName: 'example_display_name1',
  //     },
  //   }
  //
  //   const contactEntity1: ContactEntity = contactEntityFrom(contact1)
  //   const savedContact1: ContactEntity = await dbConnection.getRepository(ContactEntity).save(contactEntity1, {
  //     transaction: true,
  //   })
  //
  //   const contact2: IBasicContact = {
  //     uri: 'example2.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
  //       name: 'example_name2',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name2',
  //       middleName: 'example_middle_name2',
  //       lastName: 'example_last_name2',
  //       displayName: 'example_display_name2',
  //     },
  //   }
  //
  //   const contactEntity2: ContactEntity = contactEntityFrom(contact2)
  //   const savedContact2: ContactEntity = await dbConnection.getRepository(ContactEntity).save(contactEntity2, {
  //     transaction: true,
  //   })
  //
  //   const relationship: ContactRelationshipEntity = contactRelationshipEntityFrom({
  //     left: savedContact1,
  //     right: savedContact2,
  //   })
  //
  //   await dbConnection.getRepository(ContactRelationshipEntity).save(relationship, {
  //     transaction: true,
  //   })
  //
  //   const fromDb: ContactEntity | null = await dbConnection.getRepository(ContactEntity).findOne({
  //     where: { id: contactEntity1.id },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  //   expect(fromDb?.lastUpdatedAt).toBeDefined()
  // })
  //
  // it('Should set creation date when saving contact relationship', async (): Promise<void> => {
  //   const contact1: IBasicContact = {
  //     uri: 'example1.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name1',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name1',
  //       middleName: 'example_middle_name1',
  //       lastName: 'example_last_name1',
  //       displayName: 'example_display_name1',
  //     },
  //   }
  //
  //   const contactEntity1: ContactEntity = contactEntityFrom(contact1)
  //   const savedContact1: ContactEntity = await dbConnection.getRepository(ContactEntity).save(contactEntity1, {
  //     transaction: true,
  //   })
  //
  //   const contact2: IBasicContact = {
  //     uri: 'example2.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
  //       name: 'example_name2',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name2',
  //       middleName: 'example_middle_name2',
  //       lastName: 'example_last_name2',
  //       displayName: 'example_display_name2',
  //     },
  //   }
  //
  //   const contactEntity2: ContactEntity = contactEntityFrom(contact2)
  //   const savedContact2: ContactEntity = await dbConnection.getRepository(ContactEntity).save(contactEntity2, {
  //     transaction: true,
  //   })
  //
  //   const relationship: ContactRelationshipEntity = contactRelationshipEntityFrom({
  //     left: savedContact1,
  //     right: savedContact2,
  //   })
  //
  //   await dbConnection.getRepository(ContactRelationshipEntity).save(relationship, {
  //     transaction: true,
  //   })
  //
  //   const fromDb: ContactEntity | null = await dbConnection.getRepository(ContactEntity).findOne({
  //     where: { id: contactEntity1.id },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  //   expect(fromDb?.createdAt).toBeDefined()
  // })
  //
  // it('Should save bidirectional contact relationships to database', async (): Promise<void> => {
  //   const contact1: IBasicContact = {
  //     uri: 'example1.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name1',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name1',
  //       middleName: 'example_middle_name1',
  //       lastName: 'example_last_name1',
  //       displayName: 'example_display_name1',
  //     },
  //   }
  //
  //   const contactEntity1: ContactEntity = contactEntityFrom(contact1)
  //   const savedContact1: ContactEntity = await dbConnection.getRepository(ContactEntity).save(contactEntity1, {
  //     transaction: true,
  //   })
  //
  //   expect(savedContact1).toBeDefined()
  //
  //   const contact2: IBasicContact = {
  //     uri: 'example2.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
  //       name: 'example_name2',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name2',
  //       middleName: 'example_middle_name2',
  //       lastName: 'example_last_name2',
  //       displayName: 'example_display_name2',
  //     },
  //   }
  //
  //   const contactEntity2: ContactEntity = contactEntityFrom(contact2)
  //   const savedContact2: ContactEntity = await dbConnection.getRepository(ContactEntity).save(contactEntity2, {
  //     transaction: true,
  //   })
  //
  //   expect(savedContact2).toBeDefined()
  //
  //   const relationship1: ContactRelationshipEntity = contactRelationshipEntityFrom({
  //     left: savedContact1,
  //     right: savedContact2,
  //   })
  //
  //   const savedRelationship1: ContactRelationshipEntity | null = await dbConnection.getRepository(ContactRelationshipEntity).save(relationship1, {
  //     transaction: true,
  //   })
  //
  //   expect(savedRelationship1).toBeDefined()
  //
  //   const relationship2: ContactRelationshipEntity = contactRelationshipEntityFrom({
  //     left: savedContact2,
  //     right: savedContact1,
  //   })
  //
  //   const savedRelationship2: ContactRelationshipEntity | null = await dbConnection.getRepository(ContactRelationshipEntity).save(relationship2, {
  //     transaction: true,
  //   })
  //
  //   expect(savedRelationship2).toBeDefined()
  //
  //   const fromDb: ContactRelationshipEntity | null = await dbConnection.getRepository(ContactRelationshipEntity).findOne({
  //     where: { id: savedRelationship2.id },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  // })
  //
  // it('Should enforce unique owner combination for contact relationship', async (): Promise<void> => {
  //   const contact1: IBasicContact = {
  //     uri: 'example1.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name1',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name1',
  //       middleName: 'example_middle_name1',
  //       lastName: 'example_last_name1',
  //       displayName: 'example_display_name1',
  //     },
  //   }
  //
  //   const contactEntity1: ContactEntity = contactEntityFrom(contact1)
  //   const savedContact1: ContactEntity = await dbConnection.getRepository(ContactEntity).save(contactEntity1, {
  //     transaction: true,
  //   })
  //
  //   expect(savedContact1).toBeDefined()
  //
  //   const contact2: IBasicContact = {
  //     uri: 'example2.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
  //       name: 'example_name2',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name2',
  //       middleName: 'example_middle_name2',
  //       lastName: 'example_last_name2',
  //       displayName: 'example_display_name2',
  //     },
  //   }
  //
  //   const contactEntity2: ContactEntity = contactEntityFrom(contact2)
  //   const savedContact2: ContactEntity = await dbConnection.getRepository(ContactEntity).save(contactEntity2, {
  //     transaction: true,
  //   })
  //
  //   expect(savedContact2).toBeDefined()
  //
  //   const relationship1: ContactRelationshipEntity = contactRelationshipEntityFrom({
  //     left: savedContact1,
  //     right: savedContact2,
  //   })
  //
  //   const savedRelationship1: ContactRelationshipEntity | null = await dbConnection.getRepository(ContactRelationshipEntity).save(relationship1, {
  //     transaction: true,
  //   })
  //
  //   expect(savedRelationship1).toBeDefined()
  //
  //   const relationship2: ContactRelationshipEntity = contactRelationshipEntityFrom({
  //     left: savedContact1,
  //     right: savedContact2,
  //   })
  //
  //   await expect(dbConnection.getRepository(ContactRelationshipEntity).save(relationship2)).rejects.toThrowError(
  //     'SQLITE_CONSTRAINT: UNIQUE constraint failed: contact_relationship_entity.leftId, contact_relationship_entity.rightId'
  //   )
  // })
  //
  // it('Should save contact type to database', async (): Promise<void> => {
  //   const contactType: BasicContactType = {
  //     type: ContactTypeEnum.PERSON,
  //     tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //     name: 'example_name',
  //   }
  //
  //   const contactTypeEntity: ContactTypeEntity = contactTypeEntityFrom(contactType)
  //   const savedContactType: ContactTypeEntity | null = await dbConnection.getRepository(ContactTypeEntity).save(contactTypeEntity)
  //
  //   const fromDb: ContactTypeEntity | null = await dbConnection.getRepository(ContactTypeEntity).findOne({
  //     where: { id: savedContactType.id },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  // })
  //
  // it('Should save person to database', async (): Promise<void> => {
  //   const person: BasicPerson = {
  //     firstName: 'example_first_name',
  //     lastName: 'lastName2',
  //     displayName: 'displayName',
  //   }
  //
  //   const personEntity: PersonEntity = personEntityFrom(person)
  //   const savedPerson: PersonEntity | null = await dbConnection.getRepository(PersonEntity).save(personEntity, {
  //     transaction: true,
  //   })
  //
  //   const fromDb: PersonEntity | null = await dbConnection.getRepository(PersonEntity).findOne({
  //     where: { id: savedPerson.id },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  // })
  //
  // it('Should set last updated date when saving person', async (): Promise<void> => {
  //   const person: BasicPerson = {
  //     firstName: 'example_first_name',
  //     lastName: 'lastName2',
  //     displayName: 'displayName',
  //   }
  //
  //   const personEntity: PersonEntity = personEntityFrom(person)
  //   const savedPerson: PersonEntity | null = await dbConnection.getRepository(PersonEntity).save(personEntity, {
  //     transaction: true,
  //   })
  //
  //   const fromDb: PersonEntity | null = await dbConnection.getRepository(PersonEntity).findOne({
  //     where: { id: savedPerson.id },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  //   expect(fromDb?.lastUpdatedAt).toBeDefined()
  // })
  //
  // it('Should set creation date when saving person', async (): Promise<void> => {
  //   const person: BasicPerson = {
  //     firstName: 'example_first_name',
  //     lastName: 'lastName2',
  //     displayName: 'displayName',
  //   }
  //
  //   const personEntity: PersonEntity = personEntityFrom(person)
  //   const savedPerson: PersonEntity | null = await dbConnection.getRepository(PersonEntity).save(personEntity, {
  //     transaction: true,
  //   })
  //
  //   const fromDb: PersonEntity | null = await dbConnection.getRepository(PersonEntity).findOne({
  //     where: { id: savedPerson.id },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  //   expect(fromDb?.createdAt).toBeDefined()
  // })
  //
  // it('Should save organization to database', async (): Promise<void> => {
  //   const organization: BasicOrganization = {
  //     legalName: 'example_legal_name',
  //     displayName: 'example_display_name',
  //   }
  //
  //   const organizationEntity: OrganizationEntity = organizationEntityFrom(organization)
  //   const savedOrganization: OrganizationEntity | null = await dbConnection.getRepository(OrganizationEntity).save(organizationEntity, {
  //     transaction: true,
  //   })
  //
  //   const fromDb: OrganizationEntity | null = await dbConnection.getRepository(OrganizationEntity).findOne({
  //     where: { id: savedOrganization.id },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  // })
  //
  // it('Should set last updated date when saving organization', async (): Promise<void> => {
  //   const organization: BasicOrganization = {
  //     legalName: 'example_legal_name',
  //     displayName: 'example_display_name',
  //   }
  //
  //   const organizationEntity: OrganizationEntity = organizationEntityFrom(organization)
  //   const savedOrganization: OrganizationEntity | null = await dbConnection.getRepository(OrganizationEntity).save(organizationEntity, {
  //     transaction: true,
  //   })
  //
  //   const fromDb: OrganizationEntity | null = await dbConnection.getRepository(OrganizationEntity).findOne({
  //     where: { id: savedOrganization.id },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  //   expect(fromDb?.lastUpdatedAt).toBeDefined()
  // })
  //
  // it('Should set creation date when saving organization', async (): Promise<void> => {
  //   const organization: BasicOrganization = {
  //     legalName: 'example_legal_name',
  //     displayName: 'example_display_name',
  //   }
  //
  //   const organizationEntity: OrganizationEntity = organizationEntityFrom(organization)
  //   const savedOrganization: OrganizationEntity | null = await dbConnection.getRepository(OrganizationEntity).save(organizationEntity, {
  //     transaction: true,
  //   })
  //
  //   const fromDb: OrganizationEntity | null = await dbConnection.getRepository(OrganizationEntity).findOne({
  //     where: { id: savedOrganization.id },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  //   expect(fromDb?.createdAt).toBeDefined()
  // })
  //
  // it('Should get contact based on person information', async (): Promise<void> => {
  //   const firstName = 'example_first_name'
  //   const contact: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name',
  //     },
  //     contactOwner: {
  //       firstName,
  //       middleName: 'example_middle_name',
  //       lastName: 'example_last_name',
  //       displayName: 'example_display_name',
  //     },
  //   }
  //
  //   const contactEntity: ContactEntity = contactEntityFrom(contact)
  //   await dbConnection.getRepository(ContactEntity).save(contactEntity, {
  //     transaction: true,
  //   })
  //
  //   const fromDb: ContactEntity | null = await dbConnection.getRepository(ContactEntity).findOne({
  //     where: {
  //       contactOwner: {
  //         firstName,
  //       } as FindOptionsWhere<PersonEntity | OrganizationEntity>,
  //     },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  // })
  //
  // it('Should get contact based on organization information', async (): Promise<void> => {
  //   const legalName = 'example_legal_name'
  //   const contact: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: {
  //       type: ContactTypeEnum.ORGANIZATION,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name',
  //     },
  //     contactOwner: {
  //       legalName,
  //       displayName: 'example_display_name',
  //       cocNumber: 'example_coc_number',
  //     },
  //   }
  //
  //   const contactEntity: ContactEntity = contactEntityFrom(contact)
  //   await dbConnection.getRepository(ContactEntity).save(contactEntity, {
  //     transaction: true,
  //   })
  //
  //   const fromDb: ContactEntity | null = await dbConnection.getRepository(ContactEntity).findOne({
  //     where: {
  //       contactOwner: {
  //         legalName,
  //       } as FindOptionsWhere<PersonEntity | OrganizationEntity>,
  //     },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  // })
  //
  // it("Should enforce unique contact id's for relationship sides", async (): Promise<void> => {
  //   const contact: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name',
  //       middleName: 'example_middle_name',
  //       lastName: 'example_last_name',
  //       displayName: 'example_display_name',
  //     },
  //   }
  //
  //   const contactEntity: ContactEntity = contactEntityFrom(contact)
  //   const savedContact: ContactEntity = await dbConnection.getRepository(ContactEntity).save(contactEntity, {
  //     transaction: true,
  //   })
  //
  //   expect(savedContact).toBeDefined()
  //
  //   const relationship: ContactRelationshipEntity = contactRelationshipEntityFrom({
  //     left: savedContact,
  //     right: savedContact,
  //   })
  //
  //   await expect(dbConnection.getRepository(ContactRelationshipEntity).save(relationship)).rejects.toThrowError(
  //     'Cannot use the same id for both sides of the relationship'
  //   )
  // })
  //
  // it('Should delete contact relationship', async (): Promise<void> => {
  //   const contact1: IBasicContact = {
  //     uri: 'example1.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name1',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name1',
  //       middleName: 'example_middle_name1',
  //       lastName: 'example_last_name1',
  //       displayName: 'example_display_name1',
  //     },
  //   }
  //
  //   const contactEntity1: ContactEntity = contactEntityFrom(contact1)
  //   const savedContact1: ContactEntity = await dbConnection.getRepository(ContactEntity).save(contactEntity1, {
  //     transaction: true,
  //   })
  //
  //   expect(savedContact1).toBeDefined()
  //
  //   const contact2: IBasicContact = {
  //     uri: 'example2.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d288',
  //       name: 'example_name2',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name2',
  //       middleName: 'example_middle_name2',
  //       lastName: 'example_last_name2',
  //       displayName: 'example_display_name2',
  //     },
  //   }
  //
  //   const contactEntity2: ContactEntity = contactEntityFrom(contact2)
  //   const savedContact2: ContactEntity = await dbConnection.getRepository(ContactEntity).save(contactEntity2, {
  //     transaction: true,
  //   })
  //
  //   expect(savedContact2).toBeDefined()
  //
  //   const relationship: ContactRelationshipEntity = contactRelationshipEntityFrom({
  //     left: savedContact1,
  //     right: savedContact2,
  //   })
  //
  //   const savedRelationship: ContactRelationshipEntity | null = await dbConnection.getRepository(ContactRelationshipEntity).save(relationship, {
  //     transaction: true,
  //   })
  //
  //   expect(savedRelationship).toBeDefined()
  //
  //   await dbConnection.getRepository(ContactRelationshipEntity).delete({ id: savedRelationship.id })
  //
  //   await expect(
  //     await dbConnection.getRepository(ContactRelationshipEntity).findOne({
  //       where: { id: savedRelationship.id },
  //     })
  //   ).toBeNull()
  // })
  //
  // it('Should delete contact type', async (): Promise<void> => {
  //   const contactType: BasicContactType = {
  //     type: ContactTypeEnum.PERSON,
  //     tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //     name: 'example_name',
  //   }
  //
  //   const contactTypeEntity: ContactTypeEntity = contactTypeEntityFrom(contactType)
  //   const savedContactType: ContactTypeEntity | null = await dbConnection.getRepository(ContactTypeEntity).save(contactTypeEntity)
  //
  //   expect(savedContactType).toBeDefined()
  //
  //   await dbConnection.getRepository(ContactTypeEntity).delete({ id: savedContactType.id })
  //
  //   await expect(
  //     await dbConnection.getRepository(ContactTypeEntity).findOne({
  //       where: { id: savedContactType.id },
  //     })
  //   ).toBeNull()
  // })
  //
  // it('Should not be able to remove contact type when used by contacts', async (): Promise<void> => {
  //   const contact: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: {
  //       type: ContactTypeEnum.PERSON,
  //       tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //       name: 'example_name',
  //     },
  //     contactOwner: {
  //       firstName: 'example_first_name',
  //       middleName: 'example_middle_name',
  //       lastName: 'example_last_name',
  //       displayName: 'example_display_name',
  //     },
  //   }
  //
  //   const contactEntity: ContactEntity = contactEntityFrom(contact)
  //   const savedContact: ContactEntity | null = await dbConnection.getRepository(ContactEntity).save(contactEntity, {
  //     transaction: true,
  //   })
  //
  //   expect(savedContact).toBeDefined()
  //
  //   await expect(dbConnection.getRepository(ContactTypeEntity).delete({ id: savedContact.contactType.id })).rejects.toThrowError(
  //     'FOREIGN KEY constraint failed'
  //   )
  // })
  //
  // it('Should save contact with existing contact type', async (): Promise<void> => {
  //   const contactType: BasicContactType = {
  //     type: ContactTypeEnum.PERSON,
  //     tenantId: '0605761c-4113-4ce5-a6b2-9cbae2f9d289',
  //     name: 'example_name',
  //   }
  //
  //   const contactTypeEntity: ContactTypeEntity = contactTypeEntityFrom(contactType)
  //   const savedContactType: ContactTypeEntity | null = await dbConnection.getRepository(ContactTypeEntity).save(contactTypeEntity)
  //
  //   const contact: IBasicContact = {
  //     uri: 'example.com',
  //     contactType: savedContactType,
  //     contactOwner: {
  //       firstName: 'example_first_name',
  //       middleName: 'example_middle_name',
  //       lastName: 'example_last_name',
  //       displayName: 'example_display_name',
  //     },
  //   }
  //
  //   const contactEntity: ContactEntity = contactEntityFrom(contact)
  //   contactEntity.contactType = savedContactType
  //   await dbConnection.getRepository(ContactEntity).save(contactEntity, {
  //     transaction: true,
  //   })
  //
  //   const fromDb: ContactEntity | null = await dbConnection.getRepository(ContactEntity).findOne({
  //     where: { id: contactEntity.id },
  //   })
  //
  //   expect(fromDb).toBeDefined()
  //   expect(fromDb?.contactType).toBeDefined()
  //   expect(fromDb?.contactType.id).toEqual(savedContactType.id)
  //   expect(fromDb?.contactType.type).toEqual(savedContactType.type)
  //   expect(fromDb?.contactType.tenantId).toEqual(savedContactType.tenantId)
  //   expect(fromDb?.contactType.name).toEqual(savedContactType.name)
  // })
  //
  // // TODO not update creation date when saving contact type
  // // TODO add test for updating nested field and checking last updated at on parent
})
