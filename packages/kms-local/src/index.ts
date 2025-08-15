import type { X509Opts } from '@sphereon/ssi-sdk-ext.key-utils'
import type { KeyMetadata, TKeyType } from '@veramo/core'

export { SphereonKeyManagementSystem } from './SphereonKeyManagementSystem'

export * from '@veramo/kms-local'

export interface ManagedKeyInfoArgs {
  alias?: string
  type: TKeyType
  privateKeyHex: string
  publicKeyHex?: string
  meta?: ManageKeyInfoMeta | undefined | null
}

export interface ManageKeyInfoMeta extends KeyMetadata {
  x509?: X509Opts
  [x: string]: any
}
export enum KeyType {
  Bls12381G2 = 'Bls12381G2',
}
