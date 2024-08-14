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
} from '../types'
import { IStatusListEntity, IStatusListEntryEntity } from '../types'

export interface IStatusListStore {
  getStatusList(args: IGetStatusListArgs): Promise<IStatusListEntity>

  getStatusLists(args: IGetStatusListsArgs): Promise<Array<IStatusListEntity>>

  removeStatusList(args: IRemoveStatusListArgs): Promise<void>

  addStatusList(args: IAddStatusListArgs): Promise<IStatusListEntity>

  updateStatusList(args: IUpdateStatusListIndexArgs): Promise<IStatusListEntity>

  availableStatusListEntries(args: IStatusListEntryAvailableArgs): Promise<number[]>

  addStatusListEntry(args: IAddStatusListEntryArgs): Promise<IStatusListEntryEntity>

  updateStatusListEntry(args: IAddStatusListEntryArgs): Promise<IStatusListEntryEntity>

  getStatusListEntryByIndex(args: IGetStatusListEntryByIndexArgs): Promise<StatusListEntryEntity | undefined>

  getStatusListEntryByCredentialId(args: IGetStatusListEntryByCredentialIdArgs): Promise<StatusListEntryEntity | undefined>

  removeStatusListEntryByIndex(args: IGetStatusListEntryByIndexArgs): Promise<boolean>

  removeStatusListEntryByCredentialId(args: IGetStatusListEntryByCredentialIdArgs): Promise<boolean>

  getStatusListEntries(args: IGetStatusListEntriesArgs): Promise<IStatusListEntryEntity[]>

  getStatusList(args: IGetStatusListArgs): Promise<IStatusListEntity>
}
