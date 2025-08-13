import { IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import {
  BitstringStatusListEntryCredentialStatus,
  IAddStatusListEntryArgs,
  IGetStatusListEntryByCredentialIdArgs,
  IGetStatusListEntryByIndexArgs,
  IStatusListEntryEntity,
  StatusListStore,
} from '@sphereon/ssi-sdk.data-store'
import {
  IStatusListPlugin,
  StatusList2021EntryCredentialStatus,
  StatusListOAuthEntryCredentialStatus,
  StatusListResult,
} from '@sphereon/ssi-sdk.vc-status-list'
import { StatusListCredential, StatusListCredentialIdMode, StatusListDriverType, StatusListType } from '@sphereon/ssi-types'
import { IAgentContext, ICredentialIssuer, ICredentialVerifier, IDataStoreORM, IDIDManager, IKeyManager, IResolver } from '@veramo/core'
import { DriverOptions } from './drivers'
import { IVcdmCredentialPlugin } from '@sphereon/ssi-sdk.credential-vcdm'

export type IRequiredPlugins = IDataStoreORM &
  IDIDManager &
  IKeyManager &
  IIdentifierResolution &
  ICredentialIssuer &
  ICredentialVerifier &
  IVcdmCredentialPlugin &
  IStatusListPlugin &
  IResolver
export type IRequiredContext = IAgentContext<IRequiredPlugins>

export interface ICreateStatusListArgs {
  statusListType: StatusListType
  statusListCredential: StatusListCredential
  credentialIdMode?: StatusListCredentialIdMode
  correlationId?: string
  bitsPerStatus?: number
}

export interface IGetStatusListArgs {
  correlationId?: string
}

export interface IGetStatusListLengthArgs {
  correlationId?: string
}

export interface IUpdateStatusListArgs {
  statusListCredential: StatusListCredential
  correlationId: string
}

export interface IGetRandomNewStatusListIndexArgs {
  correlationId?: string
}

export interface IStatusListDriver {
  statusListStore: StatusListStore

  getType(): StatusListDriverType

  getOptions(): DriverOptions

  getStatusListLength(args?: IGetStatusListLengthArgs): Promise<number>

  createStatusList(args: ICreateStatusListArgs): Promise<StatusListResult>

  getStatusList(args?: IGetStatusListArgs): Promise<StatusListResult>

  getStatusLists(): Promise<Array<StatusListResult>>

  updateStatusListEntry(args: IAddStatusListEntryArgs): Promise<{
    credentialStatus: StatusList2021EntryCredentialStatus | StatusListOAuthEntryCredentialStatus | BitstringStatusListEntryCredentialStatus
    statusListEntry: IStatusListEntryEntity
  }>

  getStatusListEntryByCredentialId(args: IGetStatusListEntryByCredentialIdArgs): Promise<IStatusListEntryEntity | undefined>

  getStatusListEntryByIndex(args: IGetStatusListEntryByIndexArgs): Promise<IStatusListEntryEntity | undefined>

  updateStatusList(args: IUpdateStatusListArgs): Promise<StatusListResult>

  deleteStatusList(): Promise<boolean>

  getRandomNewStatusListIndex(args?: IGetRandomNewStatusListIndexArgs): Promise<number>

  isStatusListIndexInUse(): Promise<boolean>
}
