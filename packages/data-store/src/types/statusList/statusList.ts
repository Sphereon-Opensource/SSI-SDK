import {
  IIssuer,
  OriginalVerifiableCredential,
  StatusListCredentialIdMode,
  StatusListDriverType,
  StatusListIndexingDirection,
  StatusListType,
  StatusPurpose2021,
} from '@sphereon/ssi-types'
import { ProofFormat } from '@veramo/core'
import { StatusListEntity } from '../../entities/statusList2021/StatusList2021Entity'

export interface IStatusListEntity {
  id: string
  correlationId: string
  driverType: StatusListDriverType
  credentialIdMode: StatusListCredentialIdMode
  length: number
  issuer: string | IIssuer
  type: StatusListType
  proofFormat: ProofFormat
  indexingDirection: StatusListIndexingDirection
  statusPurpose: StatusPurpose2021
  statusListCredential?: OriginalVerifiableCredential
}

export interface IStatusListEntryEntity {
  statusList: StatusListEntity | string // string is here to accept the id, so we can query it easily with typeorm

  value?: string

  statusListIndex: number

  credentialHash?: string

  credentialId?: string

  correlationId?: string
}
