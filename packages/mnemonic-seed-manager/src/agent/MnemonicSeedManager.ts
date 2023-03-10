import * as crypto from 'crypto'
import { derivePath, getMasterKeyFromSeed, getPublicKey } from 'ed25519-hd-key'
import { IAgentPlugin, ManagedKeyInfo } from '@veramo/core'
import { AbstractSecretBox } from '@veramo/key-manager'
import * as bip39 from 'bip39'
import { DataSource } from 'typeorm'

import {
  DeleteResult,
  IMnemonicGeneratorArgs,
  IMnemonicInfoKeyResult,
  IMnemonicInfoResult,
  IMnemonicInfoStoreArgs,
  IMnemonicVerificationArgs,
  IPartialMnemonicVerificationArgs,
  IRequiredContext,
  ISeedGeneratorArgs,
  schema,
  UpdateResult,
} from '../index'
import { IMnemonicSeedManager } from '../types/IMnemonicSeedManager'

import { MnemonicEntity } from '../entities/MnemonicEntity'

/**
 * @public
 */
export class MnemonicSeedManager implements IAgentPlugin {
  readonly schema = schema.IMnemonicInfoGenerator
  readonly methods: IMnemonicSeedManager = {
    generateMnemonic: this.generateMnemonic.bind(this),
    generateSeed: this.generateSeed.bind(this),
    verifyMnemonic: this.verifyMnemonic.bind(this),
    verifyPartialMnemonic: this.verifyPartialMnemonic.bind(this),
    saveMnemonicInfo: this.saveMnemonicInfo.bind(this),
    getMnemonicInfo: this.getMnemonicInfo.bind(this),
    deleteMnemonicInfo: this.deleteMnemonicInfo.bind(this),
    generateMasterKey: this.generateMasterKey.bind(this),
    generateKeysFromMnemonic: this.generateKeysFromMnemonic.bind(this),
  }

  constructor(private dbConnection: Promise<DataSource>, private secretBox?: AbstractSecretBox) {
    if (!secretBox) {
      console.warn('Please provide SecretBox to the KeyStore')
    }
  }

  private async generateMnemonic(args: IMnemonicGeneratorArgs): Promise<IMnemonicInfoResult> {
    const mnemonic = bip39.generateMnemonic(args.bits)
    if (args.persist) {
      return await this.saveMnemonicInfo({ id: args.id, mnemonic: mnemonic.split(' ') })
    }
    return { mnemonic: mnemonic.split(' ') }
  }

  private async verifyMnemonic(args: IMnemonicVerificationArgs): Promise<IMnemonicInfoResult> {
    const mnemonicInfo = await this.getMnemonicInfo({ id: args.id, hash: args.hash })
    if (mnemonicInfo?.mnemonic) {
      return { succeeded: mnemonicInfo.mnemonic.join(' ') === args.wordList?.join(' ') }
    }
    throw new Error('Mnemonic not found')
  }

  private async verifyPartialMnemonic(args: IPartialMnemonicVerificationArgs): Promise<IMnemonicInfoResult> {
    const mnemonicInfo = await this.getMnemonicInfo({ id: args.id, hash: args.hash })
    if (mnemonicInfo?.mnemonic) {
      return { succeeded: args.indexedWordList.every((indexedWord) => mnemonicInfo.mnemonic?.indexOf(indexedWord[1]) === indexedWord[0]) }
    }
    throw new Error('Mnemonic not found')
  }

  private async generateSeed(args: ISeedGeneratorArgs): Promise<IMnemonicInfoResult> {
    return Promise.resolve({
      seed: (await bip39.mnemonicToSeed(args.mnemonic.join(' '))).toString('hex'),
    })
  }

