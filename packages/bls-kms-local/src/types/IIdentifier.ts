import { RequireOnly } from '@veramo/core'

export type TKeyType = 'BLS'

/**
 * Cryptographic key
 * @public
 */
export interface IKey {
  /**
   * Key ID
   */
  kid: string

  /**
   * Key Management System
   */
  kms: string

  /**
   * Key type
   */
  type: TKeyType

  /**
   * Public key
   */
  publicKeyHex: string

  /**
   * Optional. Private key
   */
  privateKeyHex?: string

  /**
   * Optional. Key metadata. This should be used to determine which algorithms are supported.
   */
  meta?: KeyMetadata | null
}

export interface KeyMetadata {
  algorithms?: string[]
  [x: string]: any
}

export type ManagedKeyInfo = Omit<IKey, 'privateKeyHex'>

export type MinimalImportableKey = RequireOnly<IKey, 'privateKeyHex' | 'publicKeyHex' | 'type' | 'kms'>

export interface ManagedKey {
  alias: string
  privateKeyHex: string
  publicKeyHex: string
  type: TKeyType
}

export type ImportableKey = RequireOnly<ManagedKey, 'publicKeyHex' | 'privateKeyHex' | 'type'>
