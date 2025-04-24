import { type W3CVerifiableCredential } from './w3c-vc'

export enum StatusListType {
  StatusList2021 = 'StatusList2021',
  OAuthStatusList = 'OAuthStatusList',
}
export type CWT = string

export type StatusListCredential = W3CVerifiableCredential | CWT

export type CredentialProofFormat = 'jwt' | 'lds' | 'EthereumEip712Signature2021' | 'cbor'
