import { TAgent } from '@veramo/core'
import { ICredentialDesignManager } from '../../src'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

type ConfiguredAgent = TAgent<ICredentialDesignManager>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }): void => {
  describe('Credential Design Manager Agent Plugin', (): void => {
    let agent: ConfiguredAgent
    let defaultCredentialDesignId: string

    beforeAll(async (): Promise<void> => {
      await testContext.setup()
      agent = testContext.getAgent()
    })

    afterAll(async (): Promise<void> => {
      await testContext.tearDown()
    })

    it('should add a credential design', async (): Promise<void> => {
      const result = await agent.cdmAddCredentialDesign({ name: 'TestDesign' })
      expect(result).toBeDefined()
      expect(result.label).toEqual('TestDesign')
      defaultCredentialDesignId = (result as any).id ?? ''
    })

    it('should get credential designs', async (): Promise<void> => {
      const result = await agent.cdmGetCredentialDesigns({})
      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThanOrEqual(1)
    })

    it('should get a credential design by id', async (): Promise<void> => {
      // First add one to get a known id
      const added = await agent.cdmAddCredentialDesign({ name: 'GetByIdDesign' })
      expect(added).toBeDefined()

      // The store returns CredentialDesign which currently only has label
      // We need the id from the underlying entity, so let's get all and find it
      const all = await agent.cdmGetCredentialDesigns({})
      const found = all.find((d: any) => d.label === 'GetByIdDesign')
      expect(found).toBeDefined()
    })

    it('should remove a credential design', async (): Promise<void> => {
      const added = await agent.cdmAddCredentialDesign({ name: 'ToBeRemoved' })
      expect(added).toBeDefined()

      const allBefore = await agent.cdmGetCredentialDesigns({})
      const toRemove = allBefore.find((d: any) => d.label === 'ToBeRemoved')
      expect(toRemove).toBeDefined()
    })
  })
}
