import { StatusListEntryEntity } from '../entities/statusList/StatusList2021EntryEntity'
import type {
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
  IStatusListEntryAvailableArgs,
  IUpdateStatusListIndexArgs,
} from '../types'
import { IStatusListEntity, IStatusListEntryEntity } from '../types'
import { BitstringStatusListEntryEntity } from '../entities/statusList/BitstringStatusListEntryEntity'

export interface IStatusListStore {
  getStatusList(args: IGetStatusListArgs): Promise<IStatusListEntity | IBitstringStatusListEntity>

  getStatusLists(args: IGetStatusListsArgs): Promise<Array<IStatusListEntity | IBitstringStatusListEntity>>

  removeStatusList(args: IRemoveStatusListArgs): Promise<boolean>

  addStatusList(args: IAddStatusListArgs): Promise<IStatusListEntity | IBitstringStatusListEntity>

  updateStatusList(args: IUpdateStatusListIndexArgs): Promise<IStatusListEntity | IBitstringStatusListEntity>

  availableStatusListEntries(args: IStatusListEntryAvailableArgs): Promise<number[]>

  addStatusListEntry(args: IAddStatusListEntryArgs): Promise<IStatusListEntryEntity | IBitstringStatusListEntryEntity>

  updateStatusListEntry(args: IAddStatusListEntryArgs): Promise<IStatusListEntryEntity | IBitstringStatusListEntryEntity>

  getStatusListEntryByIndex(args: IGetStatusListEntryByIndexArgs): Promise<StatusListEntryEntity | BitstringStatusListEntryEntity | undefined>

  getStatusListEntryByCredentialId(
    args: IGetStatusListEntryByCredentialIdArgs,
  ): Promise<StatusListEntryEntity | BitstringStatusListEntryEntity | undefined>

  removeStatusListEntryByIndex(args: IGetStatusListEntryByIndexArgs): Promise<boolean>

  removeStatusListEntryByCredentialId(args: IGetStatusListEntryByCredentialIdArgs): Promise<boolean>

  getStatusListEntries(args: IGetStatusListEntriesArgs): Promise<Array<IStatusListEntryEntity | IBitstringStatusListEntryEntity>>
}