  private async saveMnemonicInfo(args: IMnemonicInfoStoreArgs): Promise<IMnemonicInfoResult> {
    if (args.mnemonic && this.secretBox) {
      const mnemonic = args.mnemonic.join(' ')
      const hash = crypto.createHash('sha256').update(mnemonic).digest('hex')
      const mnemonicInfo = new MnemonicEntity()
      mnemonicInfo.id = args.id ? args.id : hash
      mnemonicInfo.hash = hash
      mnemonicInfo.mnemonic = await this.secretBox.encrypt(mnemonic)
      const result = await (await this.dbConnection).getRepository(MnemonicEntity).save(mnemonicInfo)
      return Promise.resolve({
        id: result.id,
        hash: result.hash,
        mnemonic: args.mnemonic,
      })
    } else {
      throw new Error('Mnemonic needs to be provided.')
    }
  }

  private async getMnemonicInfo(args: IMnemonicInfoStoreArgs): Promise<IMnemonicInfoResult> {
    const mnemonicInfo = await (await this.dbConnection)
      .getRepository(MnemonicEntity)
      .createQueryBuilder()
      .where('id = :id', { id: args.id })
      .orWhere('hash = :hash', { hash: args.hash })
      .getOne()
    if (mnemonicInfo?.mnemonic) {
      const mnemonicStr = await this.secretBox?.decrypt(mnemonicInfo.mnemonic)
      return {
        id: mnemonicInfo.id,
        hash: mnemonicInfo.hash,
        mnemonic: mnemonicStr?.split(' '),
      }
    }
    return {}
  }

  private async deleteMnemonicInfo(args: IMnemonicInfoStoreArgs): Promise<DeleteResult> {
    return (await this.dbConnection)
      .createQueryBuilder()
      .delete()
      .from(MnemonicEntity)
      .where('id = :id', { id: args.id })
      .orWhere('hash = :hash', { hash: args.hash })
      .execute()
  }

  private async saveMasterKey(args: IMnemonicInfoStoreArgs): Promise<UpdateResult> {
    if (args.masterKey) {
      return (await this.dbConnection)
        .createQueryBuilder()
        .update(MnemonicEntity)
        .set({ masterKey: args.masterKey })
        .where('id = :id', { id: args.id })
        .orWhere('hash = :hash', { hash: args.hash })
        .execute()
    }
    throw new Error('Master Key needs to be provided.')
  }

  private async generateMasterKey(args: IMnemonicInfoStoreArgs): Promise<IMnemonicInfoKeyResult> {
    const mnemonic = (await this.getMnemonicInfo({ id: args.id, hash: args.hash })).mnemonic
    if (mnemonic) {
      const mnemonicInfo = await this.generateSeed({ mnemonic })
      if (mnemonicInfo.seed) {
        if (args.type === 'Ed25519') {
          const { key, chainCode } = getMasterKeyFromSeed(mnemonicInfo.seed)
          await this.saveMasterKey({ masterKey: key.toString('hex'), chainCode: chainCode.toString('hex') })
          return { masterKey: key.toString('hex'), chainCode: chainCode.toString('hex') }
        } else {
          throw new Error('Secp256k1 keys are not supported yet')
        }
      }
    }
    throw new Error('Mnemonic not found')
  }

  private async generateKeysFromMnemonic(args: IMnemonicInfoStoreArgs, context: IRequiredContext): Promise<ManagedKeyInfo> {
    const mnemonic = (await this.getMnemonicInfo({ id: args.id, hash: args.hash })).mnemonic
    if (mnemonic && context) {
      if (args.path && args.kms) {
        const seed = (await this.generateSeed({ mnemonic })).seed as string
        const { key, chainCode } = derivePath(args.path, seed)
        const extPrivateKey = Buffer.concat([key, chainCode])
        //FIXME it doesn't use any secp256k1 library to generate the public key, so it doesn't generate an extended key
        const publicKey = getPublicKey(key, args.withZeroBytes)
        return await context.agent.keyManagerImport({
          privateKeyHex: extPrivateKey.toString('hex'),
          publicKeyHex: publicKey.toString('hex'),
          type: 'Ed25519',
          kms: args.kms,
        })
      }
      throw new Error('Please provide kms and derivation path')
    }
    throw new Error('Master Key not found')
  }
}
