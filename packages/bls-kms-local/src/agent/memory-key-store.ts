import {AbstractKeyStore} from "../types/abstract-key-store";
import {IKey, ImportableKey, ManagedKey} from "../types/IIdentifier";
import {v4 as uuidv4} from "uuid";
import {AbstractPrivateKeyStore, ManagedPrivateKey} from "../types/abstract-private-key-store";

export class MemoryPrivateKeyStore extends AbstractPrivateKeyStore {

  private privateKeys: Record<string, ManagedKey> = {}

  async get({ alias }: { alias: string }): Promise<ManagedKey> {
    const key = this.privateKeys[alias]
    if (!key) throw Error(`not_found: PrivateKey not found for alias=${alias}`)
    return key
  }

  async delete({ alias }: { alias: string }) {
    delete this.privateKeys[alias]
    return true
  }

  async import(args: ImportableKey) {
    const alias = args.alias || uuidv4()
    const existingEntry = this.privateKeys[alias]
    if (existingEntry && existingEntry.privateKeyHex !== args.privateKeyHex) {
      throw new Error('key_already_exists: key exists with different data, please use a different alias')
    }
    this.privateKeys[alias] = { ...args, alias }
    return this.privateKeys[alias]
  }

  async list(): Promise<Array<ManagedPrivateKey>> {
    return [...Object.values(this.privateKeys)]
  }
}

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

  async import(args: IKey): Promise<boolean> {
    this.keys[args.kid] = {...args}
    return true;
  }

  async list(args: {}): Promise<Array<IKey>> {
    const safeKeys = Object.values(this.keys).map((key) => {
      const { privateKeyHex, ...safeKey } = key
      return safeKey
    })
    return safeKeys as IKey[]
  }
}
