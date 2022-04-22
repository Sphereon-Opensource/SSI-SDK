import {
  TKeyType as VeramoTKeyType,
  IKey as VeramoIKey,
  ManagedKeyInfo,
  MinimalImportableKey as VeramoMinimalImportableKey,
  IPluginMethodMap,
} from '@veramo/core'
import { ManagedPrivateKey as VeramoManagedPrivateKey } from '@veramo/key-manager'

export type TKeyType = VeramoTKeyType | 'BLS'
export type IKey = Omit<VeramoIKey, 'type'> & { type: TKeyType }
export type MinimalImportableKey = Omit<VeramoMinimalImportableKey, 'type'> & { type: TKeyType }
export type ManagedPrivateKey = Omit<VeramoManagedPrivateKey, 'type'> & { type: TKeyType }

export interface IBlsKeyManagementSystem extends IPluginMethodMap {
  importKey(args: Omit<MinimalImportableKey, 'kms'>): Promise<ManagedKeyInfo>
  listKeys(): Promise<ManagedKeyInfo[]>
  createKey({ type }: { type: TKeyType }): Promise<ManagedKeyInfo>
  deleteKey(args: { kid: string }): Promise<boolean>
  sign({ keyRef, data }: { keyRef: Pick<IKey, 'kid'>; data: Uint8Array[] }): Promise<string>
}
