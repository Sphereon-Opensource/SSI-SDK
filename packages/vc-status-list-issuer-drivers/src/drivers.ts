/**
 * StatusList Driver Implementation for TypeORM/Agent Data Sources
 *
 * This module provides the database-backed implementation of the IStatusListDriver interface,
 * handling persistence and retrieval of status list credentials and entries using TypeORM.
 * It delegates status list format-specific operations to the functions layer while managing
 * database interactions, driver configuration, and entity lifecycle.
 *
 * Key responsibilities:
 * - Database connection and store management
 * - Status list CRUD operations
 * - Status list entry management
 * - Random index generation for new entries
 * - Integration with multiple data sources
 *
 * @author Sphereon International B.V.
 * @since 2024
 */

import { DataSources } from '@sphereon/ssi-sdk.agent-config'
import {
  BitstringStatusListEntryCredentialStatus,
  IAddStatusListArgs,
  IAddStatusListEntryArgs,
  IBitstringStatusListEntryEntity,
  IGetStatusListEntryByCredentialIdArgs,
  IGetStatusListEntryByIndexArgs,
  IStatusListEntryEntity,
  StatusListEntity,
  StatusListStore,
} from '@sphereon/ssi-sdk.data-store'
import {
  createCredentialStatusFromStatusList,
  extractCredentialDetails,
  StatusList2021EntryCredentialStatus,
  StatusListOAuthEntryCredentialStatus,
  StatusListResult,
  toStatusListDetails,
} from '@sphereon/ssi-sdk.vc-status-list'
import { StatusListCredential, StatusListCredentialIdMode, StatusListDriverType, StatusListType } from '@sphereon/ssi-types'
import { DataSource } from 'typeorm'
import { IStatusListDriver } from './types'
import { statusListResultToEntity } from './status-list-adapters'

export interface StatusListManagementOptions {
  id?: string
  correlationId?: string
  driverType: StatusListDriverType
  driverOptions?: DriverOptions
}

export type DriverOptions = TypeORMOptions

export interface TypeORMOptions {
  dbName?: string
}

export interface FilesystemOptions {
  path: string // The base path where statusList Credentials will be persisted. Should be a folder and thus not include the VC/StatusList itself
}

export function getOptions(args: { id?: string; correlationId?: string; dbName: string }): StatusListManagementOptions {
  return {
    id: args.id,
    correlationId: args.correlationId,
    driverType: StatusListDriverType.AGENT_TYPEORM,
    driverOptions: { dbName: args.dbName },
  }
}

export async function getDriver(args: {
  id?: string
  correlationId?: string
  dbName?: string
  dataSource?: DataSource
  dataSources?: DataSources
}): Promise<IStatusListDriver> {
  const dbName = args.dbName ?? args.dataSource?.name
  if (!dbName) {
    throw Error(`Please provide either a DB name or data source`)
  }
  const dataSources = args.dataSources ?? DataSources.singleInstance()
  return await AgentDataSourceStatusListDriver.init(
    getOptions({
      ...args,
      dbName,
    }),
    { dataSource: args.dataSource ?? (await dataSources.getDbConnection(dbName)), dataSources },
  )
}

/**
 * TypeORM-based implementation of the IStatusListDriver interface
 *
 * Manages status list credentials and entries using a TypeORM data source.
 * Handles database operations while delegating format-specific logic to the functions layer.
 */
export class AgentDataSourceStatusListDriver implements IStatusListDriver {
  private _statusListLength: number | undefined

  constructor(
    private _dataSource: DataSource,
    private _statusListStore: StatusListStore,
    private options: StatusListManagementOptions,
  ) {}

