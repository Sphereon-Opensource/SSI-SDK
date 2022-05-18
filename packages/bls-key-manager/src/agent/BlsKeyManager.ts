import { KeyManager, AbstractKeyManagementSystem, AbstractKeyStore } from '@veramo/key-manager'

import { IKey, IKeyManagerSignArgs, TKeyType } from '@veramo/core'
import { KeyType } from '@sphereon/ssi-sdk-bls-kms-local'

export class BlsKeyManager extends KeyManager {
  private localStore: AbstractKeyStore
  private localKms: Record<string, AbstractKeyManagementSystem>

  constructor(options: { store: AbstractKeyStore; kms: Record<string, AbstractKeyManagementSystem> }) {
    super({ store: options.store, kms: options.kms })
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

  //FIXME extend the IKeyManagerSignArgs.data to be a string or array of strings
  async keyManagerSign(args: IKeyManagerSignArgs): Promise<string> {
    const keyInfo: IKey = (await this.localStore.get({ kid: args.keyRef })) as IKey
    const kms = this.getLocalKms(keyInfo.kms)
    if (keyInfo.type === <TKeyType>KeyType.Bls12381G2) {
      return await kms.sign({ keyRef: keyInfo, data: Uint8Array.from(Buffer.from(args.data)) })
    }
    return await super.keyManagerSign({ keyRef: args.keyRef, data: args.data })
  }
}
