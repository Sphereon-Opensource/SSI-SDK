import {
  ICredentialStatus,
  IIssuer,
  OriginalVerifiableCredential,
  StatusListCredentialIdMode,
  StatusListDriverType,
  StatusListIndexingDirection,
  StatusListType,
  StatusPurpose2021,
} from '@sphereon/ssi-types'
import { ProofFormat } from '@veramo/core'

export interface CreateNewStatusListArgs extends Omit<StatusList2021ToVerifiableCredentialArgs, 'encodedList'> {
  correlationId: string
  length?: number
}
export interface UpdateStatusListFromEncodedListArgs extends StatusList2021ToVerifiableCredentialArgs {
  statusListIndex: number | string
  value: boolean
}

export interface UpdateStatusListFromStatusListCredentialArgs {
  statusListCredential: OriginalVerifiableCredential
  keyRef?: string
  statusListIndex: number | string
  value: boolean
}
export interface StatusList2021ToVerifiableCredentialArgs {
  issuer: string | IIssuer
  id: string
  type?: StatusListType
  statusPurpose: StatusPurpose2021
  encodedList: string
  proofFormat?: ProofFormat
  keyRef?: string

  // todo: validFrom and validUntil
}

export interface StatusListDetails {
  encodedList: string
  length: number
  type: StatusListType
  proofFormat: ProofFormat
  statusPurpose: StatusPurpose2021
  id: string
  issuer: string | IIssuer
  indexingDirection: StatusListIndexingDirection
  statusListCredential: OriginalVerifiableCredential
  // These cannot be deduced from the VC, so they are present when callers pass in these values as params
  correlationId?: string
  driverType?: StatusListDriverType
  credentialIdMode?: StatusListCredentialIdMode
}
export interface StatusListResult extends StatusListDetails {
  statusListCredential: OriginalVerifiableCredential
}

export interface StatusList2021EntryCredentialStatus extends ICredentialStatus {
  type: 'StatusList2021Entry'
  statusPurpose: StatusPurpose2021
  statusListIndex: string
  statusListCredential: string
}
