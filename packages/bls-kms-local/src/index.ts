import { TKeyType } from '@veramo/core'
export { BlsKeyManagementSystem } from './BlsKeyManagementSystem'
export type BlsManagedKeyInfoArgs = { alias?: string; type: TKeyType; privateKeyHex: string; publicKeyHex: string }
export enum KeyType {
  Bls12381G2 = 'Bls12381G2',
}
