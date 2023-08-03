import Debug from 'debug'
import { OrPromise } from '@sphereon/ssi-types'
import { AbstractContactStore } from './AbstractContactStore'
import {
  IAddIdentityArgs,
  IGetIdentityArgs,
  IGetIdentitiesArgs,
  IGetContactArgs,
  IRemoveIdentityArgs,
  IUpdateIdentityArgs,
  IGetContactsArgs,
  IAddContactArgs,
  IUpdateContactArgs,
  IRemoveContactArgs,
  BasicConnectionConfig,
  ConnectionTypeEnum,
  CorrelationIdentifierEnum,
  IContact,
  IIdentity,
  IRemoveRelationshipArgs,
  IContactRelationship,
  IAddRelationshipArgs,
  IGetRelationshipArgs,
  IAddContactTypeArgs,
  IContactType,
  IGetContactTypeArgs,
  IGetContactTypesArgs,
  IUpdateContactTypeArgs,
  IRemoveContactTypeArgs,
  IGetRelationshipsArgs,
  IUpdateRelationshipArgs,
  ContactTypeEnum,
  BasicContactOwner
} from '../types'
import { ContactEntity, contactEntityFrom, contactFrom } from '../entities/contact/ContactEntity'
import { IdentityEntity, identityEntityFrom, identityFrom } from '../entities/contact/IdentityEntity'
import { IdentityMetadataItemEntity } from '../entities/contact/IdentityMetadataItemEntity'
import { CorrelationIdentifierEntity } from '../entities/contact/CorrelationIdentifierEntity'
import { ConnectionEntity } from '../entities/contact/ConnectionEntity'
import { BaseConfigEntity, isDidAuthConfig, isOpenIdConfig } from '../entities/contact/BaseConfigEntity'
import { DataSource, FindOptionsWhere, In, Repository } from 'typeorm'
import { PersonEntity } from '../entities/contact/PersonEntity'
import { OrganizationEntity } from '../entities/contact/OrganizationEntity'
import { ContactRelationshipEntity, contactRelationshipEntityFrom, contactRelationshipFrom } from '../entities/contact/ContactRelationshipEntity'
import { ContactTypeEntity, contactTypeEntityFrom, contactTypeFrom } from '../entities/contact/ContactTypeEntity'
import { isOrganization, isPerson } from '../entities/contact/ContactOwnerEntity'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:contact-store')

export class ContactStore extends AbstractContactStore {
  private readonly dbConnection: OrPromise<DataSource>

  constructor(dbConnection: OrPromise<DataSource>) {
    super()
    this.dbConnection = dbConnection
  }

  getContact = async ({ contactId }: IGetContactArgs): Promise<IContact> => {
    const result: ContactEntity | null = await (await this.dbConnection).getRepository(ContactEntity).findOne({
      where: { id: contactId },
    })

    if (!result) {
      return Promise.reject(Error(`No contact found for id: ${contactId}`))
    }

    return contactFrom(result)
  }

  getContacts = async (args?: IGetContactsArgs): Promise<Array<IContact>> => {
    const contactRepository: Repository<ContactEntity> = (await this.dbConnection).getRepository(ContactEntity)
    const initialResult: Array<ContactEntity> | null = await contactRepository.find({
      ...(args?.filter && { where: args?.filter }),
    })

    const result: Array<ContactEntity> | null = await contactRepository.find({
      where: {
        id: In(initialResult.map((contact: ContactEntity) => contact.id)),
      },
    })

    return result.map((contact: ContactEntity) => contactFrom(contact))
  }

