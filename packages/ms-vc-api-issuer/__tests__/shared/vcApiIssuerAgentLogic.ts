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
          azClientId: '04c2bd60-cdbf-4935-80dd-110fdf473e6e',
          azClientSecret: 'WAM8Q~rE05C9ja2TRiZ3H~TYz2W4TdMe.jpwSc~p',
          azTenantId: 'e2a42b2f-7460-4499-afc2-425315ef058a',
          credentialManifest: 'https://beta.eu.did.msidentity.com/v1.0/e2a42b2f-7460-4499-afc2-425315ef058a/verifiableCredential/contracts/VerifiedCredentialExpert2'
        })
      ).resolves.not.toBeNull()
    })

    it('should request issuance from Issuer', async () => {
      return await expect(
        agent.issuanceRequestMsVc({
          azClientId: '04c2bd60-cdbf-4935-80dd-110fdf473e6e',
          azClientSecret: 'WAM8Q~rE05C9ja2TRiZ3H~TYz2W4TdMe.jpwSc~p',
          azTenantId: 'e2a42b2f-7460-4499-afc2-425315ef058a',
          credentialManifest: 'https://beta.eu.did.msidentity.com/v1.0/e2a42b2f-7460-4499-afc2-425315ef058a/verifiableCredential/contracts/VerifiedCredentialExpert2'
        })
      ).resolves.not.toBeNull()
    })

  })
}
