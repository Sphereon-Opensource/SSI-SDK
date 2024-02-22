import { AbstractUniformCredentialStore } from './AbstractUniformCredentialStore'
import {
  AddUniformCredentialArgs,
  GetUniformCredentialArgs,
  GetUniformCredentialsArgs,
  RemoveUniformCredentialArgs,
  UpdateUniformCredentialStateArgs,
} from '../types/uniformCredential/IAbstractUniformCredentialStore'
import { OrPromise } from '@sphereon/ssi-types'
import { DataSource, Repository } from 'typeorm'
import Debug from 'debug'
import { UniformCredentialEntity } from '../entities/uniformCredential/UniformCredentialEntity'
import { uniformCredentialEntityFromAddArgs } from '../utils/uniformCredential/MappingUtils'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:credential-store')
export class UniformCredentialStore extends AbstractUniformCredentialStore {
  private readonly dbConnection: OrPromise<DataSource>

  constructor(dbConnection: OrPromise<DataSource>) {
    super()
    this.dbConnection = dbConnection
  }

  addUniformCredential = async (args: AddUniformCredentialArgs): Promise<UniformCredentialEntity> => {
    debug('Adding credential', args)
    const uniformCredentialRepository: Repository<UniformCredentialEntity> = (await this.dbConnection).getRepository(UniformCredentialEntity)
    const credentialEntity: UniformCredentialEntity = uniformCredentialEntityFromAddArgs(args)
    const createdResult: UniformCredentialEntity = await uniformCredentialRepository.save(credentialEntity)
    return Promise.resolve(createdResult)
  }

  getUniformCredential = async (args: GetUniformCredentialArgs): Promise<UniformCredentialEntity> => {
    const result: UniformCredentialEntity | null = await (await this.dbConnection).getRepository(UniformCredentialEntity).findOne({
      where: args,
    })

    if (!result) {
      return Promise.reject(Error(`No credential found for arg: ${args.toString()}`))
    }
    return result
  }

  getUniformCredentials = async (args?: GetUniformCredentialsArgs): Promise<Array<UniformCredentialEntity>> => {
    const result: Array<UniformCredentialEntity> = await (await this.dbConnection).getRepository(UniformCredentialEntity).find({
      ...(args?.filter && { where: args?.filter }),
    })
    if (!result) {
      return Promise.reject(Error(`No credential found for arg: ${args?.toString() ?? undefined}`))
    }
    return result
  }

  removeUniformCredential = async (args: RemoveUniformCredentialArgs): Promise<boolean> => {
    let error = false
    const result = await (
      await this.dbConnection
    )
      .getRepository(UniformCredentialEntity)
      .delete({
        id: args.id,
      })
      .catch((error) => {
        error = true
      })
    error = !result?.affected || result.affected !== 1
    return !error
  }

  updateUniformCredentialState = async (args: UpdateUniformCredentialStateArgs): Promise<UniformCredentialEntity> => {
    const credentialRepository: Repository<UniformCredentialEntity> = (await this.dbConnection).getRepository(UniformCredentialEntity)
    const whereClause: Record<string, any> = {}
    if ('id' in args) {
      whereClause.id = args.id
    }
    if ('hash' in args) {
      whereClause.hash = args.hash
    }
    const credential: UniformCredentialEntity | null = await credentialRepository.findOne({
      where: whereClause,
    })

    if (!credential) {
      return Promise.reject(Error(`No credential found for args: ${whereClause}`))
    }

    const updatedCredential = {
      ...credential,
      lastUpdatedAt: new Date(),
      lastVerifiedState: args.verifiedState,
    }

    debug('Updating credential', credential)
    const updatedResult: UniformCredentialEntity = await credentialRepository.save(updatedCredential, { transaction: true })

    return updatedResult
  }
}
