import { TAgent } from '@veramo/core';

import { IMnemonicInfoGenerator, IMnemonicInfoResult } from '../../src';

type ConfiguredAgent = TAgent<IMnemonicInfoGenerator>;

export default (testContext: {
  getAgent: () => ConfiguredAgent;
  setup: () => Promise<boolean>;
  tearDown: () => Promise<boolean>;
}) => {
  describe('database operations', () => {
    let agent: ConfiguredAgent;
    let mnemonicObj: IMnemonicInfoResult;

    beforeAll(() => {
      testContext.setup();
      agent = testContext.getAgent();
    });

    afterAll(testContext.tearDown);

    beforeEach(async () => {
      mnemonicObj = await agent.generateMnemonic({ bits: 256, id: 'test id', shouldSave: true });
    });

    afterEach(async () => await agent.deleteMnemonicInfo({ hash: mnemonicObj.hash }));

    it('should return only the mnemonic, without saving anything into the database', async () => {
      const mnemonicInfo = await agent.generateMnemonic({ bits: 256, shouldSave: false });
      expect(mnemonicInfo).toEqual({ mnemonic: mnemonicInfo.mnemonic });
      const result = await agent.getMnemonicInfo({ hash: mnemonicInfo.hash });
      expect(result).toEqual({});
    });

    it('should save a mnemonicInfo into the database with id test id', async () => {
      const mnemonic = await agent.generateMnemonic({ bits: 256 });
      const mnemonicInfo = await agent.saveMnemonicInfo({ id: 'test id', mnemonic: mnemonic.mnemonic });
      expect(mnemonicInfo.id).toEqual('test id');
    });

    it('should save a mnemonicInfo into the database with id being the hash', async () => {
      const mnemonic = await agent.generateMnemonic({ bits: 256 });
      const mnemonicInfo = await agent.saveMnemonicInfo({ mnemonic: mnemonic.mnemonic });
      expect(mnemonicInfo.id).toEqual(mnemonicInfo.hash);
    });

    it('should be found if queried by existing name', async () => {
      expect(await agent.getMnemonicInfo({ id: mnemonicObj.id })).toEqual(mnemonicObj);
    });

    it('should not be found if queried by non-existent id', async () => {
      expect(await agent.getMnemonicInfo({ id: 'non-existent' })).toEqual({});
    });

    it('should be found if queried by existing hash', async () => {
      expect(await agent.getMnemonicInfo({ hash: mnemonicObj.hash })).toEqual(mnemonicObj);
    });

    it('should not be found if queried by non-existent hash', async () => {
      expect(await agent.getMnemonicInfo({ hash: 'non-existent' })).toEqual({});
    });

    it('should be deleted if queried by existing hash', async () => {
      await agent.deleteMnemonicInfo({ hash: mnemonicObj.hash });
      expect(await agent.getMnemonicInfo({ hash: mnemonicObj.hash })).toEqual({});
    });

    it('should not be deleted if queried by non-existent hash', async () => {
      await agent.deleteMnemonicInfo({ hash: 'non-existent' });
      expect(await agent.getMnemonicInfo({ hash: mnemonicObj.hash })).toEqual(mnemonicObj);
    });

    it('should be deleted if queried by existing id', async () => {
      await agent.deleteMnemonicInfo({ id: mnemonicObj.id });
      expect(await agent.getMnemonicInfo({ id: mnemonicObj.id })).toEqual({});
    });

    it('should not be deleted if queried by non-existent id', async () => {
      await agent.deleteMnemonicInfo({ id: 'non-existent' });
      expect(await agent.getMnemonicInfo({ id: mnemonicObj.id })).toEqual(mnemonicObj);
    });

    it('should return false if the words appear in the same order in mnemonic but the number of words is different', async () => {
      const mnemonic = mnemonicObj.mnemonic;
      const result = await agent.verifyMnemonic({
        id: mnemonicObj.id,
        wordlist: [mnemonic![1], mnemonic![3], mnemonic![7], mnemonic![9], mnemonic![11]],
      });
      expect(result).toEqual({ succeeded: false });
    });

    it('should return false if the words not appear in the same order in mnemonic and the number of words is different', async () => {
      const mnemonic = mnemonicObj.mnemonic;
      const result = await agent.verifyMnemonic({
        hash: mnemonicObj.hash,
        wordlist: [mnemonic![1], mnemonic![3], mnemonic![0], mnemonic![9], mnemonic![11]],
      });
      expect(result).toEqual({ succeeded: false });
    });

    it('should return true if the number and order of the words is the same', async () => {
      const mnemonic = mnemonicObj.mnemonic as string[];
      const result = await agent.verifyMnemonic({
        hash: mnemonicObj.hash,
        wordlist: mnemonic,
      });
      expect(result).toEqual({ succeeded: true });
    });

    it('should return true if the number of words is different and order of the words is the same', async () => {
      const mnemonic = mnemonicObj.mnemonic as string[];
      mnemonic.push(mnemonic[0]);
      const result = await agent.verifyMnemonic({
        hash: mnemonicObj.hash,
        wordlist: mnemonic,
      });
      expect(result).toEqual({ succeeded: false });
    });

    it('should throw exception if mnemonic does not exist', async () => {
      const mnemonic = mnemonicObj.mnemonic;
      await expect(() =>
        agent.verifyMnemonic({
          hash: 'non-existent',
          wordlist: [mnemonic![1], mnemonic![3], mnemonic![0], mnemonic![9], mnemonic![11]],
        })
      ).rejects.toThrowError('Mnemonic not found');
    });
  });
};
