import { TAgent } from '@veramo/core'
import { IMsVcApiIssuer } from '../../src'

type ConfiguredAgent = TAgent<IMsVcApiIssuer>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }) => {
  describe('Issuer Agent Plugin', () => {
    let agent: ConfiguredAgent

    beforeAll(async () => {
      await testContext.setup()
      agent = testContext.getAgent()
    })

    afterAll(async () => {
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000)) // avoid jest open handle error
      await testContext.tearDown()
    })

    it('should authenticate to Microsoft Azure Active Directory', async () => {
      return await expect(
        agent.authenticateMsVcApi({
          azClientId: '3064c4d2-ccc6-40ff-a292-f1aa09b1c509',
          azClientSecret: 'Ub-8Q~yCzpmh6ouAttSde7L0YeqajaB99gdiKaT.',
          azTenantId: 'e2a42b2f-7460-4499-afc2-425315ef058a',
          credentialManifest: 'https://beta.eu.did.msidentity.com/v1.0/e2a42b2f-7460-4499-afc2-425315ef058a/verifiableCredential/contracts/mehmetvc'
        })
      ).resolves.not.toBeNull()
    })
  })
}
