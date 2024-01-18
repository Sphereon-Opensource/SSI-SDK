import { OrPromise } from '@sphereon/ssi-types'
import { DataSource, In, Repository } from 'typeorm'
import Debug from 'debug'
import { AbstractContactStore } from './AbstractContactStore'
import { PartyEntity } from '../entities/contact/PartyEntity'
import { IdentityEntity } from '../entities/contact/IdentityEntity'
import { IdentityMetadataItemEntity } from '../entities/contact/IdentityMetadataItemEntity'
import { CorrelationIdentifierEntity } from '../entities/contact/CorrelationIdentifierEntity'
import { ConnectionEntity } from '../entities/contact/ConnectionEntity'
import { BaseConfigEntity } from '../entities/contact/BaseConfigEntity'
import { PartyRelationshipEntity } from '../entities/contact/PartyRelationshipEntity'
import { PartyTypeEntity } from '../entities/contact/PartyTypeEntity'
import { BaseContactEntity } from '../entities/contact/BaseContactEntity'
import {
  identityEntityFrom,
  identityFrom,
  isDidAuthConfig,
  isNaturalPerson,
  isOpenIdConfig,
  isOrganization,
  partyEntityFrom,
  partyFrom,
  partyRelationshipEntityFrom,
  partyRelationshipFrom,
  partyTypeEntityFrom,
  partyTypeFrom,
} from '../utils/contact/MappingUtils'
import {
  AddIdentityArgs,
  GetIdentityArgs,
  GetIdentitiesArgs,
  GetPartyArgs,
  RemoveIdentityArgs,
  UpdateIdentityArgs,
  GetPartiesArgs,
  AddPartyArgs,
  UpdatePartyArgs,
  RemovePartyArgs,
  NonPersistedConnectionConfig,
  ConnectionTypeEnum,
  CorrelationIdentifierEnum,
  Party,
  Identity,
  RemoveRelationshipArgs,
  PartyRelationship,
  AddRelationshipArgs,
  GetRelationshipArgs,
  AddPartyTypeArgs,
  PartyType,
  GetPartyTypeArgs,
  GetPartyTypesArgs,
  UpdatePartyTypeArgs,
  RemovePartyTypeArgs,
  GetRelationshipsArgs,
  UpdateRelationshipArgs,
  PartyTypeEnum,
  NonPersistedContact,
} from '../types'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:contact-store')

export class ContactStore extends AbstractContactStore {
  private readonly dbConnection: OrPromise<DataSource>

  constructor(dbConnection: OrPromise<DataSource>) {
    super()
    this.dbConnection = dbConnection
  }

  getParty = async ({ partyId }: GetPartyArgs): Promise<Party> => {
    const result: PartyEntity | null = await (await this.dbConnection).getRepository(PartyEntity).findOne({
      where: { id: partyId },
    })

    if (!result) {
      return Promise.reject(Error(`No party found for id: ${partyId}`))
    }

    return partyFrom(result)
  }

  getParties = async (args?: GetPartiesArgs): Promise<Array<Party>> => {
    const partyRepository: Repository<PartyEntity> = (await this.dbConnection).getRepository(PartyEntity)
    const initialResult: Array<PartyEntity> = await partyRepository.find({
      ...(args?.filter && { where: args?.filter }),
    })

    const result: Array<PartyEntity> = await partyRepository.find({
      where: {
        id: In(initialResult.map((party: PartyEntity) => party.id)),
      },
    })

    return result.map((party: PartyEntity) => partyFrom(party))
  }

