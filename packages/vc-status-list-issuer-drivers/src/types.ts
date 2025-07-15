import { IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import {
  IAddStatusListEntryArgs,
  IGetStatusListEntryByCredentialIdArgs,
  IGetStatusListEntryByIndexArgs,
  IStatusListEntryEntity,
  StatusListStore,
} from '@sphereon/ssi-sdk.data-store'
import {
  BitstringStatusListEntryCredentialStatus,
  IStatusListPlugin,
  StatusList2021EntryCredentialStatus,
  StatusListOAuthEntryCredentialStatus,
  StatusListResult,
} from '@sphereon/ssi-sdk.vc-status-list'
import { StatusListCredential, StatusListDriverType } from '@sphereon/ssi-types'
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

export interface IStatusListDriver {
  statusListStore: StatusListStore

  getType(): StatusListDriverType

  getOptions(): DriverOptions

  getStatusListLength(args?: { correlationId?: string }): Promise<number>

  createStatusList(args: { statusListCredential: StatusListCredential; correlationId?: string; bitsPerStatus?: number }): Promise<StatusListResult>

  getStatusList(args?: { correlationId?: string }): Promise<StatusListResult>

  getStatusLists(): Promise<Array<StatusListResult>>

  updateStatusListEntry(args: IAddStatusListEntryArgs): Promise<{
    credentialStatus: StatusList2021EntryCredentialStatus | StatusListOAuthEntryCredentialStatus | BitstringStatusListEntryCredentialStatus
    statusListEntry: IStatusListEntryEntity
  }>

  getStatusListEntryByCredentialId(args: IGetStatusListEntryByCredentialIdArgs): Promise<IStatusListEntryEntity | undefined>

  getStatusListEntryByIndex(args: IGetStatusListEntryByIndexArgs): Promise<IStatusListEntryEntity | undefined>

  updateStatusList(args: { statusListCredential: StatusListCredential }): Promise<StatusListResult>

  deleteStatusList(): Promise<boolean>

  getRandomNewStatusListIndex(args?: { correlationId?: string }): Promise<number>

  isStatusListIndexInUse(): Promise<boolean>
}
