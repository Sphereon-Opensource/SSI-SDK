import { TAgent } from '@veramo/core'
import { ISIOPV2Holder } from '../../src'

type ConfiguredAgent = TAgent<ISIOPV2Holder>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }): void => {
  describe.skip('Event Logger Agent Plugin', (): void => {
    let agent: ConfiguredAgent

    beforeAll(async (): Promise<void> => {
      await testContext.setup()
      agent = testContext.getAgent()
    })

    afterAll(testContext.tearDown)

    it('should store audit event', async (): Promise<void> => {
      expect(agent).toBeDefined()
    })
  })
}
