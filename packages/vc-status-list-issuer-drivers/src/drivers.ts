import { DataSources } from '@sphereon/ssi-sdk.agent-config'
import {
  IAddStatusListEntryArgs,
  IGetStatusListEntryByCredentialIdArgs,
  IGetStatusListEntryByIndexArgs,
  IStatusListEntity,
  IStatusListEntryEntity,
  StatusListStore
} from '@sphereon/ssi-sdk.data-store'
import {
  StatusList2021EntryCredentialStatus,
  statusListCredentialToDetails,
  StatusListDetails
} from '@sphereon/ssi-sdk.vc-status-list'
import { OriginalVerifiableCredential, StatusListCredentialIdMode, StatusListDriverType } from '@sphereon/ssi-types'
import { DataSource } from 'typeorm'
import { IStatusListDriver } from './types'

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
    driverOptions: { dbName: args.dbName }
  }
}

export async function getDriver(args: {
  id?: string;
  correlationId?: string;
  dbName?: string,
  dataSource?: DataSource,
  dataSources?: DataSources
}): Promise<IStatusListDriver> {
  const dbName = args.dbName ?? args.dataSource?.name
  if (!dbName) {
    throw Error(`Please provide either a DB name or data source`)
  }
  const dataSources = args.dataSources ?? DataSources.singleInstance()
  return await AgentDataSourceStatusListDriver.init(getOptions({
    ...args,
    dbName
  }), { dataSource: args.dataSource ?? await dataSources.getDbConnection(dbName), dataSources })
}

export class AgentDataSourceStatusListDriver implements IStatusListDriver {
  private _statusListLength: number | undefined

  constructor(
    private _dataSource: DataSource,
    private _statusListStore: StatusListStore,
    private options: StatusListManagementOptions
  ) {
  }

  public static async init(
    options: StatusListManagementOptions,
    dbArgs?: {
      dataSources?: DataSources
      dataSource?: DataSource
    }
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
    statusListCredential: OriginalVerifiableCredential
    correlationId?: string
    credentialIdMode?: StatusListCredentialIdMode
  }): Promise<StatusListDetails> {
    const correlationId = args.correlationId ?? this.options.correlationId
    if (!correlationId) {
      throw Error('Either a correlationId needs to be set as an option, or it needs to be provided when creating a status list. None found')
    }
    const credentialIdMode = args.credentialIdMode ?? StatusListCredentialIdMode.ISSUANCE
    const details = await statusListCredentialToDetails({ ...args, correlationId, driverType: this.getType() })
    const entity = await (
      await this.statusListStore.getStatusListRepo()
    ).findOne({
      where: [
        {
          id: details.id
        },
        {
          correlationId
        }
      ]
    })
    if (entity) {
      throw Error(`Status list ${details.id}, correlationId ${args.correlationId} already exists`)
    }
    this._statusListLength = details.length
    await this.statusListStore.addStatusList({
      ...details,
      credentialIdMode,
      correlationId,
      driverType: this.getType()
    })
    return details
  }

  async updateStatusList(args: {
    statusListCredential: OriginalVerifiableCredential;
    correlationId: string
  }): Promise<StatusListDetails> {
    const correlationId = args.correlationId ?? this.options.correlationId
    const details = await statusListCredentialToDetails({ ...args, correlationId, driverType: this.getType() })
    const entity = await (
      await this.statusListStore.getStatusListRepo()
    ).findOne({
      where: [
        {
          id: details.id
        },
        {
          correlationId
        }
      ]
    })
    if (!entity) {
      throw Error(`Status list ${details.id}, correlationId ${args.correlationId} could not be found`)
    }
    await this.statusListStore.updateStatusList({
      ...entity,
      ...details,
      correlationId,
      driverType: this.getType()
    })
    this._statusListLength = details.length
    return { ...entity, ...details }
  }

  async deleteStatusList(): Promise<boolean> {
    await this.statusListStore.removeStatusList({ id: this.options.id, correlationId: this.options.correlationId })
    return Promise.resolve(true)
  }

  async updateStatusListEntry(args: IAddStatusListEntryArgs): Promise<{
    credentialStatus: StatusList2021EntryCredentialStatus
    statusListEntry: IStatusListEntryEntity
  }> {
    const statusList = typeof args.statusList === 'string' ? await this.getStatusList() : args.statusList

    const statusListEntry = await this.statusListStore.updateStatusListEntry({ ...args, statusList: statusList.id })
    const credentialStatus: StatusList2021EntryCredentialStatus = {
      id: `${statusList.id}#${statusListEntry.statusListIndex}`,
      type: 'StatusList2021Entry',
      statusPurpose: statusList.statusPurpose ?? 'revocation',
      statusListIndex: '' + statusListEntry.statusListIndex,
      statusListCredential: statusList.id
    }
    return { credentialStatus, statusListEntry }
  }

  async getStatusListEntryByCredentialId(args: IGetStatusListEntryByCredentialIdArgs): Promise<IStatusListEntryEntity | undefined> {
    return await this.statusListStore.getStatusListEntryByCredentialId(args)
  }

  async getStatusListEntryByIndex(args: IGetStatusListEntryByIndexArgs): Promise<IStatusListEntryEntity | undefined> {
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
      statusListIndex
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

  async getStatusList(args?: { correlationId?: string }): Promise<StatusListDetails> {
    const id = this.options.id
    const correlationId = args?.correlationId ?? this.options.correlationId
    return await this.statusListStore
      .getStatusList({ id, correlationId })
      .then((statusListEntity: IStatusListEntity) => statusListCredentialToDetails({ statusListCredential: statusListEntity.statusListCredential! }))
  }

  isStatusListIndexInUse(): Promise<boolean> {
    return Promise.resolve(false)
  }
}
