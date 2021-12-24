import { IAgentContext, IDataStore, IKeyManager, IPluginMethodMap, ManagedKeyInfo } from '@veramo/core'
import { ObjectLiteral } from 'typeorm/browser/common/ObjectLiteral'

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
 * @param { 128 | 160 | 192 | 224 | 256 } bits - Affects the number of words in the mnemonic,
 * which is 12, 15, 18, 21 and 24 respectively.
 * @param { string } id - Optional user defined id for the mnemonic
 * @param { boolean } persist - Whether the mnemonic should be persisted into the database
 */
export interface IMnemonicGeneratorArgs {
  bits: 128 | 160 | 192 | 224 | 256
  id?: string
  persist?: boolean
}

/**
 * @param { string } id - Optional user defined id for the mnemonic
 * @param { string } hash - Optional sha256 hash of the mnemonic
 * @param { string[] } wordList - List containing all the words of the mnemonic in order.
 */
export interface IMnemonicVerificationArgs {
  id?: string
  hash?: string
  wordList: string[]
}

/**
 * @param { string } id - Optional user defined id for the mnemonic
 * @param { string } hash - Optional sha256 hash of the mnemonic
 * @param { number, string][] } indexedWordList - List partially containing the words
 * with their indexes corresponding the position in which they appear in the mnemonic.
 * It must be in the same order as in the mnemonic.
 */
export interface IPartialMnemonicVerificationArgs {
  id?: string
  hash?: string
  indexedWordList: [number, string][]
}

/**
 * @param { string[] } mnemonic - Array representation of the mnemonic string
 */
export interface ISeedGeneratorArgs {
  mnemonic: string[]
}
/**
 * @param { string } id - Optional user defined id for the mnemonic
 * @param { string } hash - Optional sha256 hash of the mnemonic
 * @param { string[] } mnemonic - Array representation of the mnemonic string
 * @param { string } masterKey - The master key generated from the seed
 * @param { string } chainCode - The chain code generated with the keys
 * @param { string } kms - The key management service to be used
 * @param { string } path - The derivation path to be used
 * @param { boolean } withZeroBytes - Whether the public key should be generated with zero bytes
 * @param { 'Ed25519' | 'Secp256k1' } - The type of the key generated
 * @param { boolean } persist - Whether the information should be persisted
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

export interface IMnemonicInfoKeyResult {
  masterKey?: string
  chainCode?: string
}

export interface DeleteResult {
  raw: unknown
  affected?: number | null
}

export interface UpdateResult extends DeleteResult {
  generatedMaps: ObjectLiteral[]
}

export interface IMnemonicInfoResult extends IMnemonicInfoStoreArgs {
  succeeded?: boolean
  seed?: string
}

export type IRequiredContext = IAgentContext<IKeyManager & IDataStore>
