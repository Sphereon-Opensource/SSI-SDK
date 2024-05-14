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
import { ElectronicAddressEntity } from '../entities/contact/ElectronicAddressEntity'
import { PhysicalAddressEntity } from '../entities/contact/PhysicalAddressEntity'
import {
  electronicAddressEntityFrom,
  electronicAddressFrom,
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
  physicalAddressEntityFrom,
  physicalAddressFrom,
} from '../utils/contact/MappingUtils'
import {
  AddElectronicAddressArgs,
  AddIdentityArgs,
  AddPartyArgs,
  AddPartyTypeArgs,
  AddPhysicalAddressArgs,
  AddRelationshipArgs,
  ConnectionType,
  CorrelationIdentifierType,
  ElectronicAddress,
  GetElectronicAddressArgs,
  GetElectronicAddressesArgs,
  GetIdentitiesArgs,
  GetIdentityArgs,
  GetPartiesArgs,
  GetPartyArgs,
  GetPartyTypeArgs,
  GetPartyTypesArgs,
  GetPhysicalAddressArgs,
  GetPhysicalAddressesArgs,
  GetRelationshipArgs,
  GetRelationshipsArgs,
  Identity,
  NonPersistedConnectionConfig,
  NonPersistedContact,
  Party,
  PartyRelationship,
  PartyType,
  PartyTypeType,
  PhysicalAddress,
  RemoveElectronicAddressArgs,
  RemoveIdentityArgs,
  RemovePartyArgs,
  RemovePartyTypeArgs,
  RemovePhysicalAddressArgs,
  RemoveRelationshipArgs,
  UpdateElectronicAddressArgs,
  UpdateIdentityArgs,
  UpdatePartyArgs,
  UpdatePartyTypeArgs,
  UpdatePhysicalAddressArgs,
  UpdateRelationshipArgs,
} from '../types'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:contact-store')

export class ContactStore extends AbstractContactStore {
  private readonly dbConnection: OrPromise<DataSource>

  constructor(dbConnection: OrPromise<DataSource>) {
    super()
    this.dbConnection = dbConnection
  }

  getParty = async (args: GetPartyArgs): Promise<Party> => {
    const { partyId } = args
    const result: PartyEntity | null = await (await this.dbConnection).getRepository(PartyEntity).findOne({
      where: { id: partyId },
    })

    if (!result) {
      return Promise.reject(Error(`No party found for id: ${partyId}`))
    }

    return partyFrom(result)
  }

  getParties = async (args?: GetPartiesArgs): Promise<Array<Party>> => {
    debug(`getParties()`, args)
    const { filter } = args ?? {}
    const partyRepository: Repository<PartyEntity> = (await this.dbConnection).getRepository(PartyEntity)
    const initialResult: Array<PartyEntity> = await partyRepository.find({
      ...(filter && { where: filter }),
    })

    const result: Array<PartyEntity> = await partyRepository.find({
      where: {
        id: In(initialResult.map((party: PartyEntity) => party.id)),
      },
    })
    debug(`getParties() resulted in ${result.length} parties`)

    return result.map((party: PartyEntity) => partyFrom(party))
  }

