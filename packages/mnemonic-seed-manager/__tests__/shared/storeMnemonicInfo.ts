import { IDataStore, IKeyManager, TAgent } from '@veramo/core'
import { IMnemonicSeedManager, IMnemonicInfoResult } from '../../src'

type ConfiguredAgent = TAgent<IMnemonicSeedManager & IKeyManager & IDataStore>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }) => {
  describe('database operations', () => {
    let agent: ConfiguredAgent
    let mnemonicObj: IMnemonicInfoResult

    beforeAll(() => {
      testContext.setup()
      agent = testContext.getAgent()
    })

    afterAll(testContext.tearDown)

    beforeEach(async () => {
      mnemonicObj = await agent.generateMnemonic({ bits: 256, id: 'test id', persist: true })
    })

    afterEach(async () => await agent.deleteMnemonicInfo({ hash: mnemonicObj.hash }))

    it('should return only the mnemonic, without saving anything into the database', async () => {
      const mnemonicInfo = await agent.generateMnemonic({ bits: 256, persist: false })
      expect(mnemonicInfo).toEqual({ mnemonic: mnemonicInfo.mnemonic })
      const result = await agent.getMnemonicInfo({ hash: mnemonicInfo.hash })
      expect(result).toEqual({})
    })

    it('should save a mnemonicInfo into the database with id test id', async () => {
      const mnemonic = await agent.generateMnemonic({ bits: 256 })
      const mnemonicInfo = await agent.saveMnemonicInfo({ id: 'test id', mnemonic: mnemonic.mnemonic })
      expect(mnemonicInfo.id).toEqual('test id')
    })

    it('should save a mnemonicInfo into the database with id being the hash', async () => {
      const mnemonic = await agent.generateMnemonic({ bits: 256 })
      const mnemonicInfo = await agent.saveMnemonicInfo({ mnemonic: mnemonic.mnemonic })
      expect(mnemonicInfo.id).toEqual(mnemonicInfo.hash)
    })

    it('should be found if queried by existing name', async () => {
      expect(await agent.getMnemonicInfo({ id: mnemonicObj.id })).toEqual(mnemonicObj)
    })

    it('should not be found if queried by non-existent id', async () => {
      expect(await agent.getMnemonicInfo({ id: 'non-existent' })).toEqual({})
    })

    it('should be found if queried by existing hash', async () => {
      expect(await agent.getMnemonicInfo({ hash: mnemonicObj.hash })).toEqual(mnemonicObj)
    })

    it('should not be found if queried by non-existent hash', async () => {
      expect(await agent.getMnemonicInfo({ hash: 'non-existent' })).toEqual({})
    })

    it('should be deleted if queried by existing hash', async () => {
      await agent.deleteMnemonicInfo({ hash: mnemonicObj.hash })
      expect(await agent.getMnemonicInfo({ hash: mnemonicObj.hash })).toEqual({})
    })

    it('should not be deleted if queried by non-existent hash', async () => {
      await agent.deleteMnemonicInfo({ hash: 'non-existent' })
      expect(await agent.getMnemonicInfo({ hash: mnemonicObj.hash })).toEqual(mnemonicObj)
    })

    it('should be deleted if queried by existing id', async () => {
      await agent.deleteMnemonicInfo({ id: mnemonicObj.id })
      expect(await agent.getMnemonicInfo({ id: mnemonicObj.id })).toEqual({})
    })

    it('should not be deleted if queried by non-existent id', async () => {
      await agent.deleteMnemonicInfo({ id: 'non-existent' })
      expect(await agent.getMnemonicInfo({ id: mnemonicObj.id })).toEqual(mnemonicObj)
    })

    it('should match the mnemonic if the words and order are the same', async () => {
      const mnemonic = mnemonicObj.mnemonic as string[]
      await expect(
        agent.verifyMnemonic({
          hash: mnemonicObj.hash,
          wordList: [...mnemonic],
        })
      ).resolves.toEqual({ succeeded: true })
    })

    it('should not match the mnemonic if the words or order are not the same', async () => {
      const mnemonic = mnemonicObj.mnemonic as string[]
      mnemonic[0] = 'asdfasdfasdf'
      await expect(
        agent.verifyMnemonic({
          hash: mnemonicObj.hash,
          wordList: [...mnemonic],
        })
      ).resolves.toEqual({ succeeded: false })
    })

    it('should throw exception if mnemonic does not exist', async () => {
      const mnemonic = mnemonicObj.mnemonic as string[]
      await expect(() =>
        agent.verifyMnemonic({
          hash: 'non-existent',
          wordList: [mnemonic[1], mnemonic[3], mnemonic[0], mnemonic[9], mnemonic[11]],
        })
      ).rejects.toThrowError('Mnemonic not found')
    })

    it('should match the mnemonic if the index of the words match', async () => {
      const mnemonic = mnemonicObj.mnemonic as string[]
      const indexedWordList: [number, string][] = [
        [0, mnemonic[0]],
        [1, mnemonic[1]],
        [5, mnemonic[5]],
        [7, mnemonic[7]],
        [11, mnemonic[11]],
      ]
      await expect(
        agent.verifyPartialMnemonic({
          hash: mnemonicObj.hash,
          indexedWordList,
        })
      ).resolves.toEqual({ succeeded: true })
    })

    it('should not match the mnemonic if the index of the words do not match', async () => {
      const mnemonic = mnemonicObj.mnemonic as string[]
      const indexedWordList: [number, string][] = [
        [0, mnemonic[0]],
        [1, mnemonic[1]],
        [5, mnemonic[9]],
        [7, mnemonic[7]],
        [11, mnemonic[11]],
      ]
      await expect(
        agent.verifyPartialMnemonic({
          hash: mnemonicObj.hash,
          indexedWordList,
        })
      ).resolves.toEqual({ succeeded: false })
    })

    it('should throw an exception if the mnemonic does not exist in the database', async () => {
      const mnemonic = mnemonicObj.mnemonic as string[]
      const indexedWordList: [number, string][] = [
        [0, mnemonic[0]],
        [1, mnemonic[1]],
        [5, mnemonic[5]],
        [7, mnemonic[7]],
        [11, mnemonic[11]],
      ]
      await expect(() =>
        agent.verifyPartialMnemonic({
          hash: 'non-existent',
          indexedWordList,
        })
      ).rejects.toThrowError('Mnemonic not found')
    })

    it('should generate the master key', async () => {
      const mnemonicInfoKey = await agent.generateMasterKey({ hash: mnemonicObj.hash, type: 'Ed25519' })
      expect(mnemonicInfoKey.masterKey).toMatch(/\w{64}/)
      expect(mnemonicInfoKey.chainCode).toMatch(/\w{64}/)
    })

    it('should throw an error if type is different from Ed25519', async () => {
      await expect(agent.generateMasterKey({ hash: mnemonicObj.hash, type: 'Secp256k1' })).rejects.toThrowError(
        'Secp256k1 keys are not supported yet'
      )
    })

    it('should generate the private and public keys', async () => {
      await expect(agent.generateKeysFromMnemonic({ hash: mnemonicObj.hash, path: "m/0'", kms: 'local' })).resolves.toEqual(
        expect.objectContaining({
          kms: 'local',
          meta: {
            algorithms: ['Ed25519', 'EdDSA'],
          },
          type: 'Ed25519',
        })
      )
    })
  })
}
