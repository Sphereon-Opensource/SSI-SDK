import * as crypto from 'crypto'

import { IAgentPlugin } from '@veramo/core'
import { AbstractSecretBox } from '@veramo/key-manager'
import * as bip39 from 'bip39'
import { Connection } from 'typeorm'

import {
  DeleteResult,
  IMnemonicGeneratorArgs,
  IMnemonicInfoResult,
  IMnemonicInfoStoreArgs,
  IMnemonicVerificationArgs,
  IPartialMnemonicVerificationArgs,
  ISeedGeneratorArgs,
  schema,
} from '../index'
import { IMnemonicInfoGenerator } from '../types/IMnemonicInfoGenerator'

import { MnemonicInfo } from './entity/mnemonicInfo'

export class MnemonicInfoGenerator implements IAgentPlugin {
  readonly schema = schema.IMnemonicInfoGenerator
  readonly methods: IMnemonicInfoGenerator = {
    generateMnemonic: this.generateMnemonic.bind(this),
    generateSeed: this.generateSeed.bind(this),
    verifyMnemonic: this.verifyMnemonic.bind(this),
    verifyPartialMnemonic: this.verifyPartialMnemonic.bind(this),
    saveMnemonicInfo: this.saveMnemonicInfo.bind(this),
    getMnemonicInfo: this.getMnemonicInfo.bind(this),
    deleteMnemonicInfo: this.deleteMnemonicInfo.bind(this),
  }

  constructor(private dbConnection: Promise<Connection>, private secretBox?: AbstractSecretBox) {
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
      seed: await bip39.mnemonicToSeed(args.mnemonic.join(' ')).then((seed) => seed.toString('hex')),
    })
  }

  private async saveMnemonicInfo(args: IMnemonicInfoStoreArgs): Promise<IMnemonicInfoResult> {
    if (args.mnemonic && this.secretBox) {
      const mnemonic = args.mnemonic.join(' ')
      const hash = crypto.createHash('sha256').update(mnemonic).digest('hex')
      const mnemonicInfo = new MnemonicInfo()
      mnemonicInfo.id = args.id ? args.id : hash
      mnemonicInfo.hash = hash
      mnemonicInfo.mnemonic = await this.secretBox.encrypt(mnemonic)
      const result = await (await this.dbConnection).getRepository(MnemonicInfo).save(mnemonicInfo)
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
      .getRepository(MnemonicInfo)
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
      .from(MnemonicInfo)
      .where('id = :id', { id: args.id })
      .orWhere('hash = :hash', { hash: args.hash })
      .execute()
  }
}
