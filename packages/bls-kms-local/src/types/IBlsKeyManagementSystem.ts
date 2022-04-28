import {IKey, KeyMetadata, MinimalImportableKey, TKeyType} from "./IIdentifier";

export interface IBlsKeyManagementSystem {
  importKey(args: Omit<MinimalImportableKey, 'kms'>): Promise<Partial<IKey>>
  listKeys(): Promise<Partial<IKey>[]>
  createKey({ type }: { type: TKeyType, meta?:KeyMetadata }): Promise<Partial<IKey>>
  deleteKey(args: { alias: string }): Promise<boolean>
  sign({ keyRef, data }: { keyRef: Pick<IKey, 'kid'>; data: Uint8Array[] }): Promise<string>
}
