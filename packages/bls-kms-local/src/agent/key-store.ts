import { AbstractKeyStore } from '../types/abstract-key-store'
import { Connection } from 'typeorm'

import { Key } from '../entities/key'

import Debug from 'debug'
import { IKey, ManagedKeyInfo } from '../types/IIdentifier'
const debug = Debug('veramo:typeorm:key-store')

export class KeyStore implements AbstractKeyStore {
  constructor(private dbConnection: Promise<Connection>) {
    //super()
  }

  async get({ kid }: { kid: string }): Promise<IKey> {
    const key = await (await this.dbConnection).getRepository(Key).findOne(kid)
    if (!key) throw Error('Key not found')
    return key as IKey
  }

  async delete({ kid }: { kid: string }) {
    const key = await (await this.dbConnection).getRepository(Key).findOne(kid)
    if (!key) throw Error('Key not found')
    debug('Deleting key', kid)
    await (await this.dbConnection).getRepository(Key).remove(key)
    return true
  }

  async import(args: IKey) {
    const key = new Key()
    key.kid = args.kid
    key.publicKeyHex = args.publicKeyHex
    key.type = args.type
    key.kms = args.kms
    key.meta = args.meta
    debug('Saving key', args.kid)
    await (await this.dbConnection).getRepository(Key).save(key)
    return true
  }

  async list(args: {} = {}): Promise<IKey[]> {
    const keys = await (await this.dbConnection).getRepository(Key).find()
    const managedKeys: ManagedKeyInfo[] = keys.map((key) => {
      const { kid, publicKeyHex, type, meta, kms } = key
      return { kid, publicKeyHex, type, meta, kms } as IKey
    })
    return managedKeys
  }
}