  public static async init(
    options: StatusListManagementOptions,
    dbArgs?: {
      dataSources?: DataSources
      dataSource?: DataSource
    },
  ): Promise<AgentDataSourceStatusListDriver> {
    if (options.driverType !== StatusListDriverType.AGENT_TYPEORM) {
      throw Error(`TypeORM driver can only be used when the TypeORM driver type is selected in the configuration. Got: ${options.driverType}`)
    } else if (!options.driverOptions) {
      throw Error(`TypeORM driver can only be used when the TypeORM options are provided.`)
    }
    let dataSource: DataSource
    let statusListStore: StatusListStore
    if (dbArgs?.dataSource) {
      dataSource = dbArgs.dataSource
    } else if (options.driverOptions.dbName) {
      if (dbArgs?.dataSources) {
        dataSource = await dbArgs.dataSources.getDbConnection(options.driverOptions.dbName)
      } else {
        dataSource = await DataSources.singleInstance().getDbConnection(options.driverOptions.dbName)
      }
    } else {
      return Promise.reject(Error(`Either a datasource or dbName needs to be provided`))
    }

    statusListStore = new StatusListStore(dataSource)
    return new AgentDataSourceStatusListDriver(dataSource, statusListStore, options)
  }

  get dataSource(): DataSource {
    if (!this._dataSource) {
      throw Error(`Datasource not available yet for ${this.options.driverOptions?.dbName}`)
    }
    return this._dataSource
  }

  get statusListStore(): StatusListStore {
    if (!this._statusListStore) {
      this._statusListStore = new StatusListStore(this.dataSource)
    }
    return this._statusListStore
  }

  getOptions(): DriverOptions {
    return this.options.driverOptions ?? {}
  }

  getType(): StatusListDriverType {
    return this.options.driverType
  }

  async createStatusList(args: {
    statusListType: StatusListType
    statusListCredential: StatusListCredential
    correlationId?: string
    credentialIdMode?: StatusListCredentialIdMode
    bitsPerStatus?: number
  }): Promise<StatusListResult> {
    const correlationId = args.correlationId ?? this.options.correlationId
    if (!correlationId) {
      throw Error('Either a correlationId needs to be set as an option, or it needs to be provided when creating a status list. None found')
    }
    const credentialIdMode = args.credentialIdMode ?? StatusListCredentialIdMode.ISSUANCE

    // Convert credential to implementation details using CREATE/READ context
    const implementationResult = await toStatusListDetails({
      statusListCredential: args.statusListCredential,
      statusListType: args.statusListType,
      bitsPerStatus: args.bitsPerStatus,
      correlationId,
      driverType: this.getType(),
    })

    // Add driver-specific fields to create complete entity
    const statusListArgs = {
      ...implementationResult,
      credentialIdMode,
      correlationId,
      driverType: this.getType(),
    } as IAddStatusListArgs

    await this.statusListStore.addStatusList(statusListArgs)
    this._statusListLength = implementationResult.length
    return implementationResult
  }

  async updateStatusList(args: { statusListCredential: StatusListCredential; correlationId: string }): Promise<StatusListResult> {
    const correlationId = args.correlationId ?? this.options.correlationId

    const extractedDetails = await extractCredentialDetails(args.statusListCredential)
    const entity = await this.statusListStore.getStatusList({
      id: extractedDetails.id,
      correlationId,
    })
    if (!entity) {
      throw Error(`Status list ${extractedDetails.id}, correlationId ${correlationId} could not be found`)
    }

    entity.statusListCredential = args.statusListCredential

    const details = await toStatusListDetails({
      extractedDetails,
      statusListEntity: entity,
    })

    // Merge details with existing entity and driver properties
    const updateArgs = {
      ...entity,
      ...details,
      correlationId,
      driverType: this.getType(),
    } as IAddStatusListArgs

    await this.statusListStore.updateStatusList(updateArgs)
    this._statusListLength = details.length
    return { ...entity, ...details }
  }

  async deleteStatusList(): Promise<boolean> {
    await this.statusListStore.removeStatusList({ id: this.options.id, correlationId: this.options.correlationId })
    return Promise.resolve(true)
  }

