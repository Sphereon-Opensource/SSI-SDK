import { TKeyType as VeramoTKeyType, IKey as VeramoIKey, ManagedKeyInfo, MinimalImportableKey as VeramoMinimalImportableKey, RequireOnly } from '@veramo/core'
import { ManagedPrivateKey as VeramoManagedPrivateKey } from '@veramo/key-manager'
import { generateBls12381G2KeyPair, blsSign } from '@mattrglobal/bbs-signatures'

import {
    extractPublicKeyFromSecretKey,
} from '@stablelib/ed25519'
import * as u8a from 'uint8arrays'
import Debug from 'debug'
const debug = Debug('veramo:kms:local')

export type TKeyType = VeramoTKeyType | "BLS"
export type IKey = Omit<VeramoIKey, 'type'> & { type: TKeyType }
export type MinimalImportableKey = Omit<VeramoMinimalImportableKey, 'type'> & { type: TKeyType }
export type ManagedPrivateKey = Omit<VeramoManagedPrivateKey, 'type'> & { type: TKeyType }
export type ImportablePrivateKey = RequireOnly<ManagedPrivateKey, 'privateKeyHex' | 'type'>

export abstract class AbstractPrivateBlsKeyStore {
    abstract import(args: ImportablePrivateKey): Promise<ManagedPrivateKey>
    abstract get(args: { alias: string }): Promise<IKey>
    abstract delete(args: { alias: string }): Promise<boolean>
    abstract list(args: {}): Promise<Array<ManagedPrivateKey>>
}

export class BlsKeyManagementSystem {

    private readonly keyStore: AbstractPrivateBlsKeyStore

    constructor(keyStore: AbstractPrivateBlsKeyStore) {
        this.keyStore = keyStore
    }

    async importKey(args: Omit<MinimalImportableKey, 'kms'>): Promise<ManagedKeyInfo> {
        if (!args.type || !args.privateKeyHex) {
            throw new Error('invalid_argument: type and privateKeyHex are required to import a key')
        }
        const managedKey = this.asManagedKeyInfo({ alias: args.kid, ...args })
        await this.keyStore.import({ alias: managedKey.kid, ...args })
        debug('imported key', managedKey.type, managedKey.publicKeyHex)
        return managedKey
    }

    async listKeys(): Promise<ManagedKeyInfo[]> {
        const privateKeys = await this.keyStore.list({})
        const managedKeys = privateKeys.map((key) => this.asManagedKeyInfo(key))
        return managedKeys
    }

    async createKey({ type }: { type: TKeyType }): Promise<ManagedKeyInfo> {
        let key: ManagedKeyInfo

        switch (type) {
            case 'BLS': {
                const keyPairBls12381G2 = await generateBls12381G2KeyPair();
                key = await this.importKey({
                    type,
                    privateKeyHex: Buffer.from(keyPairBls12381G2.secretKey.buffer).toString(),
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
        return await this.keyStore.delete({ alias: args.kid })
    }

    async sign({
                   keyRef,
                   data,
               }: {
        keyRef: Pick<IKey, 'kid'>
        data: Uint8Array
    }): Promise<string> {
        let managedKey: IKey
        try {
            managedKey = await this.keyStore.get({ alias: keyRef.kid })
        } catch (e) {
            throw new Error(`key_not_found: No key entry found for kid=${keyRef.kid}`)
        }

        if (managedKey.type === 'BLS') {
           return Buffer.from(await blsSign({
                keyPair: { secretKey: new Uint8Array(Buffer.from(managedKey.privateKeyHex as string)), publicKey: new Uint8Array(Buffer.from(managedKey.publicKeyHex))},
               messages: [data]
            })).toString()
        }
        throw Error(`not_supported: Cannot sign using key of type ${managedKey.type}`)
    }

    /**
     * Converts a {@link ManagedPrivateKey} to {@link ManagedKeyInfo}
     */
    private asManagedKeyInfo(args: RequireOnly<ManagedPrivateKey, 'privateKeyHex' | 'type'>): ManagedKeyInfo {
        let key: Partial<IKey>
        switch (args.type) {
            case 'BLS': {
                const secretKey = u8a.fromString(args.privateKeyHex.toLowerCase(), 'base16')
                const publicKeyHex = u8a.toString(extractPublicKeyFromSecretKey(secretKey), 'base16')
                key = {
                    type: args.type,
                    kid: args.alias || publicKeyHex,
                    publicKeyHex,
                    meta: {
                        algorithms: ['BLS'],
                    },
                }
                break
            }
            default:
                throw Error('not_supported: Key type not supported: ' + args.type)
        }
        return key as ManagedKeyInfo
    }
}
