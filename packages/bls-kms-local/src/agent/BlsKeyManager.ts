import { AbstractKeyStore } from '../types/abstract-key-store'
import { schema } from "../index";
import {
    IAgentPlugin
} from '@veramo/core'

import {IKey, MinimalImportableKey} from "../types/IIdentifier";
import {
    IBlsKeyManager,
    IKeyManagerCreateArgs,
    IKeyManagerDeleteArgs,
    IKeyManagerGetArgs,
    IKeyManagerSignArgs
} from "../types/IBlsKeyManager";
import {IBlsKeyManagementSystem} from "../types/IBlsKeyManagementSystem";

export class BlsKeyManager implements IAgentPlugin {

    readonly methods: IBlsKeyManager
    readonly schema = schema.IBlsKeyManager
    private store: AbstractKeyStore
    private kms: Record<string, IBlsKeyManagementSystem>

    constructor(options: { store: AbstractKeyStore; kms: Record<string, IBlsKeyManagementSystem> }) {
        this.store = options.store
        this.kms = options.kms
        this.methods = {
            keyManagerGetKeyManagementSystems: this.keyManagerGetKeyManagementSystems.bind(this),
            keyManagerCreate: this.keyManagerCreate.bind(this),
            keyManagerGet: this.keyManagerGet.bind(this),
            keyManagerDelete: this.keyManagerDelete.bind(this),
            keyManagerImport: this.keyManagerImport.bind(this),
            keyManagerSign: this.keyManagerSign.bind(this),
        }
    }

    private getKms(name: string): IBlsKeyManagementSystem {
        const kms = this.kms[name]
        if (!kms) {
            throw Error(`invalid_argument: This agent has no registered KeyManagementSystem with name='${name}'`)
        }
        return kms
    }

    async keyManagerGetKeyManagementSystems(): Promise<Array<string>> {
        return Object.keys(this.kms)
    }

    async keyManagerCreate(args: IKeyManagerCreateArgs): Promise<Partial<IKey>> {
        const kms = this.getKms(args.kms)
        const partialKey = await kms.createKey({ type: args.type, meta: args.meta })
        const key = { ...partialKey, kms: args.kms }
        if (args.meta || key.meta) {
            key.meta = { ...args.meta, ...key.meta }
        }
        await this.store.import(key)
        if (key.privateKeyHex) {
            delete key.privateKeyHex
        }
        return key
    }

    async keyManagerGet({ kid }: IKeyManagerGetArgs): Promise<IKey> {
        return this.store.get({ kid })
    }

    async keyManagerDelete({ kid }: IKeyManagerDeleteArgs): Promise<boolean> {
        const key = await this.store.get({ kid })
        const kms = this.getKms(key.kms)
        await kms.deleteKey({ alias: kid })
        return this.store.delete({ kid })
    }

    async keyManagerImport(key: MinimalImportableKey): Promise<Partial<IKey>> {
        const kms = this.getKms(key.kms)
        const managedKey = await kms.importKey(key)
        const { meta } = key
        const importedKey = { ...managedKey, meta: { ...meta, ...managedKey.meta }, kms: key.kms }
        await this.store.import(importedKey)
        return importedKey
    }

    async keyManagerSign(args: IKeyManagerSignArgs): Promise<string> {
        const keyInfo: IKey = await this.store.get({ kid: args.keyRef })
        const kms = this.getKms(keyInfo.kms)
        return kms.sign({ keyRef: keyInfo, data: args.data })
    }
}
