import {IAgentPlugin} from '@veramo/core'
import {blsSign, generateBls12381G2KeyPair} from '@mattrglobal/bbs-signatures'
import {IBlsKeyManagementSystem, schema} from '../index'

import {extractPublicKeyFromSecretKey} from '@stablelib/ed25519'
import * as u8a from 'uint8arrays'
import Debug from 'debug'

import {AbstractKeyStore} from '../types/abstract-key-store'
import {IKey, ImportableKey, MinimalImportableKey, TKeyType} from '../types/IIdentifier'

const debug = Debug('veramo:kms:bls:local')

export class BlsKeyManagementSystem implements IAgentPlugin {
  readonly schema = schema.IBlsKeyManagementSystem
  readonly methods: IBlsKeyManagementSystem = {
    importKey: this.importKey.bind(this),
    listKeys: this.listKeys.bind(this),
    createKey: this.createKey.bind(this),
    deleteKey: this.deleteKey.bind(this),
    sign: this.sign.bind(this),
  }

  private readonly keyStore: AbstractKeyStore

  constructor(keyStore: AbstractKeyStore) {
    this.keyStore = keyStore
  }

  async importKey(args: Omit<MinimalImportableKey, 'kms'>): Promise<Partial<IKey>> {
    if (!args.type || !args.privateKeyHex || !args.publicKeyHex) {
      throw new Error('invalid_argument: type, publicKeyHex and privateKeyHex are required to import a key')
    }
    const ikey = this.asManagedKeyInfo({ alias: args.kid, ...args })
    await this.keyStore.import(args)
    debug('imported key', ikey.type, ikey.publicKeyHex)
    return ikey
  }

  async listKeys(): Promise<Partial<IKey>[]> {
    const keys = await this.keyStore.list({})
    return keys.map((key) => this.asManagedKeyInfo(key as ImportableKey))
  }

  async createKey({ type }: { type: TKeyType }): Promise<Partial<IKey>> {
    let key: Partial<IKey>

    switch (type) {
      case 'BLS': {
        const keyPairBls12381G2 = await generateBls12381G2KeyPair()
        key = await this.importKey({
          type,
          privateKeyHex: Buffer.from(keyPairBls12381G2.secretKey.buffer).toString(),
          publicKeyHex: Buffer.from(keyPairBls12381G2.publicKey.buffer).toString(),
        })
        break
      }
      default:
        throw Error('not_supported: Key type not supported: ' + type)
    }

    debug('Created key', type, key.publicKeyHex)

    return key
  }

  async deleteKey(args: { kid: string }) {
    return await this.keyStore.delete({ kid: args.kid })
  }

  async sign({ keyRef, data }: { keyRef: Pick<IKey, 'kid'>; data: Uint8Array[] }): Promise<string> {
    let managedKey: IKey
    try {
      managedKey = await this.keyStore.get({ kid: keyRef.kid })
    } catch (e) {
      throw new Error(`key_not_found: No key entry found for kid=${keyRef.kid}`)
    }

    if (managedKey.type === 'BLS') {
      return Buffer.from(
        await blsSign({
          keyPair: {
            secretKey: new Uint8Array(Buffer.from(managedKey.privateKeyHex as string)),
            publicKey: new Uint8Array(Buffer.from(managedKey.publicKeyHex)),
          },
          messages: data,
        })
      ).toString()
    }
    throw Error(`not_supported: Cannot sign using key of type ${managedKey.type}`)
  }

  /**
   * Converts a {@link ManagedPrivateKey} to {@link ManagedKeyInfo}
   */
  private asManagedKeyInfo(arg: ImportableKey): Partial<IKey> {
    let key: Partial<IKey>
    switch (arg.type) {
      case 'BLS': {
        const secretKey = u8a.fromString(arg.privateKeyHex.toLowerCase(), 'base16')
        const publicKeyHex = u8a.toString(extractPublicKeyFromSecretKey(secretKey), 'base16')
        key = {
          type: arg.type,
          kid: arg.alias || publicKeyHex,
          publicKeyHex,
          meta: {
            algorithms: ['BLS'],
          },
        }
        break
      }
      default:
        throw Error('not_supported: Key type not supported: ' + arg.type)
    }
    return key
  }
}
