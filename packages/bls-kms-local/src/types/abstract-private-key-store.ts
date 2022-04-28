import { RequireOnly } from '@veramo/core';
import {ManagedKey, TKeyType} from "./IIdentifier";

export interface ManagedPrivateKey {
  alias: string
  privateKeyHex: string
  type: TKeyType
}

export type ImportablePrivateKey = RequireOnly<ManagedPrivateKey, 'privateKeyHex' | 'type'>

export abstract class AbstractPrivateKeyStore {
  abstract import(args: ImportablePrivateKey): Promise<ManagedPrivateKey>
  abstract get(args: { alias: string }): Promise<ManagedKey>
  abstract delete(args: { alias: string }): Promise<boolean>
  abstract list(args: {}): Promise<Array<ManagedPrivateKey>>
}
