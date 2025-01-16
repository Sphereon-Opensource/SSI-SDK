import {
  IIssuer,
  StatusListVerifiableCredential,
  StatusListCredentialIdMode,
  StatusListDriverType,
  StatusListIndexingDirection,
  StatusListType,
  StatusPurpose2021,
  ProofFormat,
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
  proofFormat: ProofFormat
  statusListCredential?: StatusListVerifiableCredential
}

export interface IStatusList2021Entity extends IStatusListEntity {
  indexingDirection: StatusListIndexingDirection
  statusPurpose: StatusPurpose2021
}

export interface IOAuthStatusListEntity extends IStatusListEntity {
  bitsPerStatus: number
  expiresAt?: string
}

export interface IStatusListEntryEntity {
  statusList: StatusListEntity | string // string is here to accept the id, so we can query it easily with typeorm

  value?: string

  statusListIndex: number

  credentialHash?: string

  credentialId?: string

  correlationId?: string
}
