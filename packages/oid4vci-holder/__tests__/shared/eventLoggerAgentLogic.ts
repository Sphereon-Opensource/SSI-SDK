import {TAgent} from '@veramo/core'
import {IOID4VCIHolder} from '../../src'

type ConfiguredAgent = TAgent<IOID4VCIHolder>

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
