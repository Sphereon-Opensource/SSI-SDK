import { ICredentialStatus, IIssuer, OriginalVerifiableCredential } from '@sphereon/ssi-types'
import { ProofFormat } from '@veramo/core'

export type StatusListType = 'StatusList2021'
export type StatusPurpose2021 = 'revocation' | 'suspension' | string
export type IndexingDirection = 'rightToLeft'

export interface CreateNewStatusListArgs extends Omit<StatusList2021ToVerifiableCredentialArgs, 'encodedList'> {
  length?: number
}
export interface UpdateStatusListFromEncodedListArgs extends StatusList2021ToVerifiableCredentialArgs {
  index: number
  value: boolean
}

export interface UpdateStatusListFromStatusListCredentialArgs {
  statusListCredential: OriginalVerifiableCredential
  keyRef?: string
  index: number
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

export interface StatusListResult {
  encodedList: string
  statusListCredential: OriginalVerifiableCredential
  length: number
  type: StatusListType
  proofFormat: ProofFormat
  id: string
  issuer: string | IIssuer
  indexingDirection: IndexingDirection
}

export interface StatusList2021EntryCredentialStatus extends ICredentialStatus {
  type: 'StatusList2021Entry'
  statusPurpose: StatusPurpose2021
  statusListIndex: string
  statusListCredential: string
}
