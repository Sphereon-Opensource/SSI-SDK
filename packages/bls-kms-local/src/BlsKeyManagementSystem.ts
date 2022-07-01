import { blsSign, generateBls12381G2KeyPair } from '@mattrglobal/node-bbs-signatures'
import Debug from 'debug'

import { IKey, ManagedKeyInfo, MinimalImportableKey, TKeyType } from '@veramo/core'
import { AbstractPrivateKeyStore, ManagedPrivateKey } from '@veramo/key-manager'
import { KeyManagementSystem } from '@veramo/kms-local'
import { BlsManagedKeyInfoArgs, KeyType } from './index'

const debug = Debug('veramo:kms:bls:local')

export class BlsKeyManagementSystem extends KeyManagementSystem {
  private readonly privateKeyStore: AbstractPrivateKeyStore

  constructor(keyStore: AbstractPrivateKeyStore) {
    super(keyStore)
    this.privateKeyStore = keyStore
  }

  async importKey(args: Exclude<MinimalImportableKey, 'kms'>): Promise<ManagedKeyInfo> {
    switch (args.type) {
      case KeyType.Bls12381G2.toString():
        if (!args.type || !args.privateKeyHex || !args.publicKeyHex) {
          throw new Error('invalid_argument: type, publicKeyHex and privateKeyHex are required to import a key')
        }
        const managedKey = this.asBlsManagedKeyInfo({
          alias: args.kid,
          privateKeyHex: args.privateKeyHex,
          publicKeyHex: args.publicKeyHex,
          type: args.type,
        })
        await this.privateKeyStore.import({ alias: managedKey.kid, ...args })
        debug('imported key', managedKey.type, managedKey.publicKeyHex)
        return managedKey
      default:
        return super.importKey(args) as Promise<ManagedKeyInfo>
    }
  }

  async createKey({ type }: { type: TKeyType }): Promise<ManagedKeyInfo> {
    let key: ManagedKeyInfo
    switch (type) {
      case KeyType.Bls12381G2: {
        const keyPairBls12381G2 = await generateBls12381G2KeyPair()
        key = await this.importKey({
          kms: 'local',
          type,
          privateKeyHex: Buffer.from(keyPairBls12381G2.secretKey).toString('hex'),
          publicKeyHex: Buffer.from(keyPairBls12381G2.publicKey).toString('hex'),
        })
        break
      }
      default:
        key = await super.createKey({ type })
    }

    debug('Created key', type, key.publicKeyHex)

    return key
  }

  async sign({ keyRef, algorithm, data }: { keyRef: Pick<IKey, 'kid'>; algorithm?: string; data: Uint8Array }): Promise<string> {
    let privateKey: ManagedPrivateKey
    try {
      privateKey = await this.privateKeyStore.get({ alias: keyRef.kid })
    } catch (e) {
      throw new Error(`key_not_found: No key entry found for kid=${keyRef.kid}`)
    }

    if (privateKey.type !== KeyType.Bls12381G2) {
      return await super.sign({ keyRef, algorithm, data })
    } else if (privateKey.type === KeyType.Bls12381G2) {
      if (!data || Array.isArray(data)) {
        throw new Error('Data must be defined and cannot be an array')
      }
      const keyPair = {
        keyPair: {
          secretKey: Uint8Array.from(Buffer.from(privateKey.privateKeyHex, 'hex')),
          publicKey: Uint8Array.from(Buffer.from(keyRef.kid, 'hex')),
        },
        messages: [data],
      }
      return Buffer.from(await blsSign(keyPair)).toString('hex')
    }
    throw Error(`not_supported: Cannot sign using key of type ${privateKey.type}`)
  }

  private asBlsManagedKeyInfo(args: BlsManagedKeyInfoArgs): ManagedKeyInfo {
    let key: Partial<ManagedKeyInfo>
    switch (args.type) {
      case KeyType.Bls12381G2:
        key = {
          type: args.type,
          kid: args.alias || args.publicKeyHex,
          publicKeyHex: args.publicKeyHex,
          meta: {
            algorithms: ['BLS'],
          },
        }
        break
      default:
        throw Error('not_supported: Key type not supported: ' + args.type)
    }
    return key as ManagedKeyInfo
  }
}
