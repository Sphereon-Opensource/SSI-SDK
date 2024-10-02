import { TAgent } from '@veramo/core'
import { IResourceResolver } from '../../src'

type ConfiguredAgent = TAgent<IResourceResolver>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }): void => {
  describe('Resource Resolver Agent Plugin', (): void => {
    let agent: ConfiguredAgent

    beforeAll(async (): Promise<void> => {
      await testContext.setup()
      agent = testContext.getAgent()
    })

    afterAll(testContext.tearDown)

    it('should get resource by resource identifier', async (): Promise<void> => { // TODO create a persists test // fix values // cleanup
      const result1 = await agent.rrPersistResource({
        resource: 'abc_test',
        resourceIdentifier: 'id1'
      })

      console.log(`result1: ${JSON.stringify(result1)}`)

      const result2 = await agent.rrGetResource({ resourceIdentifier: 'id1' })

      console.log(`result2: ${JSON.stringify(result2)}`)

      expect(result2.value).toEqual('abc_test')
    })

    it('should get resource by namespace', async (): Promise<void> => { // TODO create a persists test // fix values // cleanup
      const namespace = 'testNamespace'

      const result1 = await agent.rrPersistResource({
        resource: 'abc_test',
        resourceIdentifier: 'id1',
        namespace
      })

      console.log(`result1: ${JSON.stringify(result1)}`)

      const result2 = await agent.rrGetResource({ resourceIdentifier: 'id1', namespace })

      console.log(`result2: ${JSON.stringify(result2)}`)

      expect(result2.value).toEqual('abc_test')
    })

  })
}
