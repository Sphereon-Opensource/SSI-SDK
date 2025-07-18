import { type OrPromise, StatusListType } from '@sphereon/ssi-types'
import Debug from 'debug'
import { DataSource, In, type Repository } from 'typeorm'
import { BitstringStatusListEntity, OAuthStatusListEntity, StatusList2021Entity, StatusListEntity } from '../entities/statusList/StatusListEntities'
import { StatusListEntryEntity } from '../entities/statusList/StatusList2021EntryEntity'
import { BitstringStatusListEntryEntity } from '../entities/statusList/BitstringStatusListEntryEntity'
import {
  IAddStatusListArgs,
  IAddStatusListEntryArgs,
  IBitstringStatusListEntity,
  IBitstringStatusListEntryEntity,
  IGetStatusListArgs,
  IGetStatusListEntriesArgs,
  IGetStatusListEntryByCredentialIdArgs,
  IGetStatusListEntryByIndexArgs,
  IGetStatusListsArgs,
  IRemoveStatusListArgs,
  IStatusListEntity,
  IStatusListEntryAvailableArgs,
  IStatusListEntryEntity,
  IUpdateStatusListIndexArgs,
} from '../types'
import type { IStatusListStore } from './IStatusListStore'
import { statusListEntityFrom, statusListFrom } from '../utils/statusList/MappingUtils'

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
    const repo = await this.getStatusListEntryRepo(statusList.type)
    const results = (
      await repo.find({
        where: {
          statusListId: statusList.id,
          statusListIndex: In(statusListIndex),
        },
      })
    ).map((index) => index.statusListIndex)
    return statusListIndex.filter((index) => !results.includes(index))
  }

  async addStatusListEntry(args: IAddStatusListEntryArgs): Promise<IStatusListEntryEntity | IBitstringStatusListEntryEntity> {
    if (!args.statusListId) {
      throw new Error('statusListId is required')
    }

    const statusList = await this.getStatusList({ id: args.statusListId })
    return await (await this.getStatusListEntryRepo(statusList.type)).save(args)
  }

  async updateStatusListEntry(args: IAddStatusListEntryArgs): Promise<IStatusListEntryEntity | IBitstringStatusListEntryEntity> {
    const statusListId = args.statusListId
    if (!statusListId) {
      throw new Error('statusListId is required')
    }

    const statusList = await this.getStatusList({ id: statusListId })
    const result = await this.getStatusListEntryByIndex({ ...args, statusListId, errorOnNotFound: false })
    const updatedEntry: Partial<IStatusListEntryEntity> = {
      ...result,
      ...args,
      statusListId,
    }

    const updStatusListId = result?.statusListId ?? statusListId
    const updateResult = await (
      await this.getStatusListEntryRepo(statusList.type)
    ).upsert(
      { ...(result ?? { statusListId: updStatusListId, statusListIndex: args.statusListIndex }), ...updatedEntry },
      { conflictPaths: ['statusList', 'statusListIndex'] },
    )
    debug(updateResult)
    return (await this.getStatusListEntryByIndex({
      ...args,
      statusListId: updStatusListId,
      errorOnNotFound: true,
    }))!
  }

  async getStatusListEntryByIndex({
    statusListId,
    statusListCorrelationId,
    statusListIndex,
    entryCorrelationId,
    errorOnNotFound,
  }: IGetStatusListEntryByIndexArgs): Promise<StatusListEntryEntity | BitstringStatusListEntryEntity | undefined> {
    if (!statusListId && !statusListCorrelationId) {
      throw Error(`Cannot get statusList entry without either a statusList id or statusListCorrelationId`)
    }

    if (!statusListIndex && !entryCorrelationId) {
      throw Error(`Cannot get statusList entry without either a statusListIndex or entryCorrelationId`)
    }

    const statusList = statusListId
      ? await this.getStatusList({ id: statusListId })
      : await this.getStatusList({ correlationId: statusListCorrelationId })

    const result = await (
      await this.getStatusListEntryRepo(statusList.type)
    ).findOne({
      where: {
        ...(statusListId && { statusListId }),
        ...(!statusListId && statusListCorrelationId && { statusList: { correlationId: statusListCorrelationId } }),
        ...(statusListIndex && { statusListIndex }),
        ...(entryCorrelationId && { entryCorrelationId }),
      },
      relations: {
        statusList: true,
      },
    })

    if (!result && errorOnNotFound) {
      throw Error(`Could not find status list entry with provided filters`)
    }

    return result ?? undefined
  }

  async getStatusListEntryByCredentialId(
    args: IGetStatusListEntryByCredentialIdArgs,
  ): Promise<StatusListEntryEntity | BitstringStatusListEntryEntity | undefined> {
    const credentialId = args.credentialId
    if (!credentialId) {
      throw Error('Can only get a credential by credentialId when a credentialId is supplied')
    }
    const statusList = await this.getStatusList({
      id: args.statusListId,
      correlationId: args.statusListCorrelationId,
    })
    const where = {
      statusList: { id: statusList.id },
      ...(args.entryCorrelationId && { correlationId: args.entryCorrelationId }),
      credentialId,
    }
    debug(`Entries: ${JSON.stringify(await (await this.getStatusListEntryRepo(statusList.type)).find(), null, 2)}`)
    const result = await (await this.getStatusListEntryRepo(statusList.type)).findOne({ where })

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
      const statusList = await this.getStatusList({
        id: args.statusListId,
        correlationId: args.statusListCorrelationId,
      })
      const result = await (
        await this.getStatusListEntryRepo(statusList.type)
      ).delete({
        ...(args.statusListId && { statusList: args.statusListId }),
        ...(args.entryCorrelationId && { correlationId: args.entryCorrelationId }),
        credentialId: args.credentialId,
      })
      error = !result.affected || result.affected !== 1
    }
    return !error
  }

  async removeStatusListEntryByIndex(args: IGetStatusListEntryByIndexArgs): Promise<boolean> {
    let error = false
    try {
      await this.getStatusListEntryByIndex(args)
    } catch (error) {
      error = true
    }
    if (error) {
      console.error(`Could not delete statusList ${args.statusListId} entry by index ${args.statusListIndex}`)
    } else {
      const statusList = await this.getStatusList({ id: args.statusListId })
      const result = await (
        await this.getStatusListEntryRepo(statusList.type)
      ).delete({
        ...(args.statusListId && { statusList: args.statusListId }),
        ...(args.entryCorrelationId && { correlationId: args.entryCorrelationId }),
        statusListIndex: args.statusListIndex,
      })
      error = !result.affected || result.affected !== 1
    }
    return !error
  }

  async getStatusListEntries(args: IGetStatusListEntriesArgs): Promise<Array<IStatusListEntryEntity | IBitstringStatusListEntryEntity>> {
    const statusList = await this.getStatusList({ id: args.statusListId })
    const results = await (
      await this.getStatusListEntryRepo(statusList.type)
    ).find({
      where: { ...args?.filter, statusList: args.statusListId },
    })
    return results as Array<IStatusListEntryEntity | IBitstringStatusListEntryEntity>
  }

  private async getStatusListEntity(args: IGetStatusListArgs): Promise<StatusListEntity> {
    if (!args.id && !args.correlationId) {
      throw Error(`At least and 'id' or 'correlationId' needs to be provided to lookup a status list`)
    }
    const where = []
    if (args.id) {
      where.push({ id: args.id })
    } else if (args.correlationId) {
      where.push({ correlationId: args.correlationId })
    }
    const result = await (await this.getStatusListRepo()).findOne({ where })
    if (!result) {
      throw Error(`No status list found for id ${args.id}`)
    }
    return result
  }

  async getStatusList(args: IGetStatusListArgs): Promise<IStatusListEntity | IBitstringStatusListEntity> {
    const entity = await this.getStatusListEntity(args)
    return statusListFrom(entity) as IStatusListEntity | IBitstringStatusListEntity
  }

  async getStatusLists(args: IGetStatusListsArgs): Promise<Array<IStatusListEntity | IBitstringStatusListEntity>> {
    const result = await (
      await this.getStatusListRepo()
    ).find({
      where: args.filter,
    })

    if (!result) {
      return []
    }

    return result.map((entity) => statusListFrom(entity) as IStatusListEntity | IBitstringStatusListEntity)
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
    const entity = statusListEntityFrom(args)
    const createdResult = await (await this.getStatusListRepo(args.type)).save(entity)
    return statusListFrom(createdResult)
  }

  async updateStatusList(args: IUpdateStatusListIndexArgs): Promise<IStatusListEntity | IBitstringStatusListEntity> {
    const result = await this.getStatusList(args)
    debug('Updating status list', result)
    const entity = statusListEntityFrom(args)
    const updatedResult = await (await this.getStatusListRepo(args.type)).save(entity, { transaction: true })
    return statusListFrom(updatedResult)
  }

  async removeStatusList(args: IRemoveStatusListArgs): Promise<boolean> {
    const result = await this.getStatusListEntity(args)

    await (await this.getStatusListEntryRepo(result.type)).delete({ statusListId: result.id })
    const deletedEntity = await (await this.getStatusListRepo()).remove(result)

    return Boolean(deletedEntity)
  }

  private async getDS(): Promise<DataSource> {
    return this._dbConnection
  }

  async getStatusListRepo(type?: StatusListType): Promise<Repository<StatusListEntity>> {
    const dataSource = await this.getDS()
    switch (type) {
      case StatusListType.StatusList2021:
        return dataSource.getRepository(StatusList2021Entity)
      case StatusListType.OAuthStatusList:
        return dataSource.getRepository(OAuthStatusListEntity)
      case StatusListType.BitstringStatusList:
        return dataSource.getRepository(BitstringStatusListEntity)
      default:
        return dataSource.getRepository(StatusListEntity)
    }
  }

  async getStatusListEntryRepo(type?: StatusListType): Promise<Repository<StatusListEntryEntity | BitstringStatusListEntryEntity>> {
    const dataSource = await this.getDS()
    switch (type) {
      case StatusListType.BitstringStatusList:
        return dataSource.getRepository(BitstringStatusListEntryEntity)
      default:
        return dataSource.getRepository(StatusListEntryEntity)
    }
  }
}
