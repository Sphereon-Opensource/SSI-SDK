import Debug from 'debug'
import { OrPromise } from '@veramo/utils'
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
} from '../types/IAbstractContactStore'
import { AbstractContactStore } from './AbstractContactStore'
import {
  BasicConnectionConfig,
  ConnectionConfig,
  ConnectionTypeEnum,
  CorrelationIdentifierEnum,
  IConnection,
  IContact,
  ICorrelationIdentifier,
  IDidAuthConfig,
  IIdentity,
  IMetadataItem,
  IOpenIdConfig,
} from '../types/contact'
import { ContactEntity, contactEntityFrom } from '../entities/contact/ContactEntity'
import { IdentityEntity, identityEntityFrom } from '../entities/contact/IdentityEntity'
import { IdentityMetadataItemEntity } from '../entities/contact/IdentityMetadataItemEntity'
import { CorrelationIdentifierEntity } from '../entities/contact/CorrelationIdentifierEntity'
import { ConnectionEntity } from '../entities/contact/ConnectionEntity'
import { BaseConfigEntity } from '../entities/contact/BaseConfigEntity'
import { OpenIdConfigEntity } from '../entities/contact/OpenIdConfigEntity'
import { DidAuthConfigEntity } from '../entities/contact/DidAuthConfigEntity'
import { DataSource, In } from 'typeorm'

const debug = Debug('sphereon:typeorm:contact-store')

export class ContactStore extends AbstractContactStore {
  private readonly dbConnection: OrPromise<DataSource>

  constructor(dbConnection: OrPromise<DataSource>) {
    super()
    this.dbConnection = dbConnection
  }

  getContact = async ({ contactId }: IGetContactArgs): Promise<IContact> => {
    const result = await (await this.dbConnection).getRepository(ContactEntity).findOne({
      where: { id: contactId },
    })

    if (!result) {
      return Promise.reject(Error(`No contact found for id: ${contactId}`))
    }

    return this.contactFrom(result)
  }

  getContacts = async (args?: IGetContactsArgs): Promise<Array<IContact>> => {
    const initialResult = await (await this.dbConnection).getRepository(ContactEntity).find({
      ...(args?.filter && { where: args?.filter }),
    })

    const result = await (await this.dbConnection).getRepository(ContactEntity).find({
      where: {
        id: In(initialResult.map((contact: ContactEntity) => contact.id)),
      },
    })

    return result.map((contact: ContactEntity) => this.contactFrom(contact))
  }

