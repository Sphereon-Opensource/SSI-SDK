import { W3CVerifiableCredential } from './w3c-vc'
import { ProofFormat as VmoProofFormat } from '@veramo/core'

export enum StatusListType {
  StatusList2021 = 'StatusList2021',
  OAuthStatusList = 'OAuthStatusList',
}
export type CWT = string

export type StatusListCredential = W3CVerifiableCredential | CWT

export type ProofFormat = VmoProofFormat | 'cbor'
