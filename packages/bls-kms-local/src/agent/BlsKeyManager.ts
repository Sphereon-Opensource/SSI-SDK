import { KeyManager, AbstractKeyManagementSystem, AbstractKeyStore } from '@veramo/key-manager'

import {
    IKey, IKeyManagerSignArgs, TKeyType
} from '@veramo/core'

export class BlsKeyManager extends KeyManager {

    private localStore: AbstractKeyStore
    private localKms: Record<string, AbstractKeyManagementSystem>

    constructor(options: { store: AbstractKeyStore; kms: Record<string, AbstractKeyManagementSystem> }) {
        super({ store: options.store, kms: options.kms})
        this.localStore = options.store
        this.localKms = options.kms
    }

    private getLocalKms(name: string): AbstractKeyManagementSystem {
        const kms = this.localKms[name]
        if (!kms) {
            throw Error(`invalid_argument: This agent has no registered KeyManagementSystem with name='${name}'`)
        }
        return kms
    }

    async keyManagerSign(args: Omit<IKeyManagerSignArgs, 'data'> & { data: string | string[]}): Promise<string> {
        const keyInfo: IKey = await this.localStore.get({ kid: args.keyRef }) as IKey
        const kms = this.getLocalKms(keyInfo.kms)
        let input: any;
        if (Array.isArray(args.data)) {
            input = args.data.map(s => Uint8Array.from(Buffer.from(s)));
        } else {
            input = Uint8Array.from(Buffer.from(args.data));
        }
        if (keyInfo.type === <TKeyType>'Bls12381G2') {
            return await kms.sign({ keyRef: keyInfo, data: input })
        }
        return await super.keyManagerSign({keyRef: args.keyRef, data: input})
    }
}