  addContact = async (args: IAddContactArgs): Promise<IContact> => {
    const { identities, contactOwner, contactType } = args

    const contactRepository: Repository<ContactEntity> = (await this.dbConnection).getRepository(ContactEntity)

    if (!this.hasCorrectContactType(contactType.type, contactOwner)) {
      return Promise.reject(Error(`Contact type ${contactType.type}, does not match for provided contact owner`))
    }

    const result: ContactEntity | null = await contactRepository.findOne({
      where: [
        {
          contactOwner: {
            displayName: contactOwner.displayName,
          } as FindOptionsWhere<PersonEntity | OrganizationEntity>,
        },
      ],
    })

    if (result) {
      return Promise.reject(Error(`Duplicate display names are not allowed. Display name: ${contactOwner.displayName}`))
    }

    for (const identity of identities ?? []) {
      if (identity.identifier.type === CorrelationIdentifierEnum.URL) {
        if (!identity.connection) {
          return Promise.reject(Error(`Identity with correlation type ${CorrelationIdentifierEnum.URL} should contain a connection`))
        }

        if (!this.hasCorrectConnectionConfig(identity.connection.type, identity.connection.config)) {
          return Promise.reject(Error(`Connection type ${identity.connection.type}, does not match for provided config`))
        }
      }
    }

    const contactEntity: ContactEntity = contactEntityFrom(args)
    debug('Adding contact', args)
    const createdResult: ContactEntity = await contactRepository.save(contactEntity)

    return contactFrom(createdResult)
  }

  updateContact = async ({ contact }: IUpdateContactArgs): Promise<IContact> => {
    const contactRepository: Repository<ContactEntity> = (await this.dbConnection).getRepository(ContactEntity)
    const result: ContactEntity | null = await contactRepository.findOne({
      where: { id: contact.id },
    })

    if (!result) {
      return Promise.reject(Error(`No contact found for id: ${contact.id}`))
    }

    const updatedContact = {
      ...contact,
      identities: result.identities,
      contactType: result.contactType,
      relationships: result.relationships,
    }

    debug('Updating contact', contact)
    const updatedResult: ContactEntity = await contactRepository.save(updatedContact, { transaction: true })

    return contactFrom(updatedResult)
  }

  removeContact = async ({ contactId }: IRemoveContactArgs): Promise<void> => {
    const contactRepository: Repository<ContactEntity> = (await this.dbConnection).getRepository(ContactEntity)
    debug('Removing contact', contactId)
    contactRepository
      .findOneById(contactId)
      .then(async (contact: ContactEntity | null): Promise<void> => {
        if (!contact) {
          await Promise.reject(Error(`Unable to find the contact with id to remove: ${contactId}`))
        } else {
          await this.deleteIdentities(contact.identities)

          await contactRepository
            .delete({ id: contactId })
            .catch((error) => Promise.reject(Error(`Unable to remove contact with id: ${contactId}. ${error}`)))
        }
      })
      .catch((error) => Promise.reject(Error(`Unable to remove contact with id: ${contactId}. ${error}`)))
  }

  getIdentity = async ({ identityId }: IGetIdentityArgs): Promise<IIdentity> => {
    const result: IdentityEntity | null = await (await this.dbConnection).getRepository(IdentityEntity).findOne({
      where: { id: identityId },
    })

    if (!result) {
      return Promise.reject(Error(`No identity found for id: ${identityId}`))
    }

    return identityFrom(result)
  }

  getIdentities = async (args?: IGetIdentitiesArgs): Promise<Array<IIdentity>> => {
    const identityRepository: Repository<IdentityEntity> = (await this.dbConnection).getRepository(IdentityEntity)
    const initialResult: Array<IdentityEntity> = await identityRepository.find({
      ...(args?.filter && { where: args?.filter }),
    })

    const result: Array<IdentityEntity> = await identityRepository.find({
      where: {
        id: In(initialResult.map((identity: IdentityEntity) => identity.id)),
      },
    })

    return result.map((identity: IdentityEntity) => identityFrom(identity))
  }

