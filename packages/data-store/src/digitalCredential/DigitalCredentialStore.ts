import { AbstractDigitalCredentialStore } from './AbstractDigitalCredentialStore'
import {
  AddCredentialArgs,
  GetCredentialArgs,
  GetCredentialsArgs,
  GetCredentialsResponse,
  RemoveCredentialArgs,
  UpdateCredentialStateArgs,
} from '../types/digitalCredential/IAbstractDigitalCredentialStore'
import { OrPromise } from '@sphereon/ssi-types'
import { DataSource, FindOptionsOrder, Repository } from 'typeorm'
import Debug from 'debug'
import { DigitalCredentialEntity } from '../entities/digitalCredential/DigitalCredentialEntity'
import { nonPersistedDigitalCredentialEntityFromAddArgs } from '../utils/digitalCredential/MappingUtils'
import { FindOptionsWhere } from 'typeorm/find-options/FindOptionsWhere'
import { CredentialStateType, DigitalCredential, NonPersistedDigitalCredential } from '../types/digitalCredential/digitalCredential'
import { parseAndValidateOrderOptions } from '../utils/SortingUtils'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:credential-store')

export class DigitalCredentialStore extends AbstractDigitalCredentialStore {
  private readonly dbConnection: OrPromise<DataSource>

  constructor(dbConnection: OrPromise<DataSource>) {
    super()
    this.dbConnection = dbConnection
  }

  addCredential = async (args: AddCredentialArgs): Promise<DigitalCredentialEntity> => {
    debug('Adding credential', args)
    const digitalCredentialEntityRepository: Repository<DigitalCredentialEntity> = (await this.dbConnection).getRepository(DigitalCredentialEntity)
    const credentialEntity: NonPersistedDigitalCredential = nonPersistedDigitalCredentialEntityFromAddArgs(args)
    const createdResult: DigitalCredentialEntity = await digitalCredentialEntityRepository.save(credentialEntity)
    return Promise.resolve(createdResult)
  }

  getCredential = async (args: GetCredentialArgs): Promise<DigitalCredentialEntity> => {
    const result: DigitalCredentialEntity | null = await (await this.dbConnection).getRepository(DigitalCredentialEntity).findOne({
      where: args,
    })

    if (!result) {
      return Promise.reject(Error(`No credential found for arg: ${args.toString()}`))
    }
    return result
  }

  getCredentials = async (args?: GetCredentialsArgs): Promise<GetCredentialsResponse> => {
    const { filter = {}, offset, limit, order = 'id.asc' } = args ?? {}
    const sortOptions: FindOptionsOrder<DigitalCredentialEntity> =
      order && typeof order === 'string'
        ? parseAndValidateOrderOptions<DigitalCredentialEntity>(order)
        : <FindOptionsOrder<DigitalCredentialEntity>>order
    const [result, total] = await (await this.dbConnection).getRepository(DigitalCredentialEntity).findAndCount({
      where: filter,
      skip: offset,
      take: limit,
      order: sortOptions,
    })
    return {
      data: result,
      total,
    }
  }

  removeCredential = async (args: RemoveCredentialArgs): Promise<boolean> => {
    if (!args) {
      return false
    }

    let query: FindOptionsWhere<DigitalCredentialEntity> = {}

    if ('id' in args) {
      query.id = args.id
    } else if ('hash' in args) {
      query.hash = args.hash
    } else {
      return false
    }
    try {
      const connection = await this.dbConnection
      const result = await connection.getRepository(DigitalCredentialEntity).delete(query)
      return result.affected === 1
    } catch (error) {
      console.error('Error removing digital credential:', error)
      return false
    }
  }

  updateCredentialState = async (args: UpdateCredentialStateArgs): Promise<DigitalCredentialEntity> => {
    const credentialRepository: Repository<DigitalCredentialEntity> = (await this.dbConnection).getRepository(DigitalCredentialEntity)
    const whereClause: Record<string, any> = {}
    if ('id' in args) {
      whereClause.id = args.id
    } else if ('hash' in args) {
      whereClause.hash = args.hash
    } else {
      throw new Error('No id or hash param is provided.')
    }
    if (!args.verifiedState) {
      throw new Error('No verifiedState param is provided.')
    }
    if (args.verifiedState === CredentialStateType.REVOKED && !args.revokedAt) {
      throw new Error('No revokedAt param is provided.')
    }
    if (args.verifiedState !== CredentialStateType.REVOKED && !args.verifiedAt) {
      throw new Error('No verifiedAt param is provided.')
    }
    const credential: DigitalCredentialEntity | null = await credentialRepository.findOne({
      where: whereClause,
    })

    if (!credential) {
      return Promise.reject(Error(`No credential found for args: ${whereClause}`))
    }
    const updatedCredential: DigitalCredential = {
      ...credential,
      ...(args.verifiedState !== CredentialStateType.REVOKED && { verifiedAt: args.verifiedAt }),
      ...(args.verifiedState === CredentialStateType.REVOKED && { revokedAt: args.revokedAt }),
      lastUpdatedAt: new Date(),
      verifiedState: args.verifiedState,
    }
    debug('Updating credential', credential)
    const updatedResult: DigitalCredentialEntity = await credentialRepository.save(updatedCredential, { transaction: true })
    return updatedResult
  }
}
