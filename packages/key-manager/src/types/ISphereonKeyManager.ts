import type { IKeyManager, IKeyManagerSignArgs, IPluginMethodMap, KeyMetadata, ManagedKeyInfo, MinimalImportableKey, TKeyType } from '@veramo/core'

export type PartialKey = ManagedKeyInfo & { privateKeyHex: string }

export interface ISphereonKeyManager extends IKeyManager, IPluginMethodMap {
  keyManagerCreate(args: ISphereonKeyManagerCreateArgs): Promise<PartialKey>

  keyManagerImport(key: MinimalImportableKey): Promise<PartialKey>

  keyManagerSign(args: ISphereonKeyManagerSignArgs): Promise<string>

  /**
   * Verifies a signature using the key
   *
   * Does not exist in IKeyManager
   * @param args
   */
  keyManagerVerify(args: ISphereonKeyManagerVerifyArgs): Promise<boolean>

  keyManagerListKeys(): Promise<Array<ManagedKeyInfo>>

  /**
   * Get the KMS registered as default. Handy when no explicit KMS is provided for a function
   */

  keyManagerGetDefaultKeyManagementSystem(): Promise<string>

  /**
   * Set keys to expired and remove keys eligible for deletion.
   * @param args
   */
  keyManagerHandleExpirations(args: ISphereonKeyManagerHandleExpirationsArgs): Promise<Array<ManagedKeyInfo>>
}

export interface IkeyOptions {
  /**
   * Is this a temporary key?
   */
  ephemeral?: boolean

  /**
   * Expiration and remove the key
   */
  expiration?: {
    expiryDate?: Date
    removalDate?: Date
  }
}

/**
 * Input arguments for {@link ISphereonKeyManager.keyManagerCreate | keyManagerCreate}
 * @public
 */
export interface ISphereonKeyManagerCreateArgs {
  /**
   * Key type
   */
  type: TKeyType

  /**
   * Key Management System
   */
  kms?: string

  /**
   * Key options
   */
  opts?: IkeyOptions

  /**
   * Optional. Key meta data
   */
  meta?: KeyMetadata
}

export function hasKeyOptions(object: any): object is { opts?: IkeyOptions } {
  return object!! && 'opts' in object && ('ephemeral' in object.opts || 'expiration' in object.opts)
}

/**
 * Input arguments for {@link ISphereonKeyManager.keyManagerGet | keyManagerGet}
 * @public
 */
export interface IKeyManagerGetArgs {
  /**
   * Key ID
   */
  kid: string
}

/**
 * Input arguments for {@link ISphereonKeyManager.keyManagerDelete | keyManagerDelete}
 * @public
 */
export interface IKeyManagerDeleteArgs {
  /**
   * Key ID
   */
  kid: string
}

/**
 * Input arguments for {@link ISphereonKeyManagerSignArgs.keyManagerSign | keyManagerSign}
 * @public
 */
// @ts-ignore
export interface ISphereonKeyManagerSignArgs extends IKeyManagerSignArgs {
  /**
   * Data to sign
   */
  data: string | Uint8Array
}

export interface ISphereonKeyManagerHandleExpirationsArgs {
  skipRemovals?: boolean
}

export interface ISphereonKeyManagerVerifyArgs {
  kms?: string
  publicKeyHex: string
  type: TKeyType
  algorithm?: string
  data: Uint8Array
  signature: string
}

export const isDefined = <T extends unknown>(object: T | undefined): object is T => object !== undefined
