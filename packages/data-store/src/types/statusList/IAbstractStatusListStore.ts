import { FindOptionsWhere } from 'typeorm'
import { IOAuthStatusListEntity, IStatusList2021Entity, IStatusListEntity, IStatusListEntryEntity } from './statusList'

export type FindStatusListArgs = FindOptionsWhere<IStatusList2021Entity | IOAuthStatusListEntity>[]
export type FindStatusListEntryArgs = FindOptionsWhere<IStatusListEntryEntity>[] | FindOptionsWhere<IStatusListEntryEntity>

export interface IStatusListEntryAvailableArgs {
  statusListId?: string
  correlationId?: string
  statusListIndex: number | number[]
}

export interface IGetStatusListEntryByIndexArgs {
  statusListId?: string
  correlationId?: string
  statusListIndex: number
  errorOnNotFound?: boolean
}

export interface IGetStatusListEntryByCredentialIdArgs {
  statusListId?: string
  statusListCorrelationId?: string
  entryCorrelationId?: string
  credentialId: string
  errorOnNotFound?: boolean
}
export interface IGetStatusListEntriesArgs {
  statusListId: string
  filter?: FindStatusListEntryArgs
}

export type IAddStatusListEntryArgs = IStatusListEntryEntity

export interface IGetStatusListArgs {
  id?: string
  correlationId?: string
}

export type IRemoveStatusListArgs = IGetStatusListArgs

export interface IGetStatusListsArgs {
  filter?: FindStatusListArgs
}

export type IAddStatusListArgs = IStatusListEntity

export type IUpdateStatusListIndexArgs = IStatusListEntity
