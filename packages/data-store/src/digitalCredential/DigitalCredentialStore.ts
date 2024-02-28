import { AbstractDigitalCredentialStore } from './AbstractDigitalCredentialStore'
import {
  AddDigitalCredentialArgs,
  GetDigitalCredentialArgs,
  GetDigitalCredentialsArgs,
  RemoveDigitalCredentialArgs,
  UpdateDigitalCredentialStateArgs,
} from '../types/digitalCredential/IAbstractDigitalCredentialStore'
import { OrPromise } from '@sphereon/ssi-types'
import { DataSource, Repository} from 'typeorm'
import Debug from 'debug'
import {DigitalCredentialEntity} from '../entities/digitalCredential/DigitalCredentialEntity'
import {nonPersistedDigitalCredentialEntityFromAddArgs} from '../utils/digitalCredential/MappingUtils'
import {FindOptionsWhere} from 'typeorm/find-options/FindOptionsWhere'
import {CredentialStateType, DigitalCredential, NonPersistedDigitalCredential} from '../types/digitalCredential/digitalCredential'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:credential-store')

export class DigitalCredentialStore extends AbstractDigitalCredentialStore {
  private readonly dbConnection: OrPromise<DataSource>

  constructor(dbConnection: OrPromise<DataSource>) {
    super()
    this.dbConnection = dbConnection
  }

  addDigitalCredential = async (args: AddDigitalCredentialArgs): Promise<DigitalCredentialEntity> => {
    debug('Adding credential', args)
    const digitalCredentialEntityRepository: Repository<DigitalCredentialEntity> = (await this.dbConnection).getRepository(DigitalCredentialEntity)
    const credentialEntity: NonPersistedDigitalCredential = nonPersistedDigitalCredentialEntityFromAddArgs(args)
    const createdResult: DigitalCredentialEntity = await digitalCredentialEntityRepository.save(credentialEntity)
    return Promise.resolve(createdResult)
  }

  getDigitalCredential = async (args: GetDigitalCredentialArgs): Promise<DigitalCredentialEntity> => {
    const result: DigitalCredentialEntity | null = await (await this.dbConnection).getRepository(DigitalCredentialEntity).findOne({
      where: args,
    })

    if (!result) {
      return Promise.reject(Error(`No credential found for arg: ${args.toString()}`))
    }
    return result
  }

  getDigitalCredentials = async (args?: GetDigitalCredentialsArgs): Promise<Array<DigitalCredentialEntity>> => {
    const result: Array<DigitalCredentialEntity> = await (await this.dbConnection).getRepository(DigitalCredentialEntity).find({
      ...(args?.filter && {where: args?.filter}),
    })
    if (!result) {
      return Promise.reject(Error(`No credential found for arg: ${args?.toString()}`))
    }
    return result
  }

  removeDigitalCredential = async (args: RemoveDigitalCredentialArgs): Promise<boolean> => {
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

  updateDigitalCredentialState = async (args: UpdateDigitalCredentialStateArgs): Promise<DigitalCredentialEntity> => {
    const credentialRepository: Repository<DigitalCredentialEntity> = (await this.dbConnection).getRepository(DigitalCredentialEntity)
    const whereClause: Record<string, any> = {}
    if ('id' in args) {
      whereClause.id = args.id
    }
    if ('hash' in args) {
      whereClause.hash = args.hash
    }
    const credential: DigitalCredentialEntity | null = await credentialRepository.findOne({
      where: whereClause,
    })

    if (!credential) {
      return Promise.reject(Error(`No credential found for args: ${whereClause}`))
    }
    const updatedCredential: DigitalCredential = {
      ...credential,
      verificationDate: args.verificationDate ?? new Date(),
      lastUpdatedAt: new Date(),
      ...(args.verifiedState === CredentialStateType.REVOKED && {revocationDate: args.verificationDate ?? new Date()}),
      verifiedState: args.verifiedState,
    }
    debug('Updating credential', credential)
    const updatedResult: DigitalCredentialEntity = await credentialRepository.save(updatedCredential, { transaction: true })
    return updatedResult
  }
}
