import {AbstractKeyStore} from "../types/abstract-key-store";
import {IKey} from "../types/IIdentifier";

export class MemoryKeyStore extends AbstractKeyStore {

  private keys: Record<string, Partial<IKey>> = {}

  async get({ kid }: { kid: string }): Promise<IKey> {
    const key = this.keys[kid]
    if (!key) throw Error('Key not found')
    return key as IKey
  }

  async delete({ kid }: { kid: string }) {
    delete this.keys[kid]
    return true
  }

  async import(args: Partial<IKey>): Promise<boolean> {
    if (args.kid) {
      this.keys[args.kid] = {...args}
      return false;
    }
    return true
  }

  async list(args: {}): Promise<Array<IKey>> {
    const safeKeys = Object.values(this.keys).map((key) => {
      const { privateKeyHex, ...safeKey } = key
      return safeKey
    })
    return safeKeys as IKey[]
  }
}
