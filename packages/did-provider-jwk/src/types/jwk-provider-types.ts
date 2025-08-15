import { IKeyOpts } from '@sphereon/ssi-sdk-ext.key-utils'
import { IAgentContext, IIdentifier, IKey, IKeyManager, IService } from '@veramo/core'

export interface ICreateIdentifierArgs {
  kms?: string
  alias?: string
  options?: IKeyOpts
}

export interface IAddKeyArgs {
  identifier: IIdentifier
  key: IKey
  options?: any
}

export interface IRemoveKeyArgs {
  identifier: IIdentifier
  id: string
  options?: any
}

export interface IRemoveKeyArgs {
  identifier: IIdentifier
  kid: string
  options?: any
}

export interface IAddServiceArgs {
  identifier: IIdentifier
  service: IService
  options?: any
}

export enum Key {
  Ed25519 = 'Ed25519',
  Secp256k1 = 'Secp256k1',
  Secp256r1 = 'Secp256r1',
}
export enum KeyCurve {
  Secp256k1 = 'secp256k1',
  P_256 = 'P-256',
  Ed25519 = 'Ed25519',
}

export enum KeyType {
  EC = 'EC',
  OKP = 'OKP',
}

export const SIG_KEY_ALGS = ['ES256', 'ES384', 'ES512', 'EdDSA', 'ES256K', 'Ed25519', 'Secp256k1', 'Secp256r1', 'Bls12381G1', 'Bls12381G2']
export const ENC_KEY_ALGS = ['X25519', 'ECDH_ES_A256KW', 'RSA_OAEP_256']

export type IRequiredContext = IAgentContext<IKeyManager>
