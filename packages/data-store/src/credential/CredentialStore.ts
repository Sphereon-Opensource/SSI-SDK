import { AbstractCredentialStore } from './AbstractCredentialStore'
import { AddCredentialArgs, GetCredentialArgs, GetCredentialsArgs, RemoveCredentialArgs } from '../types/credential/IAbstractCredentialStore'
import { UniformCredential } from '../types/credential/credential'
import { OrPromise } from '@sphereon/ssi-types'
import { DataSource, Repository } from 'typeorm'
import Debug from 'debug'
import { UniformCredentialEntity } from '../entities/credential/CredentialEntity'
import { PartyEntity } from '../entities/contact/PartyEntity'
import { credentialEntityFrom } from '../utils/credential/MappingUtils'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:credential-store')
export class CredentialStore extends AbstractCredentialStore {
  private readonly dbConnection: OrPromise<DataSource>

  constructor(dbConnection: OrPromise<DataSource>) {
    super()
    this.dbConnection = dbConnection
  }

  addCredential = async (args: AddCredentialArgs): Promise<UniformCredential> => {
    debug('Adding credential', args)
    const uniformCredentialRepository: Repository<UniformCredentialEntity> = (await this.dbConnection).getRepository(UniformCredentialEntity)
    const credentialEntity: UniformCredentialEntity = credentialEntityFrom(args)
    const createdResult: UniformCredentialEntity = await uniformCredentialRepository.save(credentialEntity)
    return Promise.resolve(undefined)
  }

  getCredential = async (args: GetCredentialArgs): Promise<UniformCredential> => {
    const result: UniformCredentialEntity | null = await (await this.dbConnection).getRepository(UniformCredentialEntity).findOne({
      where: args,
    })

    if (!result) {
      return Promise.reject(Error(`No party found for arg: ${args.toString()}`))
    }

    //todo: cast to UniformCredential
    return result
  }

  getCredentials = async (args?: GetCredentialsArgs): Promise<Array<UniformCredential>> => {
    return Promise.resolve(undefined)
  }

  removeCredential = async (args: RemoveCredentialArgs): Promise<void> => {
    return Promise.resolve(undefined)
  }
}
