import {
  IIssuer,
  StatusListCredential,
  StatusListCredentialIdMode,
  StatusListDriverType,
  StatusListIndexingDirection,
  StatusListType,
  StatusPurpose2021,
  type CredentialProofFormat,
  RequireOneOf,
} from '@sphereon/ssi-types'
import { StatusListEntity } from '../../entities/statusList/StatusListEntities'

export interface IStatusListEntity {
  id: string
  correlationId: string
  driverType: StatusListDriverType
  credentialIdMode: StatusListCredentialIdMode
  length: number
  issuer: string | IIssuer
  type: StatusListType
  proofFormat: CredentialProofFormat
  statusListCredential?: StatusListCredential
}

export interface IStatusList2021Entity extends IStatusListEntity {
  indexingDirection: StatusListIndexingDirection
  statusPurpose: StatusPurpose2021
}

export interface IOAuthStatusListEntity extends IStatusListEntity {
  bitsPerStatus: number
  expiresAt?: Date
}

export type IStatusListEntryEntity = RequireOneOf<
  {
    statusList: StatusListEntity
    statusListId: string
    value?: string
    statusListIndex: number
    credentialHash?: string
    credentialId?: string
    correlationId?: string
  },
  'statusList' | 'statusListId'
>