  addParty = async (args: AddPartyArgs): Promise<Party> => {
    const { identities, contact, partyType } = args

    const partyRepository: Repository<PartyEntity> = (await this.dbConnection).getRepository(PartyEntity)

    if (!this.hasCorrectPartyType(partyType.type, contact)) {
      return Promise.reject(Error(`Party type ${partyType.type}, does not match for provided contact`))
    }

    for (const identity of identities ?? []) {
      if (identity.identifier.type === CorrelationIdentifierType.URL) {
        if (!identity.connection) {
          return Promise.reject(Error(`Identity with correlation type ${CorrelationIdentifierType.URL} should contain a connection`))
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

  updateParty = async (args: UpdatePartyArgs): Promise<Party> => {
    const { party } = args
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

  removeParty = async (args: RemovePartyArgs): Promise<void> => {
    const { partyId } = args
    const partyRepository: Repository<PartyEntity> = (await this.dbConnection).getRepository(PartyEntity)
    debug('Removing party', partyId)
    partyRepository
      .findOneById(partyId)
      .then(async (party: PartyEntity | null): Promise<void> => {
        if (!party) {
          await Promise.reject(Error(`Unable to find the party with id to remove: ${partyId}`))
        } else {
          await this.deleteIdentities(party.identities)
          await this.deleteElectronicAddresses(party.electronicAddresses)
          await this.deletePhysicalAddresses(party.physicalAddresses)

          await partyRepository
            .delete({ id: partyId })
            .catch((error) => Promise.reject(Error(`Unable to remove party with id: ${partyId}. ${error}`)))

          const partyContactRepository: Repository<BaseContactEntity> = (await this.dbConnection).getRepository(BaseContactEntity)
          await partyContactRepository
            .delete({ id: party.contact.id })
            .catch((error) => Promise.reject(Error(`Unable to remove party contact with id: ${party.contact.id}. ${error}`)))
        }
      })
      .catch((error) => Promise.reject(Error(`Unable to remove party with id: ${partyId}. ${error}`)))
  }

  getIdentity = async (args: GetIdentityArgs): Promise<Identity> => {
    const { identityId } = args
    const result: IdentityEntity | null = await (await this.dbConnection).getRepository(IdentityEntity).findOne({
      where: { id: identityId },
    })

    if (!result) {
      return Promise.reject(Error(`No identity found for id: ${identityId}`))
    }

    return identityFrom(result)
  }

  getIdentities = async (args?: GetIdentitiesArgs): Promise<Array<Identity>> => {
    const { filter } = args ?? {}
    const identityRepository: Repository<IdentityEntity> = (await this.dbConnection).getRepository(IdentityEntity)
    const initialResult: Array<IdentityEntity> = await identityRepository.find({
      ...(filter && { where: filter }),
    })

    const result: Array<IdentityEntity> = await identityRepository.find({
      where: {
        id: In(initialResult.map((identity: IdentityEntity) => identity.id)),
      },
    })

    return result.map((identity: IdentityEntity) => identityFrom(identity))
  }

  addIdentity = async (args: AddIdentityArgs): Promise<Identity> => {
    const { identity, partyId } = args
    const party: PartyEntity | null = await (await this.dbConnection).getRepository(PartyEntity).findOne({
      where: { id: partyId },
    })

    if (!party) {
      return Promise.reject(Error(`No party found for id: ${partyId}`))
    }

    if (identity.identifier.type === CorrelationIdentifierType.URL) {
      if (!identity.connection) {
        return Promise.reject(Error(`Identity with correlation type ${CorrelationIdentifierType.URL} should contain a connection`))
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

  updateIdentity = async (args: UpdateIdentityArgs): Promise<Identity> => {
    const { identity } = args
    const identityRepository: Repository<IdentityEntity> = (await this.dbConnection).getRepository(IdentityEntity)
    const result: IdentityEntity | null = await identityRepository.findOne({
      where: { id: identity.id },
    })

    if (!result) {
      return Promise.reject(Error(`No identity found for id: ${identity.id}`))
    }

    if (identity.identifier.type === CorrelationIdentifierType.URL) {
      if (!identity.connection) {
        return Promise.reject(Error(`Identity with correlation type ${CorrelationIdentifierType.URL} should contain a connection`))
      }

      if (!this.hasCorrectConnectionConfig(identity.connection.type, identity.connection.config)) {
        return Promise.reject(Error(`Connection type ${identity.connection.type}, does not match for provided config`))
      }
    }

    debug('Updating identity', identity)
    const updatedResult: IdentityEntity = await identityRepository.save(identity, { transaction: true })

    return identityFrom(updatedResult)
  }

  removeIdentity = async (args: RemoveIdentityArgs): Promise<void> => {
    const { identityId } = args
    const identity: IdentityEntity | null = await (await this.dbConnection).getRepository(IdentityEntity).findOne({
      where: { id: identityId },
    })

    if (!identity) {
      return Promise.reject(Error(`No identity found for id: ${identityId}`))
    }

    debug('Removing identity', identityId)

    await this.deleteIdentities([identity])
  }

  addRelationship = async (args: AddRelationshipArgs): Promise<PartyRelationship> => {
    const { leftId, rightId } = args
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

  getRelationship = async (args: GetRelationshipArgs): Promise<PartyRelationship> => {
    const { relationshipId } = args
    const result: PartyRelationshipEntity | null = await (await this.dbConnection).getRepository(PartyRelationshipEntity).findOne({
      where: { id: relationshipId },
    })

    if (!result) {
      return Promise.reject(Error(`No relationship found for id: ${relationshipId}`))
    }

    return partyRelationshipFrom(result)
  }

  getRelationships = async (args?: GetRelationshipsArgs): Promise<Array<PartyRelationship>> => {
    const { filter } = args ?? {}
    const partyRelationshipRepository: Repository<PartyRelationshipEntity> = (await this.dbConnection).getRepository(PartyRelationshipEntity)
    const initialResult: Array<PartyRelationshipEntity> = await partyRelationshipRepository.find({
      ...(filter && { where: filter }),
    })

    const result: Array<PartyRelationshipEntity> = await partyRelationshipRepository.find({
      where: {
        id: In(initialResult.map((partyRelationship: PartyRelationshipEntity) => partyRelationship.id)),
      },
    })

    return result.map((partyRelationship: PartyRelationshipEntity) => partyRelationshipFrom(partyRelationship))
  }

  updateRelationship = async (args: UpdateRelationshipArgs): Promise<PartyRelationship> => {
    const { relationship } = args
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

  removeRelationship = async (args: RemoveRelationshipArgs): Promise<void> => {
    const { relationshipId } = args
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

  getPartyType = async (args: GetPartyTypeArgs): Promise<PartyType> => {
    const { partyTypeId } = args
    const result: PartyTypeEntity | null = await (await this.dbConnection).getRepository(PartyTypeEntity).findOne({
      where: { id: partyTypeId },
    })

    if (!result) {
      return Promise.reject(Error(`No party type found for id: ${partyTypeId}`))
    }

    return partyTypeFrom(result)
  }

  getPartyTypes = async (args?: GetPartyTypesArgs): Promise<Array<PartyType>> => {
    const { filter } = args ?? {}
    const partyTypeRepository: Repository<PartyTypeEntity> = (await this.dbConnection).getRepository(PartyTypeEntity)
    const initialResult: Array<PartyTypeEntity> = await partyTypeRepository.find({
      ...(filter && { where: filter }),
    })

    const result: Array<PartyTypeEntity> = await partyTypeRepository.find({
      where: {
        id: In(initialResult.map((partyType: PartyTypeEntity) => partyType.id)),
      },
    })

    return result.map((partyType: PartyTypeEntity) => partyTypeFrom(partyType))
  }

  updatePartyType = async (args: UpdatePartyTypeArgs): Promise<PartyType> => {
    const { partyType } = args
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

  removePartyType = async (args: RemovePartyTypeArgs): Promise<void> => {
    const { partyTypeId } = args
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

  getElectronicAddress = async (args: GetElectronicAddressArgs): Promise<ElectronicAddress> => {
    const { electronicAddressId } = args
    const result: ElectronicAddressEntity | null = await (await this.dbConnection).getRepository(ElectronicAddressEntity).findOne({
      where: { id: electronicAddressId },
    })

    if (!result) {
      return Promise.reject(Error(`No electronic address found for id: ${electronicAddressId}`))
    }

    return electronicAddressFrom(result)
  }

  getElectronicAddresses = async (args?: GetElectronicAddressesArgs): Promise<Array<ElectronicAddress>> => {
    const { filter } = args ?? {}
    const electronicAddressRepository: Repository<ElectronicAddressEntity> = (await this.dbConnection).getRepository(ElectronicAddressEntity)
    const initialResult: Array<ElectronicAddressEntity> = await electronicAddressRepository.find({
      ...(filter && { where: filter }),
    })

    const result: Array<ElectronicAddressEntity> = await electronicAddressRepository.find({
      where: {
        id: In(initialResult.map((electronicAddress: ElectronicAddressEntity) => electronicAddress.id)),
      },
    })

    return result.map((electronicAddress: ElectronicAddressEntity) => electronicAddressFrom(electronicAddress))
  }

  addElectronicAddress = async (args: AddElectronicAddressArgs): Promise<ElectronicAddress> => {
    const { electronicAddress, partyId } = args
    const party: PartyEntity | null = await (await this.dbConnection).getRepository(PartyEntity).findOne({
      where: { id: partyId },
    })

    if (!party) {
      return Promise.reject(Error(`No party found for id: ${partyId}`))
    }

    const electronicAddressEntity: ElectronicAddressEntity = electronicAddressEntityFrom(electronicAddress)
    electronicAddressEntity.party = party
    debug('Adding electronic address', electronicAddress)
    const result: ElectronicAddressEntity = await (await this.dbConnection).getRepository(ElectronicAddressEntity).save(electronicAddressEntity, {
      transaction: true,
    })

    return electronicAddressFrom(result)
  }

  updateElectronicAddress = async (args: UpdateElectronicAddressArgs): Promise<ElectronicAddress> => {
    const { electronicAddress } = args
    const electronicAddressRepository: Repository<ElectronicAddressEntity> = (await this.dbConnection).getRepository(ElectronicAddressEntity)
    const result: ElectronicAddressEntity | null = await electronicAddressRepository.findOne({
      where: { id: electronicAddress.id },
    })

    if (!result) {
      return Promise.reject(Error(`No electronic address found for id: ${electronicAddress.id}`))
    }

    debug('Updating electronic address', electronicAddress)
    const updatedResult: ElectronicAddressEntity = await electronicAddressRepository.save(electronicAddress, { transaction: true })

    return electronicAddressFrom(updatedResult)
  }

  removeElectronicAddress = async (args: RemoveElectronicAddressArgs): Promise<void> => {
    const { electronicAddressId } = args
    const electronicAddressRepository: Repository<ElectronicAddressEntity> = (await this.dbConnection).getRepository(ElectronicAddressEntity)
    const electronicAddress: ElectronicAddressEntity | null = await electronicAddressRepository.findOne({
      where: { id: electronicAddressId },
    })

    if (!electronicAddress) {
      return Promise.reject(Error(`No electronic address found for id: ${electronicAddressId}`))
    }

    debug('Removing electronic address', electronicAddressId)

    await electronicAddressRepository.delete(electronicAddressId)
  }

  getPhysicalAddress = async (args: GetPhysicalAddressArgs): Promise<PhysicalAddress> => {
    const { physicalAddressId } = args
    const result: PhysicalAddressEntity | null = await (await this.dbConnection).getRepository(PhysicalAddressEntity).findOne({
      where: { id: physicalAddressId },
    })

    if (!result) {
      return Promise.reject(Error(`No physical address found for id: ${physicalAddressId}`))
    }

    return physicalAddressFrom(result)
  }

  getPhysicalAddresses = async (args?: GetPhysicalAddressesArgs): Promise<Array<PhysicalAddress>> => {
    const { filter } = args ?? {}
    const physicalAddressRepository: Repository<PhysicalAddressEntity> = (await this.dbConnection).getRepository(PhysicalAddressEntity)
    const initialResult: Array<PhysicalAddressEntity> = await physicalAddressRepository.find({
      ...(filter && { where: filter }),
    })

    const result: Array<PhysicalAddressEntity> = await physicalAddressRepository.find({
      where: {
        id: In(initialResult.map((physicalAddress: PhysicalAddressEntity) => physicalAddress.id)),
      },
    })

    return result.map((physicalAddress: PhysicalAddressEntity) => physicalAddressFrom(physicalAddress))
  }

  addPhysicalAddress = async (args: AddPhysicalAddressArgs): Promise<PhysicalAddress> => {
    const { physicalAddress, partyId } = args
    const party: PartyEntity | null = await (await this.dbConnection).getRepository(PartyEntity).findOne({
      where: { id: partyId },
    })

    if (!party) {
      return Promise.reject(Error(`No party found for id: ${partyId}`))
    }

    const physicalAddressEntity: PhysicalAddressEntity = physicalAddressEntityFrom(physicalAddress)
    physicalAddressEntity.party = party
    debug('Adding physical address', physicalAddress)
    const result: PhysicalAddressEntity = await (await this.dbConnection).getRepository(PhysicalAddressEntity).save(physicalAddressEntity, {
      transaction: true,
    })

    return physicalAddressFrom(result)
  }

  updatePhysicalAddress = async (args: UpdatePhysicalAddressArgs): Promise<PhysicalAddress> => {
    const { physicalAddress } = args
    const physicalAddressRepository: Repository<PhysicalAddressEntity> = (await this.dbConnection).getRepository(PhysicalAddressEntity)
    const result: PhysicalAddressEntity | null = await physicalAddressRepository.findOne({
      where: { id: physicalAddress.id },
    })

    if (!result) {
      return Promise.reject(Error(`No physical address found for id: ${physicalAddress.id}`))
    }

    debug('Updating physical address', physicalAddress)
    const updatedResult: PhysicalAddressEntity = await physicalAddressRepository.save(physicalAddress, { transaction: true })

    return physicalAddressFrom(updatedResult)
  }

  removePhysicalAddress = async (args: RemovePhysicalAddressArgs): Promise<void> => {
    const { physicalAddressId } = args
    const physicalAddressRepository: Repository<PhysicalAddressEntity> = (await this.dbConnection).getRepository(PhysicalAddressEntity)
    const physicalAddress: PhysicalAddressEntity | null = await physicalAddressRepository.findOne({
      where: { id: physicalAddressId },
    })

    if (!physicalAddress) {
      return Promise.reject(Error(`No physical address found for id: ${physicalAddressId}`))
    }

    debug('Removing physical address', physicalAddressId)

    await physicalAddressRepository.delete(physicalAddressId)
  }

  private hasCorrectConnectionConfig(type: ConnectionType, config: NonPersistedConnectionConfig): boolean {
    switch (type) {
      case ConnectionType.OPENID_CONNECT:
        return isOpenIdConfig(config)
      case ConnectionType.SIOPv2:
        return isDidAuthConfig(config)
      default:
        throw new Error('Connection type not supported')
    }
  }

  private hasCorrectPartyType(type: PartyTypeType, contact: NonPersistedContact): boolean {
    switch (type) {
      case PartyTypeType.NATURAL_PERSON:
        return isNaturalPerson(contact)
      case PartyTypeType.ORGANIZATION:
        return isOrganization(contact)
      default:
        throw new Error('Party type not supported')
    }
  }

  private async deleteIdentities(identities: Array<IdentityEntity>): Promise<void> {
    debug('Removing identities', identities)

    const connection: DataSource = await this.dbConnection
    const correlationIdentifierRepository: Repository<CorrelationIdentifierEntity> = connection.getRepository(CorrelationIdentifierEntity)
    const baseConfigRepository: Repository<BaseConfigEntity> = connection.getRepository(BaseConfigEntity)
    const connectionRepository: Repository<ConnectionEntity> = connection.getRepository(ConnectionEntity)
    const identityMetadataItemRepository: Repository<IdentityMetadataItemEntity> = connection.getRepository(IdentityMetadataItemEntity)
    const identityRepository: Repository<IdentityEntity> = connection.getRepository(IdentityEntity)

    identities.map(async (identity: IdentityEntity): Promise<void> => {
      await correlationIdentifierRepository
        .delete(identity.identifier.id)
        .catch((error) => Promise.reject(Error(`Unable to remove identity.identifier with id ${identity.identifier.id}. ${error}`)))

      if (identity.connection) {
        await baseConfigRepository.delete(identity.connection.config.id)
        await connectionRepository
          .delete(identity.connection.id)
          .catch((error) => Promise.reject(Error(`Unable to remove identity.connection with id ${identity.connection?.id}. ${error}`)))
      }

      if (identity.metadata) {
        identity.metadata.map(async (metadataItem: IdentityMetadataItemEntity): Promise<void> => {
          await identityMetadataItemRepository
            .delete(metadataItem.id)
            .catch((error) => Promise.reject(Error(`Unable to remove identity.metadataItem with id ${metadataItem.id}. ${error}`)))
        })
      }

      await identityRepository
        .delete(identity.id)
        .catch((error) => Promise.reject(Error(`Unable to remove identity with id ${identity.id}. ${error}`)))
    })
  }

  private async deleteElectronicAddresses(electronicAddresses: Array<ElectronicAddressEntity>): Promise<void> {
    debug('Removing electronic addresses', electronicAddresses)

    const electronicAddressRepository: Repository<ElectronicAddressEntity> = (await this.dbConnection).getRepository(ElectronicAddressEntity)
    electronicAddresses.map(async (electronicAddress: ElectronicAddressEntity): Promise<void> => {
      await electronicAddressRepository
        .delete(electronicAddress.id)
        .catch((error) => Promise.reject(Error(`Unable to remove electronic address with id ${electronicAddress.id}. ${error}`)))
    })
  }

  private async deletePhysicalAddresses(physicalAddresses: Array<PhysicalAddressEntity>): Promise<void> {
    debug('Removing physical addresses', physicalAddresses)

    const physicalAddressRepository: Repository<PhysicalAddressEntity> = (await this.dbConnection).getRepository(PhysicalAddressEntity)
    physicalAddresses.map(async (physicalAddress: PhysicalAddressEntity): Promise<void> => {
      await physicalAddressRepository
        .delete(physicalAddress.id)
        .catch((error) => Promise.reject(Error(`Unable to remove physical address with id ${physicalAddress.id}. ${error}`)))
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