  async updateStatusListEntry(args: IAddStatusListEntryArgs): Promise<{
    credentialStatus: StatusList2021EntryCredentialStatus | StatusListOAuthEntryCredentialStatus | BitstringStatusListEntryCredentialStatus
    statusListEntry: IStatusListEntryEntity | IBitstringStatusListEntryEntity
  }> {
    // Get status list entity
    const statusListEntity: StatusListEntity = statusListResultToEntity(await this.getStatusList())

    // Update the entry in the store
    const statusListEntry = await this.statusListStore.updateStatusListEntry({ ...args, statusListId: statusListEntity.id })

    // Use implementation to create the credential status - this moves type-specific logic to implementations
    const credentialStatus = await createCredentialStatusFromStatusList({
      statusList: statusListEntity,
      statusListEntry,
      statusListIndex: statusListEntry.statusListIndex,
    })

    return {
      credentialStatus,
      statusListEntry,
    }
  }

  async getStatusListEntryByCredentialId(
    args: IGetStatusListEntryByCredentialIdArgs,
  ): Promise<IStatusListEntryEntity | IBitstringStatusListEntryEntity | undefined> {
    return await this.statusListStore.getStatusListEntryByCredentialId(args)
  }

  async getStatusListEntryByIndex(
    args: IGetStatusListEntryByIndexArgs,
  ): Promise<IStatusListEntryEntity | IBitstringStatusListEntryEntity | undefined> {
    return await this.statusListStore.getStatusListEntryByIndex(args)
  }

  async getRandomNewStatusListIndex(args?: { correlationId?: string }): Promise<number> {
    let result = -1
    let tries = 0
    while (result < 0) {
      // no tries guard, because we will throw an error when they are exhausted anyway
      result = await this.getRandomNewStatusListIndexImpl(tries++, args)
    }
    return result
  }

  private async getRandomNewStatusListIndexImpl(tries: number, args?: { correlationId?: string }): Promise<number> {
    const statusListId = this.options.id
    const correlationId = args?.correlationId ?? this.options.correlationId
    if (tries >= 10) {
      throw Error(`We could not find any random status list index that is available in the statuslist ${statusListId}`)
    }
    // TODO: Check against DB
    const length = await this.getStatusListLength(args)
    const statusListIndex = Array.from({ length: 20 }, () => Math.floor(Math.random() * length))
    const available = await this.statusListStore.availableStatusListEntries({
      statusListId,
      ...(correlationId && { correlationId }),
      statusListIndex,
    })
    if (available.length > 0) {
      return available[0] // doesn't matter we pick the first element, as they are all random anyway
    }
    return -1
  }

  async getStatusListLength(args?: { correlationId?: string }): Promise<number> {
    if (!this._statusListLength) {
      this._statusListLength = await this.getStatusList(args).then((details) => details.length)
    }
    return this._statusListLength!
  }

  async getStatusList(args?: { correlationId?: string }): Promise<StatusListResult> {
    const id = this.options.id
    const correlationId = args?.correlationId ?? this.options.correlationId

    const statusListEntity = await this.statusListStore.getStatusList({ id, correlationId })

    // Convert entity to result using CREATE/READ context
    return await toStatusListDetails({
      statusListCredential: statusListEntity.statusListCredential!,
      statusListType: statusListEntity.type,
      bitsPerStatus: statusListEntity.bitsPerStatus,
      correlationId: statusListEntity.correlationId,
      driverType: statusListEntity.driverType,
    })
  }

  async getStatusLists(): Promise<Array<StatusListResult>> {
    const statusLists = await this.statusListStore.getStatusLists({})
    return Promise.all(
      statusLists.map(async (statusListEntity) => {
        return toStatusListDetails({
          statusListCredential: statusListEntity.statusListCredential!,
          statusListType: statusListEntity.type,
          bitsPerStatus: statusListEntity.bitsPerStatus,
          correlationId: statusListEntity.correlationId,
          driverType: statusListEntity.driverType,
        })
      }),
    )
  }

  isStatusListIndexInUse(): Promise<boolean> {
    return Promise.resolve(false)
  }
}
