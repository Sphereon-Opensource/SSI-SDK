import {
  type CredentialProofFormat,
  type ICredentialStatus,
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

export type BitstringStatusPurpose = 'revocation' | 'suspension' | 'refresh' | 'message' | string // From vc-bitstring-status-lists without pulling in the whole dep for just this one type

export type BitstringStatusMessage = {
  status: string
  message?: string
  [x: string]: any
}

export interface BitstringStatusListEntryCredentialStatus extends ICredentialStatus {
  type: 'BitstringStatusListEntry'
  statusPurpose: BitstringStatusPurpose | BitstringStatusPurpose[]
  statusListIndex: string
  statusListCredential: string
  bitsPerStatus?: number
  statusMessage?: Array<BitstringStatusMessage>
  statusReference?: string | string[]
}

export type BitstringStatusListArgs = {
  statusPurpose: BitstringStatusPurpose
  bitsPerStatus: number
  ttl?: number
  validFrom?: Date
  validUntil?: Date
}

export interface IBitstringStatusListEntryEntity {
  statusListId: string
  statusListIndex: number
  credentialId?: string
  credentialHash?: string
  entryCorrelationId?: string
  statusPurpose: string
  bitsPerStatus?: number
  statusMessage?: Array<BitstringStatusMessage>
  statusReference?: string | string[]
}
