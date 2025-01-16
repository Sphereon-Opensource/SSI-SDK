import { W3CVerifiableCredential } from './w3c-vc'
import { MdocDocument } from './mso_mdoc'

export enum StatusListType {
  StatusList2021 = 'StatusList2021',
  OAuthStatusList = 'OAuthStatusList',
}

export type StatusListVerifiableCredential = W3CVerifiableCredential | MdocDocument
