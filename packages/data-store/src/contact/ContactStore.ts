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
  IAddRelationshipArgs
} from '../types'
import { ContactEntity, contactEntityFrom, contactFrom } from '../entities/contact/ContactEntity'
import { IdentityEntity, identityEntityFrom, identityFrom } from '../entities/contact/IdentityEntity'
import { IdentityMetadataItemEntity } from '../entities/contact/IdentityMetadataItemEntity'
import { CorrelationIdentifierEntity } from '../entities/contact/CorrelationIdentifierEntity'
import { ConnectionEntity } from '../entities/contact/ConnectionEntity'
import {
  BaseConfigEntity,
  isDidAuthConfig,
  isOpenIdConfig
} from '../entities/contact/BaseConfigEntity'
import { DataSource, FindOptionsWhere, In, Repository } from 'typeorm'
import { PersonEntity } from '../entities/contact/PersonEntity'
import { OrganizationEntity } from '../entities/contact/OrganizationEntity'
import {
  ContactRelationshipEntity,
  contactRelationshipEntityFrom,
  contactRelationshipFrom
} from '../entities/contact/ContactRelationshipEntity'

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
    const { identities, contactOwner } = args //, alias, name,

    const contactRepository: Repository<ContactEntity> = (await this.dbConnection).getRepository(ContactEntity)

    // TODO extend with more names?
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
      // TODO correct msg?
      return Promise.reject(Error(`Duplicate names or display are not allowed. Display name: ${contactOwner.displayName}`)) //Name: ${name},
    }

    for (const identity of identities ?? []) {
      if (identity.identifier.type === CorrelationIdentifierEnum.URL) {
        if (!identity.connection) {
          return Promise.reject(Error(`Identity with correlation type ${CorrelationIdentifierEnum.URL} should contain a connection`))
        }

        if (!this.hasCorrectConfig(identity.connection.type, identity.connection.config)) {
          return Promise.reject(Error(`Connection type ${identity.connection.type}, does not match for provided config`))
        }
      }
    }

    const contactEntity: ContactEntity = contactEntityFrom(args)
    //debug('Adding contact', name) TODO fix
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
      // TODO fix type
      ...contact,
      identities: result.identities,
      relationships: result.relationships,
    }

    debug('Updating contact', contact)
    const updatedResult: ContactEntity = await contactRepository.save(updatedContact, { transaction: true })

    return contactFrom(updatedResult)
  }

  removeContact = async ({ contactId }: IRemoveContactArgs): Promise<void> => {
    const contactRepository: Repository<ContactEntity> = (await this.dbConnection).getRepository(ContactEntity)
    debug('Removing contact', contactId)
    ;contactRepository
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

      if (!this.hasCorrectConfig(identity.connection.type, identity.connection.config)) {
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

      if (!this.hasCorrectConfig(identity.connection.type, identity.connection.config)) {
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

  addRelationship = async ({ leftContactId, rightContactId }: IAddRelationshipArgs): Promise<IContactRelationship> => {
    // if (leftContactId === rightContactId) {
    //   return Promise.reject(Error(`Cannot use the same id for both sides of the relationship`))
    // }

    const contactRepository: Repository<ContactEntity> = (await this.dbConnection).getRepository(ContactEntity)
    const leftContact: ContactEntity | null = await contactRepository.findOne({
      where: { id: leftContactId },
    })

    if (!leftContact) {
      return Promise.reject(Error(`No contact found for left contact id: ${leftContactId}`))
    }

    const rightContact: ContactEntity | null = await contactRepository.findOne({
      where: { id: rightContactId },
    })

    if (!rightContact) {
      return Promise.reject(Error(`No contact found for right contact id: ${rightContactId}`))
    }

    const relationship: ContactRelationshipEntity = contactRelationshipEntityFrom({
      left: leftContact,
      right: rightContact,
    })

    const createdResult: ContactRelationshipEntity = await (await this.dbConnection).getRepository(ContactRelationshipEntity).save(relationship)

    return contactRelationshipFrom(createdResult)
  }

  // TODO get relationship?
  // TODO get relationships?

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

  // TODO functions for adding/removing contact types?

  private hasCorrectConfig(type: ConnectionTypeEnum, config: BasicConnectionConfig): boolean {
    switch (type) {
      case ConnectionTypeEnum.OPENID_CONNECT:
        return isOpenIdConfig(config)
      case ConnectionTypeEnum.SIOPv2:
        return isDidAuthConfig(config)
      default:
        throw new Error('Connection type not supported')
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