  addIdentity = async ({ identity, contactId }: IAddIdentityArgs): Promise<IIdentity> => {
    const contact: ContactEntity | null = await (await this.dbConnection).getRepository(ContactEntity).findOne({
      where: { id: contactId },
    })

    if (!contact) {
      return Promise.reject(Error(`No contact found for id: ${contactId}`))
    }

    if (identity.identifier.type === CorrelationIdentifierEnum.URL) {
      if (!identity.connection) {
        return Promise.reject(Error(`Identity with correlation type ${CorrelationIdentifierEnum.URL} should contain a connection`))
      }

      if (!this.hasCorrectConnectionConfig(identity.connection.type, identity.connection.config)) {
        return Promise.reject(Error(`Connection type ${identity.connection.type}, does not match for provided config`))
      }
    }

    const identityEntity: IdentityEntity = identityEntityFrom(identity)
    identityEntity.contact = contact
    debug('Adding identity', identity)
    const result: IdentityEntity = await (await this.dbConnection).getRepository(IdentityEntity).save(identityEntity, {
      transaction: true,
    })

    return identityFrom(result)
  }

  updateIdentity = async ({ identity }: IUpdateIdentityArgs): Promise<IIdentity> => {
    const identityRepository: Repository<IdentityEntity> = (await this.dbConnection).getRepository(IdentityEntity)
    const result: IdentityEntity | null = await identityRepository.findOne({
      where: { id: identity.id },
    })

    if (!result) {
      return Promise.reject(Error(`No identity found for id: ${identity.id}`))
    }

    if (identity.identifier.type === CorrelationIdentifierEnum.URL) {
      if (!identity.connection) {
        return Promise.reject(Error(`Identity with correlation type ${CorrelationIdentifierEnum.URL} should contain a connection`))
      }

      if (!this.hasCorrectConnectionConfig(identity.connection.type, identity.connection.config)) {
        return Promise.reject(Error(`Connection type ${identity.connection.type}, does not match for provided config`))
      }
    }

    debug('Updating identity', identity)
    const updatedResult: IdentityEntity = await identityRepository.save(identity, { transaction: true })

    return identityFrom(updatedResult)
  }

  removeIdentity = async ({ identityId }: IRemoveIdentityArgs): Promise<void> => {
    const identity: IdentityEntity | null = await (await this.dbConnection).getRepository(IdentityEntity).findOne({
      where: { id: identityId },
    })

    if (!identity) {
      return Promise.reject(Error(`No identity found for id: ${identityId}`))
    }

    debug('Removing identity', identityId)

    await this.deleteIdentities([identity])
  }

  addRelationship = async ({ leftId, rightId }: IAddRelationshipArgs): Promise<IContactRelationship> => {
    const contactRepository: Repository<ContactEntity> = (await this.dbConnection).getRepository(ContactEntity)
    const leftContact: ContactEntity | null = await contactRepository.findOne({
      where: { id: leftId },
    })

    if (!leftContact) {
      return Promise.reject(Error(`No contact found for left contact id: ${leftId}`))
    }

    const rightContact: ContactEntity | null = await contactRepository.findOne({
      where: { id: rightId },
    })

    if (!rightContact) {
      return Promise.reject(Error(`No contact found for right contact id: ${rightId}`))
    }

    const relationship: ContactRelationshipEntity = contactRelationshipEntityFrom({
      leftId: leftContact.id,
      rightId: rightContact.id,
    })

    const createdResult: ContactRelationshipEntity = await (await this.dbConnection).getRepository(ContactRelationshipEntity).save(relationship)

    return contactRelationshipFrom(createdResult)
  }

  getRelationship = async ({ relationshipId }: IGetRelationshipArgs): Promise<IContactRelationship> => {
    const result: ContactRelationshipEntity | null = await (await this.dbConnection).getRepository(ContactRelationshipEntity).findOne({
      where: { id: relationshipId },
    })

    if (!result) {
      return Promise.reject(Error(`No relationship found for id: ${relationshipId}`))
    }

    return contactRelationshipFrom(result)
  }

