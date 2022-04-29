import {blsSign, generateBls12381G2KeyPair} from '@mattrglobal/node-bbs-signatures'
import Debug from 'debug'

import {IKey, ImportableKey, ManagedKey, MinimalImportableKey, TKeyType} from '../types/IIdentifier'
import {AbstractPrivateKeyStore} from "../types/abstract-private-key-store";
import {IBlsKeyManagementSystem} from "../types/IBlsKeyManagementSystem";

const debug = Debug('veramo:kms:bls:local')

export class BlsKeyManagementSystem implements IBlsKeyManagementSystem {

  readonly methods: IBlsKeyManagementSystem = {
    importKey: this.importKey.bind(this),
    listKeys: this.listKeys.bind(this),
    createKey: this.createKey.bind(this),
    deleteKey: this.deleteKey.bind(this),
    sign: this.sign.bind(this),
  }

  private readonly keyStore: AbstractPrivateKeyStore

  constructor(keyStore: AbstractPrivateKeyStore) {
    this.keyStore = keyStore
  }

  async importKey(args: Omit<MinimalImportableKey, 'kms'>): Promise<Partial<IKey>> {
    if (!args.type || !args.privateKeyHex || !args.publicKeyHex) {
      throw new Error('invalid_argument: type, publicKeyHex and privateKeyHex are required to import a key')
    }
    const ikey = this.asPartialKey({ alias: args.kid, ...args })
    await this.keyStore.import({ alias: ikey.kid, ...args })
    debug('imported key', ikey.type, ikey.publicKeyHex)
    return ikey
  }

  async listKeys(): Promise<Partial<IKey>[]> {
    const keys = await this.keyStore.list({})
    return keys.map((key) => this.asPartialKey(key as ImportableKey))
  }

  async createKey({ type }: { type: TKeyType }): Promise<Partial<IKey>> {
    let key: Partial<IKey>

    switch (type) {
      case 'BLS': {
        const keyPairBls12381G2 = await generateBls12381G2KeyPair()
        key = await this.importKey({
          type,
          privateKeyHex: Buffer.from(keyPairBls12381G2.secretKey).toString("hex"),
          publicKeyHex: Buffer.from(keyPairBls12381G2.publicKey).toString("hex"),
        })
        break
      }
      default:
        throw Error('not_supported: Key type not supported: ' + type)
    }

    debug('Created key', type, key.publicKeyHex)

    return key
  }

  async deleteKey(args: { alias: string }) {
    return await this.keyStore.delete({ alias: args.alias })
  }

  async sign({ keyRef, data }: { keyRef: Pick<IKey, 'kid'>; data: Uint8Array[] }): Promise<string> {
    let managedKey: ManagedKey
    try {
      managedKey = await this.keyStore.get({ alias: keyRef.kid })
    } catch (e) {
      throw new Error(`key_not_found: No key entry found for kid=${keyRef.kid}`)
    }

    if (managedKey.type === 'BLS') {
      return Buffer.from(
        await blsSign({
          keyPair: {
            secretKey: Uint8Array.from(Buffer.from(managedKey.privateKeyHex, "hex")),
            publicKey: Uint8Array.from(Buffer.from(managedKey.publicKeyHex, "hex")),
          },
          messages: data,
        })
      ).toString("hex");
    }
    throw Error(`not_supported: Cannot sign using key of type ${managedKey.type}`)
  }

  /**
   * Converts a {@link ImportableKey} to {@link PartialKey}
   */
  private asPartialKey(arg: ImportableKey): Partial<IKey> {
    let key: Partial<IKey>
    switch (arg.type) {
      case 'BLS': {
        key = {
          type: arg.type,
          kid:  arg.alias || arg.publicKeyHex,
          publicKeyHex: arg.publicKeyHex,
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
