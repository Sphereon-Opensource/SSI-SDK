import {
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
import { BitstringStatusPurpose } from './bitstringTypes'

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
  bitsPerStatus?: number
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
  bitsPerStatus?: number
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