  getRelationships = async (args?: IGetRelationshipsArgs): Promise<Array<IContactRelationship>> => {
    const contactRelationshipRepository: Repository<ContactRelationshipEntity> = (await this.dbConnection).getRepository(ContactRelationshipEntity)
    const initialResult: Array<ContactRelationshipEntity> | null = await contactRelationshipRepository.find({
      ...(args?.filter && { where: args?.filter }),
    })

    const result: Array<ContactRelationshipEntity> | null = await contactRelationshipRepository.find({
      where: {
        id: In(initialResult.map((contactRelationship: ContactRelationshipEntity) => contactRelationship.id)),
      },
    })

    return result.map((contactRelationship: ContactRelationshipEntity) => contactRelationshipFrom(contactRelationship))
  }

  updateRelationship = async ({ relationship }: IUpdateRelationshipArgs): Promise<IContactRelationship> => {
    const contactRelationshipRepository: Repository<ContactRelationshipEntity> = (await this.dbConnection).getRepository(ContactRelationshipEntity)
    const result: ContactRelationshipEntity | null = await contactRelationshipRepository.findOne({
      where: { id: relationship.id },
    })

    if (!result) {
      return Promise.reject(Error(`No contact relationship found for id: ${relationship.id}`))
    }

    const contactRepository: Repository<ContactEntity> = (await this.dbConnection).getRepository(ContactEntity)
    const leftContact: ContactEntity | null = await contactRepository.findOne({
      where: { id: relationship.leftId },
    })

    if (!leftContact) {
      return Promise.reject(Error(`No contact found for left contact id: ${relationship.leftId}`))
    }

    const rightContact: ContactEntity | null = await contactRepository.findOne({
      where: { id: relationship.rightId },
    })

    if (!rightContact) {
      return Promise.reject(Error(`No contact found for right contact id: ${relationship.rightId}`))
    }

    debug('Updating contact relationship', relationship)
    const updatedResult: ContactRelationshipEntity = await contactRelationshipRepository.save(relationship, { transaction: true })

    return contactRelationshipFrom(updatedResult)
  }

  removeRelationship = async ({ relationshipId }: IRemoveRelationshipArgs): Promise<void> => {
    const contactRelationshipRepository: Repository<ContactRelationshipEntity> = (await this.dbConnection).getRepository(ContactRelationshipEntity)
    const relationship: ContactRelationshipEntity | null = await contactRelationshipRepository.findOne({
      where: { id: relationshipId },
    })

    if (!relationship) {
      return Promise.reject(Error(`No relationship found for id: ${relationshipId}`))
    }

    debug('Removing relationship', relationshipId)

    await contactRelationshipRepository.delete(relationshipId)
  }

  addContactType = async (args: IAddContactTypeArgs): Promise<IContactType> => {
    const contactEntity: ContactTypeEntity = contactTypeEntityFrom(args)
    debug('Adding contact type', args)
    const createdResult: ContactTypeEntity = await (await this.dbConnection).getRepository(ContactTypeEntity).save(contactEntity)

    return contactTypeFrom(createdResult)
  }

  getContactType = async ({ contactTypeId }: IGetContactTypeArgs): Promise<IContactType> => {
    const result: ContactTypeEntity | null = await (await this.dbConnection).getRepository(ContactTypeEntity).findOne({
      where: { id: contactTypeId },
    })

    if (!result) {
      return Promise.reject(Error(`No contact type found for id: ${contactTypeId}`))
    }

    return contactTypeFrom(result)
  }

  getContactTypes = async (args?: IGetContactTypesArgs): Promise<Array<IContactType>> => {
    const contactTypeRepository: Repository<ContactTypeEntity> = (await this.dbConnection).getRepository(ContactTypeEntity)
    const initialResult: Array<ContactTypeEntity> | null = await contactTypeRepository.find({
      ...(args?.filter && { where: args?.filter }),
    })

    const result: Array<ContactTypeEntity> | null = await contactTypeRepository.find({
      where: {
        id: In(initialResult.map((contactType: ContactTypeEntity) => contactType.id)),
      },
    })

    return result.map((contactType: ContactTypeEntity) => contactTypeFrom(contactType))
  }

