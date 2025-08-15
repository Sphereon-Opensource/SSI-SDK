import { IDataStore, IKeyManager, TAgent } from '@veramo/core'
import { beforeAll, describe, expect, it } from 'vitest'

import { IMnemonicSeedManager } from '../../src'

type ConfiguredAgent = TAgent<IKeyManager & IDataStore & IMnemonicSeedManager>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }) => {
  describe('seed generator', () => {
    let agent: ConfiguredAgent

    beforeAll(async () => {
      await testContext.setup().then(() => (agent = testContext.getAgent()))
    })
    // afterAll(testContext.tearDown)

    it('should generate a seed from a 12 word mnemonic', async () => {
      const mnemonicInfo = await agent.generateMnemonic({ bits: 128 })
      const mnemonic: string[] = mnemonicInfo.mnemonic as string[]
      expect((await agent.generateSeed({ mnemonic })).seed?.length).toEqual(128)
    })
  })
}
