import { OrPromise } from '@sphereon/ssi-types'
import Debug from 'debug'
import { DataSource, In, Repository } from 'typeorm'
import { StatusListEntity } from '../entities/statusList2021/StatusList2021Entity'
import { StatusListEntryEntity } from '../entities/statusList2021/StatusList2021EntryEntity'
import {
  IAddStatusListArgs,
  IAddStatusListEntryArgs,
  IGetStatusListArgs,
  IGetStatusListEntriesArgs,
  IGetStatusListEntryByCredentialIdArgs,
  IGetStatusListEntryByIndexArgs,
  IGetStatusListsArgs,
  IRemoveStatusListArgs,
  IStatusListEntryAvailableArgs,
  IUpdateStatusListIndexArgs,
  IStatusListEntity,
  IStatusListEntryEntity,
} from '../types'
import { IStatusListStore } from './IStatusListStore'

const debug = Debug('sphereon:ssi-sdk:data-store:status-list')

export class StatusListStore implements IStatusListStore {
  private readonly _dbConnection: OrPromise<DataSource>

  constructor(dbConnection: OrPromise<DataSource>) {
    this._dbConnection = dbConnection
  }

  /**
   * Gets the available status list indices from the provided indices. Meaning it will filter out any index that is already known.
   *
   * The idea is that the caller provides a set of random status list indices. We can relatively easy check against the DB in an optimized way.
   * If the status list is large it is probably best to also provide at least a good number of indices. So something like 10 or 20 values.
   * Callers are also expected to call this function multiple times if it does not yield results
   *
   * @param args
   */
  async availableStatusListEntries(args: IStatusListEntryAvailableArgs): Promise<number[]> {
    const statusListIndex = Array.isArray(args.statusListIndex) ? args.statusListIndex : [args.statusListIndex]
    const statusList = await this.getStatusList({ ...args, id: args.statusListId })
    const repo = await this.getStatusListEntryRepo()
    const results = (
      await repo.find({
        where: {
          statusList,
          statusListIndex: In(statusListIndex),
        },
      })
    ).map((index) => index.statusListIndex)
    return statusListIndex.filter((index) => !results.includes(index))
  }

  async addStatusListEntry(args: IAddStatusListEntryArgs): Promise<IStatusListEntryEntity> {
    return (await this.getStatusListEntryRepo()).save(args)
  }

  async updateStatusListEntry(args: IAddStatusListEntryArgs): Promise<IStatusListEntryEntity> {
    const statusListId = typeof args.statusList === 'string' ? args.statusList : args.statusList.id
    const result = await this.getStatusListEntryByIndex({ ...args, statusListId, errorOnNotFound: false })
    const updatedEntry: Partial<IStatusListEntryEntity> = {
      value: args.value,
      correlationId: args.correlationId,
      credentialHash: args.credentialHash,
      credentialId: args.credentialId,
    }

    const updateResult = await (
      await this.getStatusListEntryRepo()
    ).upsert(
      { ...(result ?? { statusList: args.statusList, statusListIndex: args.statusListIndex }), ...updatedEntry },
      { conflictPaths: ['statusList', 'statusListIndex'] },
    )
    console.log(updateResult)
    return (await this.getStatusListEntryByIndex({ ...args, statusListId, errorOnNotFound: true })) as IStatusListEntryEntity
  }

  async getStatusListEntryByIndex(args: IGetStatusListEntryByIndexArgs): Promise<StatusListEntryEntity | undefined> {
    if (!args.statusListId && !args.correlationId) {
      throw Error(`Cannot get statusList entry if not either a statusList id or correlationId is provided`)
    }
    const result = await (
      await this.getStatusListEntryRepo()
    ).findOne({
      where: {
        ...(args.statusListId && { statusList: args.statusListId }),
        ...(args.correlationId && { correlationId: args.correlationId }),
        statusListIndex: args.statusListIndex,
      },
    })

    if (!result && args.errorOnNotFound) {
      throw Error(`Could not find status list index ${args.statusListIndex} for status list id ${args.statusListId}`)
    }
    return result ?? undefined
  }