  updateContactType = async ({ contactType }: IUpdateContactTypeArgs): Promise<IContactType> => {
    const contactTypeRepository: Repository<ContactTypeEntity> = (await this.dbConnection).getRepository(ContactTypeEntity)
    const result: ContactTypeEntity | null = await contactTypeRepository.findOne({
      where: { id: contactType.id },
    })

    if (!result) {
      return Promise.reject(Error(`No contact type found for id: ${contactType.id}`))
    }

    debug('Updating contact type', contactType)
    const updatedResult: ContactTypeEntity = await contactTypeRepository.save(contactType, { transaction: true })

    return contactTypeFrom(updatedResult)
  }

  removeContactType = async ({ contactTypeId }: IRemoveContactTypeArgs): Promise<void> => {
    const contacts: Array<ContactEntity> | null = await (await this.dbConnection).getRepository(ContactEntity).find({
      where: {
        contactType: {
          id: contactTypeId,
        },
      },
    })

    if (contacts?.length > 0) {
      return Promise.reject(Error(`Unable to remove contact type with id: ${contactTypeId}. Contact type is in use`))
    }

    const contactTypeRepository: Repository<ContactTypeEntity> = (await this.dbConnection).getRepository(ContactTypeEntity)
    const contactType: ContactTypeEntity | null = await contactTypeRepository.findOne({
      where: { id: contactTypeId },
    })

    if (!contactType) {
      return Promise.reject(Error(`No contact type found for id: ${contactTypeId}`))
    }

    debug('Removing contact type', contactTypeId)

    await contactTypeRepository.delete(contactTypeId)
  }

  private hasCorrectConnectionConfig(type: ConnectionTypeEnum, config: BasicConnectionConfig): boolean {
    switch (type) {
      case ConnectionTypeEnum.OPENID_CONNECT:
        return isOpenIdConfig(config)
      case ConnectionTypeEnum.SIOPv2:
        return isDidAuthConfig(config)
      default:
        throw new Error('Connection type not supported')
    }
  }

  private hasCorrectContactType(type: ContactTypeEnum, owner: BasicContactOwner): boolean {
    switch (type) {
      case ContactTypeEnum.PERSON:
        return isPerson(owner)
      case ContactTypeEnum.ORGANIZATION:
        return isOrganization(owner)
      default:
        throw new Error('Contact type not supported')
    }
  }

  private async deleteIdentities(identities: Array<IdentityEntity>): Promise<void> {
    debug('Removing identities', identities)

    identities.map(async (identity: IdentityEntity): Promise<void> => {
      await (
        await this.dbConnection
      )
        .getRepository(CorrelationIdentifierEntity)
        .delete(identity.identifier.id)
        .catch((error) => Promise.reject(Error(`Unable to remove identity.identifier with id: ${identity.identifier.id}. ${error}`)))

      if (identity.connection) {
        await (await this.dbConnection).getRepository(BaseConfigEntity).delete(identity.connection.config.id)

        await (
          await this.dbConnection
        )
          .getRepository(ConnectionEntity)
          .delete(identity.connection.id)
          .catch((error) => Promise.reject(Error(`Unable to remove identity.connection with id. ${error}`)))
      }

      if (identity.metadata) {
        identity.metadata.map(async (metadataItem: IdentityMetadataItemEntity): Promise<void> => {
          await (
            await this.dbConnection
          )
            .getRepository(IdentityMetadataItemEntity)
            .delete(metadataItem.id)
            .catch((error) => Promise.reject(Error(`Unable to remove metadataItem.id with id ${metadataItem.id}. ${error}`)))
        })
      }

      ;(await this.dbConnection)
        .getRepository(IdentityEntity)
        .delete(identity.id)
        .catch((error) => Promise.reject(Error(`Unable to remove metadataItem.id with id ${identity.id}. ${error}`)))
    })
  }

}
