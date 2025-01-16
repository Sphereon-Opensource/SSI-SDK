import { W3CVerifiableCredential } from './w3c-vc'
import { MdocDocument } from './mso_mdoc'
import { ProofFormat as VmoProofFormat } from '@veramo/core/src/types/ICredentialIssuer'

export enum StatusListType {
  StatusList2021 = 'StatusList2021',
  OAuthStatusList = 'OAuthStatusList',
}

export type StatusListVerifiableCredential = W3CVerifiableCredential | MdocDocument

export type ProofFormat = VmoProofFormat | 'cbor'
