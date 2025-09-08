import { calculateJwkThumbprintForKey, toJwk, verifyRawSignature } from '@sphereon/ssi-sdk-ext.key-utils'
import type { IKey, KeyMetadata, ManagedKeyInfo } from '@veramo/core'
import { AbstractKeyManagementSystem, AbstractKeyStore, KeyManager as VeramoKeyManager } from '@veramo/key-manager'
// @ts-ignore
import * as u8a from 'uint8arrays'
import {
  hasKeyOptions,
  type IKeyManagerGetArgs,
  type ISphereonKeyManager,
  type ISphereonKeyManagerCreateArgs,
  type ISphereonKeyManagerHandleExpirationsArgs,
  type ISphereonKeyManagerSignArgs,
  type ISphereonKeyManagerVerifyArgs,
} from '../types/ISphereonKeyManager'

const { fromString } = u8a

export const sphereonKeyManagerMethods: Array<string> = [
  'keyManagerCreate',
  'keyManagerGet',
  'keyManagerImport',
  'keyManagerSign',
  'keyManagerVerify',
  'keyManagerListKeys',
  'keyManagerGetDefaultKeyManagementSystem',
  'keyManagerHandleExpirations',
]

export class SphereonKeyManager extends VeramoKeyManager {
  // local store reference, given the superclass store is private, and we need additional functions/calls
  private kmsStore: AbstractKeyStore
  private readonly availableKmses: Record<string, AbstractKeyManagementSystem>
  public _defaultKms: string
  readonly kmsMethods: ISphereonKeyManager

  constructor(options: { store: AbstractKeyStore; kms: Record<string, AbstractKeyManagementSystem>; defaultKms?: string }) {
    super({ store: options.store, kms: options.kms })
    this.kmsStore = options.store
    this.availableKmses = options.kms
    this._defaultKms = options.defaultKms ?? Object.keys(this.availableKmses)[0]
    if (!Object.keys(this.availableKmses).includes(this._defaultKms)) {
      throw Error(`Default KMS needs to be listed in the kms object as well. Found kms-es: ${Object.keys(this.availableKmses).join(',')}`)
    }
    const methods = this.methods
    methods.keyManagerVerify = this.keyManagerVerify.bind(this)
    methods.keyManagerListKeys = this.keyManagerListKeys.bind(this)
    methods.keyManagerGetDefaultKeyManagementSystem = this.keyManagerGetDefaultKeyManagementSystem.bind(this)
    this.kmsMethods = <ISphereonKeyManager>(<unknown>methods)
  }

  keyManagerGetDefaultKeyManagementSystem(): Promise<string> {
    return Promise.resolve(this._defaultKms)
  }

  override async keyManagerCreate(args: ISphereonKeyManagerCreateArgs): Promise<ManagedKeyInfo> {
    const kms = this.getKmsByName(args.kms ?? this._defaultKms)
    const meta: KeyMetadata = { ...args.meta, ...(args.opts && { opts: args.opts }) }
    if (hasKeyOptions(meta) && meta.opts?.ephemeral && !meta.opts.expiration?.removalDate) {
      // Make sure we set a delete date on an ephemeral key
      meta.opts = {
        ...meta.opts,
        expiration: { ...meta.opts?.expiration, removalDate: new Date(Date.now() + 5 * 60 * 1000) },
      }
    }
    const partialKey = await kms.createKey({ type: args.type, meta })
    const key: IKey = { ...partialKey, kms: args.kms ?? this._defaultKms }
    key.meta = { ...meta, ...key.meta }
    key.meta.jwkThumbprint = key.meta.jwkThumbprint ?? calculateJwkThumbprintForKey({ key })

    await this.kmsStore.import(key)
    if (key.privateKeyHex) {
      // Make sure to not export the private key
      delete key.privateKeyHex
    }
    return key
  }

  //FIXME extend the IKeyManagerSignArgs.data to be a string or array of strings

  async keyManagerSign(args: ISphereonKeyManagerSignArgs): Promise<string> {
    const keyInfo = await this.keyManagerGet({ kid: args.keyRef })
    const kms = this.getKmsByName(keyInfo.kms)
    if (keyInfo.type === 'Bls12381G2') {
      return await kms.sign({ keyRef: keyInfo, data: typeof args.data === 'string' ? fromString(args.data) : args.data })
    }
    // @ts-ignore // we can pass in uint8arrays as well, which the super also can handle but does not expose in its types
    return await super.keyManagerSign({ ...args, keyRef: keyInfo.kid })
  }

  async keyManagerVerify(args: ISphereonKeyManagerVerifyArgs): Promise<boolean> {
    if (args.kms) {
      const kms = this.getKmsByName(args.kms)
      if (kms && 'verify' in kms && typeof kms.verify === 'function') {
        // @ts-ignore
        return await kms.verify(args)
      }
    }
    return await verifyRawSignature({
      key: toJwk(args.publicKeyHex, args.type),
      data: args.data,
      signature: fromString(args.signature, 'utf-8'),
    })
  }

  async keyManagerListKeys(): Promise<ManagedKeyInfo[]> {
    return this.kmsStore.list({})
  }

  async keyManagerHandleExpirations(args: ISphereonKeyManagerHandleExpirationsArgs): Promise<Array<ManagedKeyInfo>> {
    const keys = await this.keyManagerListKeys()
    const expiredKeys = keys
      .filter((key) => hasKeyOptions(key.meta))
      .filter((key) => {
        if (hasKeyOptions(key.meta) && key.meta?.opts?.expiration) {
          const expiration = key.meta.opts.expiration
          return !(expiration.expiryDate && expiration.expiryDate.getMilliseconds() > Date.now())
        }
        return false
      })
    if (args.skipRemovals !== true) {
      await Promise.all(expiredKeys.map((key) => this.keyManagerDelete({ kid: key.kid })))
    }
    return keys
  }

  private getKmsByName(name: string): AbstractKeyManagementSystem {
    const kms = this.availableKmses[name]
    if (!kms) {
      throw Error(`invalid_argument: This agent has no registered KeyManagementSystem with name='${name}'`)
    }
    return kms
  }

  //todo https://sphereon.atlassian.net/browse/SDK-28 improve the logic for keyManagerGet in sphereon-key-manager
  async keyManagerGet({ kid }: IKeyManagerGetArgs): Promise<IKey> {
    try {
      const key = await this.kmsStore.get({ kid })
      return key
    } catch (e) {
      const keys: ManagedKeyInfo[] = await this.keyManagerListKeys()
      const foundKey = keys.find(
        (key) =>
          key.publicKeyHex === kid ||
          key.meta?.jwkThumbprint === kid ||
          (key.meta?.jwkThumbprint == null && calculateJwkThumbprintForKey({ key }) === kid)
      )
      if (foundKey) {
        return foundKey as IKey
      } else {
        throw new Error(`Key with kid ${kid} not found`)
      }
    }
  }

  get defaultKms(): string {
    return this._defaultKms
  }

  set defaultKms(kms: string) {
    if (!Object.keys(this.availableKmses).includes(kms)) {
      throw Error(`Default KMS needs to be listed in the kms object as well. Found kms-es: ${Object.keys(this.availableKmses).join(',')}`)
    }
    this._defaultKms = kms
  }

  setKms(name: string, kms: AbstractKeyManagementSystem): void {
    this.availableKmses[name] = kms
  }
}
