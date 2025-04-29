import { type W3CVerifiableCredential } from './w3c-vc'

export type CWT = string

export type StatusListCredential = W3CVerifiableCredential | CWT

export type CredentialProofFormat = 'jwt' | 'lds' | 'EthereumEip712Signature2021' | 'cbor'