  async removeStatusListEntryByIndex(args: IGetStatusListEntryByIndexArgs): Promise<boolean> {
    let error = false
    try {
      await this.getStatusListEntryByIndex(args) // only used to check it exists
    } catch (error) {
      error = true
    }
    if (error) {
      console.log(`Could not delete statusList ${args.statusListId} entry by index ${args.statusListIndex}`)
    } else {
      const result = await (
        await this.getStatusListEntryRepo()
      ).delete({
        ...(args.statusListId && { statusList: args.statusListId }),
        ...(args.correlationId && { correlationId: args.correlationId }),
        statusListIndex: args.statusListIndex,
      })
      error = !result.affected || result.affected !== 1
    }
    return !error
  }

  async getStatusListEntryByCredentialId(args: IGetStatusListEntryByCredentialIdArgs): Promise<StatusListEntryEntity | undefined> {
    const credentialId = args.credentialId
    if (!credentialId) {
      throw Error('Can only get a credential by credentialId when a credentialId is supplied')
    }
    const statusList = await this.getStatusList({ id: args.statusListId, correlationId: args.statusListCorrelationId })
    const where = {
      statusList: statusList.id,
      ...(args.entryCorrelationId && { correlationId: args.entryCorrelationId }),
      credentialId,
    }
    console.log(`Entries: ${JSON.stringify(await (await this.getStatusListEntryRepo()).find(), null, 2)}`)
    const result = await (await this.getStatusListEntryRepo()).findOne({ where })

    if (!result && args.errorOnNotFound) {
      throw Error(`Could not find status list credential id ${credentialId} for status list id ${statusList.id}`)
    }
    return result ?? undefined
  }

  async removeStatusListEntryByCredentialId(args: IGetStatusListEntryByCredentialIdArgs): Promise<boolean> {
    let error = false
    try {
      await this.getStatusListEntryByCredentialId(args) // only used to check it exists
    } catch (error) {
      error = true
    }
    if (!error) {
      const result = await (
        await this.getStatusListEntryRepo()
      ).delete({
        ...(args.statusListId && { statusList: args.statusListId }),
        ...(args.entryCorrelationId && { correlationId: args.entryCorrelationId }),
        credentialId: args.credentialId,
      })
      error = !result.affected || result.affected !== 1
    }
    return !error
  }

  async getStatusListEntries(args: IGetStatusListEntriesArgs): Promise<StatusListEntryEntity[]> {
    return (await this.getStatusListEntryRepo()).find({ where: { ...args?.filter, statusList: args.statusListId } })
  }

  async getStatusList(args: IGetStatusListArgs): Promise<IStatusListEntity> {
    if (!args.id && !args.correlationId) {
      throw Error(`At least and 'id' or 'correlationId' needs to be provided to lookup a status list`)
    }
    const where = []
    if (args.id) {
      where.push({ id: args.id })
    } else if (args.correlationId) {
      where.push({ correlationId: args.correlationId })
    }
    const result = await (await this.getStatusListRepo()).findOne({where})
    if (!result) {
      throw Error(`No status list found for id ${args.id}`)
    }
    return result
  }

  async getStatusLists(args: IGetStatusListsArgs): Promise<Array<IStatusListEntity>> {
    const result = await (
      await this.getStatusListRepo()
    ).find({
      where: args.filter,
    })

    if (!result) {
      return []
    }
    return result
  }

  async addStatusList(args: IAddStatusListArgs): Promise<IStatusListEntity> {
    const { id, correlationId } = args

    const result = await (
      await this.getStatusListRepo()
    ).findOne({
      where: [{ id }, { correlationId }],
    })
    if (result) {
      throw Error(`Status list for id ${id}, correlationId ${correlationId} already exists`)
    }

    debug('Adding status list ', id)
    const createdResult = await (await this.getStatusListRepo()).save(args)

    return createdResult
  }

  async updateStatusList(args: IUpdateStatusListIndexArgs): Promise<IStatusListEntity> {
    const result = await this.getStatusList(args)
    debug('Updating status list', result)
    const updatedResult = await (await this.getStatusListRepo()).save(args, { transaction: true })
    return updatedResult
  }

  async removeStatusList(args: IRemoveStatusListArgs): Promise<void> {
    const result = await this.getStatusList(args)
    await (await this.getStatusListRepo()).delete(result)
  }

  private async getDS(): Promise<DataSource> {
    return this._dbConnection
  }

  async getStatusListRepo(): Promise<Repository<StatusListEntity>> {
    return (await this.getDS()).getRepository(StatusListEntity)
  }

  async getStatusListEntryRepo(): Promise<Repository<StatusListEntryEntity>> {
    return (await this.getDS()).getRepository(StatusListEntryEntity)
  }
}
