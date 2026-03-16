import { TAgent } from '@veramo/core'
import { ICredentialDesignManager } from '../../src'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

type ConfiguredAgent = TAgent<ICredentialDesignManager>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }): void => {
  describe('Credential Design Manager Agent Plugin', (): void => {
    let agent: ConfiguredAgent

    beforeAll(async (): Promise<void> => {
      await testContext.setup()
      agent = testContext.getAgent()
    })

    afterAll(async (): Promise<void> => {
      await testContext.tearDown()
    })

    it('should throw not implemented for cdmGetCredentialDesign', async (): Promise<void> => {
      await expect(agent.cdmGetCredentialDesign({ credentialDesignId: 'test-id' })).rejects.toThrow('NOT IMPLEMENTED YET')
    })

    it('should throw not implemented for cdmAddCredentialDesign', async (): Promise<void> => {
      await expect(agent.cdmAddCredentialDesign({})).rejects.toThrow('NOT IMPLEMENTED YET')
    })

    it('should throw not implemented for cdmUpdateCredentialDesign', async (): Promise<void> => {
      await expect(agent.cdmUpdateCredentialDesign({ credentialDesignId: 'test-id' })).rejects.toThrow('NOT IMPLEMENTED YET')
    })

    it('should throw not implemented for cdmRemoveCredentialDesign', async (): Promise<void> => {
      await expect(agent.cdmRemoveCredentialDesign({ credentialDesignId: 'test-id' })).rejects.toThrow('NOT IMPLEMENTED YET')
    })
  })
}
