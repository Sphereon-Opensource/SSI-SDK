import { TAgent } from '@veramo/core'

import { IMnemonicSeedManager } from '../../src'

type ConfiguredAgent = TAgent<IMnemonicSeedManager>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }) => {
  describe('mnemonic generator', () => {
    let agent: ConfiguredAgent

    beforeAll(() => {
      testContext.setup()
      agent = testContext.getAgent()
    })
    afterAll(testContext.tearDown)

    it('should generate a 12 words mnemonic', async () => {
      const mnemonicInfo = await agent.generateMnemonic({ bits: 128 })
      expect(mnemonicInfo.mnemonic?.length).toEqual(12)
    })

    it('should generate a 15 words mnemonic', async () => {
      const mnemonicInfo = await agent.generateMnemonic({ bits: 160 })
      expect(mnemonicInfo.mnemonic?.length).toEqual(15)
    })

    it('should generate a 18 words mnemonic', async () => {
      const mnemonicInfo = await agent.generateMnemonic({ bits: 192 })
      expect(mnemonicInfo.mnemonic?.length).toEqual(18)
    })

    it('should generate a 21 words mnemonic', async () => {
      const mnemonicInfo = await agent.generateMnemonic({ bits: 224 })
      expect(mnemonicInfo.mnemonic?.length).toEqual(21)
    })

    it('should generate a 24 words mnemonic', async () => {
      const mnemonicInfo = await agent.generateMnemonic({ bits: 256 })
      expect(mnemonicInfo.mnemonic?.length).toEqual(24)
    })
  })
}