  addContact = async (args: IAddContactArgs): Promise<IContact> => {
    const { name, alias, uri, identities } = args

    const result = await (await this.dbConnection).getRepository(ContactEntity).findOne({
      where: [{ name }, { alias }],
    })

    if (result) {
      return Promise.reject(Error(`Duplicate names or aliases are not allowed. Name: ${name}, Alias: ${alias}`))
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

    const contactEntity = contactEntityFrom({ name, alias, uri, identities })
    debug('Adding contact', name)
    const createdResult = await (await this.dbConnection).getRepository(ContactEntity).save(contactEntity)

    return this.contactFrom(createdResult)
  }

  updateContact = async ({ contact }: IUpdateContactArgs): Promise<IContact> => {
    const result = await (await this.dbConnection).getRepository(ContactEntity).findOne({
      where: { id: contact.id },
    })

    if (!result) {
      return Promise.reject(Error(`No contact found for id: ${contact.id}`))
    }

    const updatedContact = {
      ...contact,
      identities: result.identities,
    }

    debug('Updating contact', contact)
    const updatedResult = await (await this.dbConnection).getRepository(ContactEntity).save(updatedContact, { transaction: true })

    return this.contactFrom(updatedResult)
  }

  removeContact = async ({ contactId }: IRemoveContactArgs): Promise<void> => {
    debug('Removing contact', contactId)
    ;(await this.dbConnection)
      .getRepository(ContactEntity)
      .findOneById(contactId)
      .then(async (contact: ContactEntity | null) => {
        if (!contact) {
          await Promise.reject(Error(`Unable to find the contact with id to remove: ${contactId}`))
        } else {
          await this.deleteIdentities(contact.identities)

          await (
            await this.dbConnection
          )
            .getRepository(ContactEntity)
            .delete({ id: contactId })
            .catch((error) => Promise.reject(Error(`Unable to remove contact with id: ${contactId}. ${error}`)))
        }
      })
      .catch((error) => Promise.reject(Error(`Unable to remove contact with id: ${contactId}. ${error}`)))
  }

  private async deleteIdentities(identities: Array<IdentityEntity>): Promise<void> {
    debug('Removing identities', identities)

    identities.map(async (identity: IdentityEntity) => {
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
        identity.metadata.map(async (metadataItem: IdentityMetadataItemEntity) => {
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

  getIdentity = async ({ identityId }: IGetIdentityArgs): Promise<IIdentity> => {
    const result = await (await this.dbConnection).getRepository(IdentityEntity).findOne({
      where: { id: identityId },
    })

    if (!result) {
      return Promise.reject(Error(`No identity found for id: ${identityId}`))
    }

    return this.identityFrom(result)
  }

  getIdentities = async (args?: IGetIdentitiesArgs): Promise<Array<IIdentity>> => {
    const initialResult = await (await this.dbConnection).getRepository(IdentityEntity).find({
      ...(args?.filter && { where: args?.filter }),
    })

    const result = await (await this.dbConnection).getRepository(IdentityEntity).find({
      where: {
        id: In(initialResult.map((identity: IdentityEntity) => identity.id)),
      },
    })

    return result.map((identity: IdentityEntity) => this.identityFrom(identity))
  }

  addIdentity = async ({ identity, contactId }: IAddIdentityArgs): Promise<IIdentity> => {
    const contact = await (await this.dbConnection).getRepository(ContactEntity).findOne({
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

    const identityEntity = identityEntityFrom(identity)
    identityEntity.contact = contact
    debug('Adding identity', identity)
    const result = await (await this.dbConnection).getRepository(IdentityEntity).save(identityEntity, {
      transaction: true,
    })

    return this.identityFrom(result)
  }

  updateIdentity = async ({ identity }: IUpdateIdentityArgs): Promise<IIdentity> => {
    const result = await (await this.dbConnection).getRepository(IdentityEntity).findOne({
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
    const updatedResult = await (await this.dbConnection).getRepository(IdentityEntity).save(identity, { transaction: true })

    return this.identityFrom(updatedResult)
  }

  removeIdentity = async ({ identityId }: IRemoveIdentityArgs): Promise<void> => {
    const identity = await (await this.dbConnection).getRepository(IdentityEntity).findOne({
      where: { id: identityId },
    })

    if (!identity) {
      return Promise.reject(Error(`No identity found for id: ${identityId}`))
    }

    debug('Removing identity', identityId)

    await this.deleteIdentities([identity])
  }

  private contactFrom = (contact: ContactEntity): IContact => {
    return {
      id: contact.id,
      name: contact.name,
      alias: contact.alias,
      uri: contact.uri,
      roles: [...new Set(contact.identities?.flatMap((identity) => identity.roles))] ?? [],
      identities: contact.identities ? contact.identities.map((identity: IdentityEntity) => this.identityFrom(identity)) : [],
      createdAt: contact.createdAt,
      lastUpdatedAt: contact.lastUpdatedAt,
    }
  }

  private identityFrom = (identity: IdentityEntity): IIdentity => {
    return {
      id: identity.id,
      alias: identity.alias,
      roles: identity.roles,
      identifier: this.correlationIdentifierFrom(identity.identifier),
      ...(identity.connection && { connection: this.connectionFrom(identity.connection) }),
      metadata: identity.metadata ? identity.metadata.map((item: IdentityMetadataItemEntity) => this.metadataItemFrom(item)) : [],
      createdAt: identity.createdAt,
      lastUpdatedAt: identity.createdAt,
    }
  }

  private correlationIdentifierFrom = (identifier: CorrelationIdentifierEntity): ICorrelationIdentifier => {
    return {
      id: identifier.id,
      type: identifier.type,
      correlationId: identifier.correlationId,
    }
  }

  private metadataItemFrom = (item: IdentityMetadataItemEntity): IMetadataItem => {
    return {
      id: item.id,
      label: item.label,
      value: item.value,
    }
  }

  private connectionFrom = (connection: ConnectionEntity): IConnection => {
    return {
      id: connection.id,
      type: connection.type,
      config: this.configFrom(connection.type, connection.config),
    }
  }

  private configFrom = (type: ConnectionTypeEnum, config: BaseConfigEntity): ConnectionConfig => {
    switch (type) {
      case ConnectionTypeEnum.OPENID_CONNECT:
        return {
          id: (config as OpenIdConfigEntity).id,
          clientId: (config as OpenIdConfigEntity).clientId,
          clientSecret: (config as OpenIdConfigEntity).clientSecret,
          scopes: (config as OpenIdConfigEntity).scopes,
          issuer: (config as OpenIdConfigEntity).issuer!, // TODO fixme
          redirectUrl: (config as OpenIdConfigEntity).redirectUrl,
          dangerouslyAllowInsecureHttpRequests: (config as OpenIdConfigEntity).dangerouslyAllowInsecureHttpRequests,
          clientAuthMethod: (config as OpenIdConfigEntity).clientAuthMethod,
        }
      case ConnectionTypeEnum.SIOPv2:
        return {
          id: (config as DidAuthConfigEntity).id,
          identifier: { did: (config as DidAuthConfigEntity).identifier, provider: '', keys: [], services: [] },
          stateId: '',
          redirectUrl: (config as DidAuthConfigEntity).redirectUrl,
          sessionId: (config as DidAuthConfigEntity).sessionId,
        }
      default:
        throw new Error('Connection type not supported')
    }
  }

  private hasCorrectConfig(type: ConnectionTypeEnum, config: BasicConnectionConfig): boolean {
    switch (type) {
      case ConnectionTypeEnum.OPENID_CONNECT:
        return this.isOpenIdConfig(config)
      case ConnectionTypeEnum.SIOPv2:
        return this.isDidAuthConfig(config)
      default:
        throw new Error('Connection type not supported')
    }
  }

  private isOpenIdConfig = (config: BasicConnectionConfig): config is IOpenIdConfig =>
    'clientSecret' in config && 'issuer' in config && 'redirectUrl' in config

  private isDidAuthConfig = (config: BasicConnectionConfig): config is IDidAuthConfig =>
    'identifier' in config && 'redirectUrl' in config && 'sessionId' in config
}
