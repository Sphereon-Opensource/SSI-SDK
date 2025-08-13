import { FindOptionsWhere } from 'typeorm'
import {
  BitstringStatusPurpose,
  IBitstringStatusListEntryEntity,
  IOAuthStatusListEntity,
  IStatusList2021Entity,
  IStatusListEntryEntity,
} from './statusList'
import {
  CredentialProofFormat,
  IIssuer,
  StatusListCredential,
  StatusListCredentialIdMode,
  StatusListDriverType,
  StatusListIndexingDirection,
  StatusListType,
  StatusPurpose2021,
} from '@sphereon/ssi-types'

export type FindStatusListArgs = FindOptionsWhere<IStatusList2021Entity | IOAuthStatusListEntity>[]
export type FindStatusListEntryArgs = FindOptionsWhere<IStatusListEntryEntity>[] | FindOptionsWhere<IStatusListEntryEntity>

export interface IStatusListEntryAvailableArgs {
  statusListId?: string
  correlationId?: string
  statusListIndex: number | number[]
}

export interface IGetStatusListEntryByIndexArgs {
  statusListId?: string
  statusListCorrelationId?: string
  statusListIndex?: number
  entryCorrelationId?: string
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

export type IAddStatusListEntryArgs = IStatusListEntryEntity | IBitstringStatusListEntryEntity

export interface IGetStatusListArgs {
  id?: string
  correlationId?: string
}

export type IRemoveStatusListArgs = IGetStatusListArgs

export interface IGetStatusListsArgs {
  filter?: FindStatusListArgs
}

interface IBaseStatusListArgs {
  id: string
  correlationId: string
  driverType: StatusListDriverType
  credentialIdMode: StatusListCredentialIdMode
  length: number
  issuer: string | IIssuer
  type: StatusListType
  proofFormat: CredentialProofFormat
  statusListCredential?: StatusListCredential
  bitsPerStatus?: number
}

export type IStatusList2021Args = IBaseStatusListArgs & {
  type: StatusListType.StatusList2021
  indexingDirection: StatusListIndexingDirection
  statusPurpose: StatusPurpose2021
}

export type IOAuthStatusListArgs = IBaseStatusListArgs & {
  type: StatusListType.OAuthStatusList
  bitsPerStatus: number
  expiresAt?: Date
}

export type IBitstringStatusListArgs = IBaseStatusListArgs & {
  type: StatusListType.BitstringStatusList
  statusPurpose: BitstringStatusPurpose | BitstringStatusPurpose[]
  bitsPerStatus?: number
  validFrom?: Date
  validUntil?: Date
  ttl?: number
}

export type IAddStatusListArgs = IStatusList2021Args | IOAuthStatusListArgs | IBitstringStatusListArgs

export type IUpdateStatusListIndexArgs = IAddStatusListArgs