  addParty = async (args: AddPartyArgs): Promise<Party> => {
    const { identities, contact, partyType } = args

    const partyRepository: Repository<PartyEntity> = (await this.dbConnection).getRepository(PartyEntity)

    if (!this.hasCorrectPartyType(partyType.type, contact)) {
      return Promise.reject(Error(`Party type ${partyType.type}, does not match for provided contact`))
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

    const partyEntity: PartyEntity = partyEntityFrom(args)
    debug('Adding party', args)
    const createdResult: PartyEntity = await partyRepository.save(partyEntity)

    return partyFrom(createdResult)
  }

  updateParty = async ({ party }: UpdatePartyArgs): Promise<Party> => {
    const partyRepository: Repository<PartyEntity> = (await this.dbConnection).getRepository(PartyEntity)
    const result: PartyEntity | null = await partyRepository.findOne({
      where: { id: party.id },
    })

    if (!result) {
      return Promise.reject(Error(`No party found for id: ${party.id}`))
    }

    const updatedParty = {
      ...party,
      identities: result.identities,
      type: result.partyType,
      relationships: result.relationships,
      electronicAddresses: result.electronicAddresses,
    }

    debug('Updating party', party)
    const updatedResult: PartyEntity = await partyRepository.save(updatedParty, { transaction: true })

    return partyFrom(updatedResult)
  }

  removeParty = async ({ partyId }: RemovePartyArgs): Promise<void> => {
    const partyRepository: Repository<PartyEntity> = (await this.dbConnection).getRepository(PartyEntity)
    debug('Removing party', partyId)
    partyRepository
      .findOneById(partyId)
      .then(async (party: PartyEntity | null): Promise<void> => {
        if (!party) {
          await Promise.reject(Error(`Unable to find the party with id to remove: ${partyId}`))
        } else {
          await this.deleteIdentities(party.identities)

          await partyRepository
            .delete({ id: partyId })
            .catch((error) => Promise.reject(Error(`Unable to remove party with id: ${partyId}. ${error}`)))

          const partyContactRepository: Repository<BaseContactEntity> = (await this.dbConnection).getRepository(BaseContactEntity)
          await partyContactRepository
            .delete({ id: party.contact.id })
            .catch((error) => Promise.reject(Error(`Unable to remove party with id: ${partyId}. ${error}`)))
        }
      })
      .catch((error) => Promise.reject(Error(`Unable to remove party with id: ${partyId}. ${error}`)))
  }

  getIdentity = async ({ identityId }: GetIdentityArgs): Promise<Identity> => {
    const result: IdentityEntity | null = await (await this.dbConnection).getRepository(IdentityEntity).findOne({
      where: { id: identityId },
    })

    if (!result) {
      return Promise.reject(Error(`No identity found for id: ${identityId}`))
    }

    return identityFrom(result)
  }

  getIdentities = async (args?: GetIdentitiesArgs): Promise<Array<Identity>> => {
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

  addIdentity = async ({ identity, partyId }: AddIdentityArgs): Promise<Identity> => {
    const party: PartyEntity | null = await (await this.dbConnection).getRepository(PartyEntity).findOne({
      where: { id: partyId },
    })

    if (!party) {
      return Promise.reject(Error(`No party found for id: ${partyId}`))
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
    identityEntity.party = party
    debug('Adding identity', identity)
    const result: IdentityEntity = await (await this.dbConnection).getRepository(IdentityEntity).save(identityEntity, {
      transaction: true,
    })

    return identityFrom(result)
  }

  updateIdentity = async ({ identity }: UpdateIdentityArgs): Promise<Identity> => {
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

  removeIdentity = async ({ identityId }: RemoveIdentityArgs): Promise<void> => {
    const identity: IdentityEntity | null = await (await this.dbConnection).getRepository(IdentityEntity).findOne({
      where: { id: identityId },
    })

    if (!identity) {
      return Promise.reject(Error(`No identity found for id: ${identityId}`))
    }

    debug('Removing identity', identityId)

    await this.deleteIdentities([identity])
  }

  addRelationship = async ({ leftId, rightId }: AddRelationshipArgs): Promise<PartyRelationship> => {
    return this.assertRelationshipSides(leftId, rightId).then(async (): Promise<PartyRelationship> => {
      const relationship: PartyRelationshipEntity = partyRelationshipEntityFrom({
        leftId,
        rightId,
      })
      debug('Adding party relationship', relationship)

      const createdResult: PartyRelationshipEntity = await (await this.dbConnection).getRepository(PartyRelationshipEntity).save(relationship)

      return partyRelationshipFrom(createdResult)
    })
  }

  getRelationship = async ({ relationshipId }: GetRelationshipArgs): Promise<PartyRelationship> => {
    const result: PartyRelationshipEntity | null = await (await this.dbConnection).getRepository(PartyRelationshipEntity).findOne({
      where: { id: relationshipId },
    })

    if (!result) {
      return Promise.reject(Error(`No relationship found for id: ${relationshipId}`))
    }

    return partyRelationshipFrom(result)
  }

  getRelationships = async (args?: GetRelationshipsArgs): Promise<Array<PartyRelationship>> => {
    const partyRelationshipRepository: Repository<PartyRelationshipEntity> = (await this.dbConnection).getRepository(PartyRelationshipEntity)
    const initialResult: Array<PartyRelationshipEntity> = await partyRelationshipRepository.find({
      ...(args?.filter && { where: args?.filter }),
    })

    const result: Array<PartyRelationshipEntity> = await partyRelationshipRepository.find({
      where: {
        id: In(initialResult.map((partyRelationship: PartyRelationshipEntity) => partyRelationship.id)),
      },
    })

    return result.map((partyRelationship: PartyRelationshipEntity) => partyRelationshipFrom(partyRelationship))
  }

  updateRelationship = async ({ relationship }: UpdateRelationshipArgs): Promise<PartyRelationship> => {
    const partyRelationshipRepository: Repository<PartyRelationshipEntity> = (await this.dbConnection).getRepository(PartyRelationshipEntity)
    const result: PartyRelationshipEntity | null = await partyRelationshipRepository.findOne({
      where: { id: relationship.id },
    })

    if (!result) {
      return Promise.reject(Error(`No party relationship found for id: ${relationship.id}`))
    }

    return this.assertRelationshipSides(relationship.leftId, relationship.rightId).then(async (): Promise<PartyRelationship> => {
      debug('Updating party relationship', relationship)
      const updatedResult: PartyRelationshipEntity = await partyRelationshipRepository.save(relationship, { transaction: true })

      return partyRelationshipFrom(updatedResult)
    })
  }

  removeRelationship = async ({ relationshipId }: RemoveRelationshipArgs): Promise<void> => {
    const partyRelationshipRepository: Repository<PartyRelationshipEntity> = (await this.dbConnection).getRepository(PartyRelationshipEntity)
    const relationship: PartyRelationshipEntity | null = await partyRelationshipRepository.findOne({
      where: { id: relationshipId },
    })

    if (!relationship) {
      return Promise.reject(Error(`No relationship found for id: ${relationshipId}`))
    }

    debug('Removing relationship', relationshipId)

    await partyRelationshipRepository.delete(relationshipId)
  }

  addPartyType = async (args: AddPartyTypeArgs): Promise<PartyType> => {
    const partyEntity: PartyTypeEntity = partyTypeEntityFrom(args)
    debug('Adding party type', args)
    const createdResult: PartyTypeEntity = await (await this.dbConnection).getRepository(PartyTypeEntity).save(partyEntity)

    return partyTypeFrom(createdResult)
  }

  getPartyType = async ({ partyTypeId }: GetPartyTypeArgs): Promise<PartyType> => {
    const result: PartyTypeEntity | null = await (await this.dbConnection).getRepository(PartyTypeEntity).findOne({
      where: { id: partyTypeId },
    })

    if (!result) {
      return Promise.reject(Error(`No party type found for id: ${partyTypeId}`))
    }

    return partyTypeFrom(result)
  }

  getPartyTypes = async (args?: GetPartyTypesArgs): Promise<Array<PartyType>> => {
    const partyTypeRepository: Repository<PartyTypeEntity> = (await this.dbConnection).getRepository(PartyTypeEntity)
    const initialResult: Array<PartyTypeEntity> = await partyTypeRepository.find({
      ...(args?.filter && { where: args?.filter }),
    })

    const result: Array<PartyTypeEntity> = await partyTypeRepository.find({
      where: {
        id: In(initialResult.map((partyType: PartyTypeEntity) => partyType.id)),
      },
    })

    return result.map((partyType: PartyTypeEntity) => partyTypeFrom(partyType))
  }

  updatePartyType = async ({ partyType }: UpdatePartyTypeArgs): Promise<PartyType> => {
    const partyTypeRepository: Repository<PartyTypeEntity> = (await this.dbConnection).getRepository(PartyTypeEntity)
    const result: PartyTypeEntity | null = await partyTypeRepository.findOne({
      where: { id: partyType.id },
    })

    if (!result) {
      return Promise.reject(Error(`No party type found for id: ${partyType.id}`))
    }

    debug('Updating party type', partyType)
    const updatedResult: PartyTypeEntity = await partyTypeRepository.save(partyType, { transaction: true })

    return partyTypeFrom(updatedResult)
  }

  removePartyType = async ({ partyTypeId }: RemovePartyTypeArgs): Promise<void> => {
    const parties: Array<PartyEntity> = await (await this.dbConnection).getRepository(PartyEntity).find({
      where: {
        partyType: {
          id: partyTypeId,
        },
      },
    })

    if (parties.length > 0) {
      return Promise.reject(Error(`Unable to remove party type with id: ${partyTypeId}. Party type is in use`))
    }

    const partyTypeRepository: Repository<PartyTypeEntity> = (await this.dbConnection).getRepository(PartyTypeEntity)
    const partyType: PartyTypeEntity | null = await partyTypeRepository.findOne({
      where: { id: partyTypeId },
    })

    if (!partyType) {
      return Promise.reject(Error(`No party type found for id: ${partyTypeId}`))
    }

    debug('Removing party type', partyTypeId)

    await partyTypeRepository.delete(partyTypeId)
  }

  private hasCorrectConnectionConfig(type: ConnectionTypeEnum, config: NonPersistedConnectionConfig): boolean {
    switch (type) {
      case ConnectionTypeEnum.OPENID_CONNECT:
        return isOpenIdConfig(config)
      case ConnectionTypeEnum.SIOPv2:
        return isDidAuthConfig(config)
      default:
        throw new Error('Connection type not supported')
    }
  }

  private hasCorrectPartyType(type: PartyTypeEnum, contact: NonPersistedContact): boolean {
    switch (type) {
      case PartyTypeEnum.NATURAL_PERSON:
        return isNaturalPerson(contact)
      case PartyTypeEnum.ORGANIZATION:
        return isOrganization(contact)
      default:
        throw new Error('Party type not supported')
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

  private async assertRelationshipSides(leftId: string, rightId: string): Promise<void> {
    const partyRepository: Repository<PartyEntity> = (await this.dbConnection).getRepository(PartyEntity)
    const leftParty: PartyEntity | null = await partyRepository.findOne({
      where: { id: leftId },
    })

    if (!leftParty) {
      return Promise.reject(Error(`No party found for left side of the relationship, party id: ${leftId}`))
    }

    const rightParty: PartyEntity | null = await partyRepository.findOne({
      where: { id: rightId },
    })

    if (!rightParty) {
      return Promise.reject(Error(`No party found for right side of the relationship, party id: ${rightId}`))
    }
  }
}
