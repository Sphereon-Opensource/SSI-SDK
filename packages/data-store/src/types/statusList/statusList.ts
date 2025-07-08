import {
  BitstringStatusPurpose,
  type CredentialProofFormat,
  IIssuer,
  RequireOneOf,
  StatusListCredential,
  StatusListCredentialIdMode,
  StatusListDriverType,
  StatusListIndexingDirection,
  StatusListType,
  StatusPurpose2021,
} from '@sphereon/ssi-types'
import { StatusListEntity } from '../../entities/statusList/StatusListEntities'

export type BitstringStatus = {
  status: string
  message?: string
  [x: string]: any
}

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

export interface IBitstringStatusListEntity extends IStatusListEntity {
  statusPurpose: BitstringStatusPurpose | BitstringStatusPurpose[]
  statusSize?: number
  validFrom?: Date
  validUntil?: Date
  ttl?: number
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
