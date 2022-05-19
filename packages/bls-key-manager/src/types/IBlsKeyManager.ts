import { IPluginMethodMap, IKey, KeyMetadata, MinimalImportableKey, TKeyType } from '@veramo/core'

export interface IBlsKeyManager extends IPluginMethodMap {
  keyManagerCreate(args: IKeyManagerCreateArgs): Promise<BBSKey>
  keyManagerGetKeyManagementSystems(): Promise<Array<string>>
  keyManagerGet({ kid }: IKeyManagerGetArgs): Promise<IKey>
  keyManagerDelete({ kid }: IKeyManagerDeleteArgs): Promise<boolean>
  keyManagerImport(key: MinimalImportableKey): Promise<BBSKey>
  keyManagerSign(args: IKeyManagerSignArgs): Promise<string>
  keyManagerVerify(args: IKeyManagerVerifyArgs): Promise<boolean>
}

/**
 * Input arguments for {@link IBlsKeyManager.keyManagerCreate | keyManagerCreate}
 * @public
 */
export interface IKeyManagerCreateArgs {
  /**
   * Key type
   */
  type: TKeyType

  /**
   * Key Management System
   */
  kms: string

  /**
   * Optional. Key meta data
   */
  meta?: KeyMetadata
}

/**
 * Input arguments for {@link IBlsKeyManager.keyManagerGet | keyManagerGet}
 * @public
 */
export interface IKeyManagerGetArgs {
  /**
   * Key ID
   */
  kid: string
}

/**
 * Input arguments for {@link IBlsKeyManager.keyManagerDelete | keyManagerDelete}
 * @public
 */
export interface IKeyManagerDeleteArgs {
  /**
   * Key ID
   */
  kid: string
}

/**
 * Input arguments for {@link IBlsKeyManager.keyManagerSign | keyManagerSign}
 * @public
 */
export interface IKeyManagerSignArgs {
  /**
   * The key handle, as returned during `keyManagerCreateKey`
   */
  keyRef: string

  /**
   * Data to sign
   */
  data: Uint8Array[]
}

export interface IKeyManagerVerifyArgs {
  kms: string
  publicKey: Uint8Array
  messages: Uint8Array[]
  signature: Uint8Array
}

export type BBSKey = Partial<IKey>
