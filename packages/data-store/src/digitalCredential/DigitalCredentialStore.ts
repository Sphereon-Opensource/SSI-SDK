import {
  AbstractDigitalCredentialStore,
  AddCredentialArgs,
  CredentialStateType,
  DigitalCredential,
  GetCredentialArgs,
  GetCredentialsArgs,
  GetCredentialsResponse,
  NonPersistedDigitalCredential,
  RemoveCredentialArgs,
  UpdateCredentialArgs,
  UpdateCredentialStateArgs,
} from '@sphereon/ssi-sdk.data-store-types'
import { CredentialRole, OrPromise } from '@sphereon/ssi-types'
import Debug from 'debug'
import { DataSource, type FindOptionsOrder, type FindOptionsWhere, Repository } from 'typeorm'

import {
  digitalCredentialFrom,
  digitalCredentialsFrom,
  nonPersistedDigitalCredentialEntityFromAddArgs,
  persistedDigitalCredentialEntityFromStateArgs,
  persistedDigitalCredentialEntityFromUpdateArgs,
} from '../../src'
import { DigitalCredentialEntity } from '../entities/digitalCredential/DigitalCredentialEntity'
import { parseAndValidateOrderOptions } from '../utils/SortingUtils'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:credential-store')

export class DigitalCredentialStore extends AbstractDigitalCredentialStore {
  private readonly dbConnection: OrPromise<DataSource>
  private dcRepo: Repository<DigitalCredentialEntity> | undefined

  constructor(dbConnection: OrPromise<DataSource>) {
    super()
    this.dbConnection = dbConnection
  }

  addCredential = async (args: AddCredentialArgs): Promise<DigitalCredential> => {
    debug('Adding credential', args)
    const credentialEntity: NonPersistedDigitalCredential = nonPersistedDigitalCredentialEntityFromAddArgs(args)
    const validationError = this.assertValidDigitalCredential(credentialEntity)
    if (validationError) {
      return Promise.reject(validationError)
    }
    const dcRepo = await this.getRepository()
    const createdResult: DigitalCredentialEntity = await dcRepo.save(credentialEntity as any)
    return Promise.resolve(digitalCredentialFrom(createdResult))
  }

  getCredential = async (args: GetCredentialArgs): Promise<DigitalCredential> => {
    const dcRepo = await this.getRepository()
    const result: DigitalCredentialEntity | null = await dcRepo.findOne({
      where: args,
    })

    if (!result) {
      return Promise.reject(Error(`No credential found for arg: ${JSON.stringify(args)}`))
    }
    return digitalCredentialFrom(result)
  }

  getCredentials = async (args?: GetCredentialsArgs): Promise<GetCredentialsResponse> => {
    const { filter = {}, offset, limit, order = 'createdAt.asc' } = args ?? {}
    const sortOptions: FindOptionsOrder<DigitalCredentialEntity> =
      order && typeof order === 'string'
        ? parseAndValidateOrderOptions<DigitalCredentialEntity>(order)
        : <FindOptionsOrder<DigitalCredentialEntity>>order
    const dcRepo = await this.getRepository()
    const [result, total] = await dcRepo.findAndCount({
      where: filter,
      skip: offset,
      take: limit,
      order: sortOptions,
    })
    return {
      data: digitalCredentialsFrom(result),
      total,
    }
  }

  updateCredential = async (args: UpdateCredentialArgs): Promise<DigitalCredential> => {
    const dcRepo = await this.getRepository()
    const whereClause: Record<string, any> = {}

    if ('id' in args) {
      whereClause.id = args.id
    } else if ('hash' in args) {
      whereClause.hash = args.hash
    } else {
      return Promise.reject(Error('No id or hash param is provided.'))
    }

    const credential: DigitalCredentialEntity | null = await dcRepo.findOne({
      where: whereClause,
    })

    if (!credential) {
      return Promise.reject(Error(`No credential found for args: ${JSON.stringify(whereClause)}`))
    }

    // Extract updates by removing the identifier fields
    const updates = Object.fromEntries(Object.entries(args).filter(([key]) => key !== 'id' && key !== 'hash')) as Partial<DigitalCredential>

    const entityToSave = persistedDigitalCredentialEntityFromUpdateArgs(credential, updates)

    const validationError = this.assertValidDigitalCredential(entityToSave)
    if (validationError) {
      return Promise.reject(validationError)
    }

    debug('Updating credential', entityToSave)
    const updatedResult = await dcRepo.save(entityToSave as any, { transaction: true })
    return digitalCredentialFrom(updatedResult)
  }

  removeCredential = async (args: RemoveCredentialArgs): Promise<boolean> => {
    if (!args) {
      return false
    }

    const query: FindOptionsWhere<DigitalCredentialEntity> = {}

    if ('id' in args) {
      query.id = args.id
    } else if ('hash' in args) {
      query.hash = args.hash
    } else {
      return false
    }
    try {
      const dcRepo = await this.getRepository()
      // TODO create a flag whether we want to delete recursively or return an error when there are child credentials?
      const affected = await this.deleteTree(dcRepo, query)
      return affected > 0
    } catch (error) {
      console.error('Error removing digital credential:', error)
      return false
    }
  }

  private async deleteTree(dcRepo: Repository<DigitalCredentialEntity>, query: FindOptionsWhere<DigitalCredentialEntity>): Promise<number> {
    let affected: number = 0
    const findResult = await dcRepo.findBy(query)
    for (const dc of findResult) {
      affected += await this.deleteTree(dcRepo, { parentId: dc.id })
      const result = await dcRepo.delete(dc.id)
      if (result.affected) {
        affected += result.affected
      }
    }
    return affected
  }

  private async getRepository(): Promise<Repository<DigitalCredentialEntity>> {
    if (this.dcRepo !== undefined) {
      return Promise.resolve(this.dcRepo)
    }
    this.dcRepo = (await this.dbConnection).getRepository(DigitalCredentialEntity)
    if (this.dcRepo === undefined) {
      return Promise.reject(Error('Could not get DigitalCredentialEntity repository'))
    }
    return this.dcRepo
  }

  updateCredentialState = async (args: UpdateCredentialStateArgs): Promise<DigitalCredential> => {
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
      return Promise.reject(Error(`No credential found for args: ${JSON.stringify(whereClause)}`))
    }

    // Create entity with state updates applied
    const entityToSave = persistedDigitalCredentialEntityFromStateArgs(credential, args)

    debug('Updating credential state', entityToSave)
    const updatedResult: DigitalCredentialEntity = await credentialRepository.save(entityToSave as any, { transaction: true })
    return digitalCredentialFrom(updatedResult)
  }

  private assertValidDigitalCredential(credentialEntity: NonPersistedDigitalCredential | DigitalCredentialEntity): Error | undefined {
    const { kmsKeyRef, identifierMethod, credentialRole, isIssuerSigned } = credentialEntity

    const isRoleInvalid = credentialRole === CredentialRole.ISSUER || (credentialRole === CredentialRole.HOLDER && !isIssuerSigned)

    if (isRoleInvalid && (!kmsKeyRef || !identifierMethod)) {
      const missingFields = []

      if (!kmsKeyRef) missingFields.push('kmsKeyRef')
      if (!identifierMethod) missingFields.push('identifierMethod')

      const fields = missingFields.join(' and ')
      return new Error(
        `DigitalCredential field(s) ${fields} is/are required for credential role ${credentialRole} with isIssuerSigned=${isIssuerSigned}.`,
      )
    }

    return undefined
  }
}
