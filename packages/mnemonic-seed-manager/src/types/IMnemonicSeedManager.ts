import { IAgentContext, IDataStore, IKeyManager, IPluginMethodMap, ManagedKeyInfo } from '@veramo/core'

/**
 * @public
 */
export interface IMnemonicSeedManager extends IPluginMethodMap {
  generateMnemonic(args: IMnemonicGeneratorArgs): Promise<IMnemonicInfoResult>

  verifyMnemonic(args: IMnemonicVerificationArgs): Promise<IMnemonicInfoResult>

  verifyPartialMnemonic(args: IPartialMnemonicVerificationArgs): Promise<IMnemonicInfoResult>

  generateSeed(args: ISeedGeneratorArgs): Promise<IMnemonicInfoResult>

  saveMnemonicInfo(args: IMnemonicInfoStoreArgs): Promise<IMnemonicInfoResult>

  getMnemonicInfo(args: IMnemonicInfoStoreArgs): Promise<IMnemonicInfoResult>

  deleteMnemonicInfo(args: IMnemonicInfoStoreArgs): Promise<DeleteResult>

  generateMasterKey(args: IMnemonicInfoStoreArgs): Promise<IMnemonicInfoKeyResult>

  generateKeysFromMnemonic(args: IMnemonicInfoStoreArgs, context: IRequiredContext): Promise<ManagedKeyInfo>
}

/**
 * @param bits - Affects the number of words in the mnemonic, which is 12, 15, 18, 21 and 24 respectively.
 * @param id - Optional user defined id for the mnemonic
 * @param persist - Whether the mnemonic should be persisted into the database
 * @public
 */
export interface IMnemonicGeneratorArgs {
  bits: 128 | 160 | 192 | 224 | 256
  id?: string
  persist?: boolean
}

/**
 * @param id - Optional user defined id for the mnemonic
 * @param hash - Optional sha256 hash of the mnemonic
 * @param wordList - List containing all the words of the mnemonic in order.
 *
 * @public
 */
export interface IMnemonicVerificationArgs {
  id?: string
  hash?: string
  wordList: string[]
}

/**
 * @param id - Optional user defined id for the mnemonic
 * @param hash - Optional sha256 hash of the mnemonic
 * @param indexedWordList - List partially containing the words
 * with their indexes corresponding the position in which they appear in the mnemonic.
 * It must be in the same order as in the mnemonic.
 * @public
 */
export interface IPartialMnemonicVerificationArgs {
  id?: string
  hash?: string
  indexedWordList: [number, string][]
}

/**
 * @param mnemonic - Array representation of the mnemonic string
 * @public
 */
export interface ISeedGeneratorArgs {
  mnemonic: string[]
}

/**
 * @param id - Optional user defined id for the mnemonic
 * @param hash - Optional sha256 hash of the mnemonic
 * @param mnemonic - Array representation of the mnemonic string
 * @param masterKey - The master key generated from the seed
 * @param chainCode - The chain code generated with the keys
 * @param kms - The key management service to be used
 * @param path - The derivation path to be used
 * @param withZeroBytes - Whether the public key should be generated with zero bytes
 * @param type - The type of the key generated
 * @param persist - Whether the information should be persisted
 * @public
 */
export interface IMnemonicInfoStoreArgs {
  id?: string
  hash?: string
  mnemonic?: string[]
  masterKey?: string
  chainCode?: string
  kms?: string
  path?: string
  withZeroBytes?: boolean
  type?: 'Ed25519' | 'Secp256k1'
  persist?: boolean
}

/**
 * @public
 */
export interface IMnemonicInfoKeyResult {
  masterKey?: string
  chainCode?: string
}

/**
 * @public
 */
export interface DeleteResult {
  raw: unknown
  affected?: number | null
}

/**
 * @public
 */
export interface UpdateResult extends DeleteResult {
  generatedMaps: ObjectLiteral
}

/**
 * @public
 */
export interface ObjectLiteral {
  [key: string]: any
}

/**
 * @public
 */
export interface IMnemonicInfoResult extends IMnemonicInfoStoreArgs {
  succeeded?: boolean
  seed?: string
}

/**
 * @public
 */
export type IRequiredContext = IAgentContext<IKeyManager & IDataStore>
