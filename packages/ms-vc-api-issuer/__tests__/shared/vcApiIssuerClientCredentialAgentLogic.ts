import { TAgent, createAgent } from '@veramo/core'
import { IMsVcApiIssuer, MsAuthenticationTypeEnum, MsVcApiIssuer } from '../../src'

type ConfiguredAgent = TAgent<IMsVcApiIssuer>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }) => {
  describe('Issuer Agent Plugin', () => {
    let agent: TAgent<IMsVcApiIssuer>

    beforeAll(async () => {
      await testContext.setup()
      agent = createAgent({
        plugins:[
          new MsVcApiIssuer({
            authenticationType: MsAuthenticationTypeEnum.ClientCredential,
            authenticationArgs: {
              azClientId: '<client_id>',
              azClientSecret:'<client_secret>',
              azTenantId: '<tenant_id>',
              credentialManifest:'<credential_manifest>'
            }})]
      })
    })

    afterAll(async () => {
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000)) // avoid jest open handle error
      await testContext.tearDown()
    })

    it('should authenticate to Microsoft Azure Active Directory with ClientCredential', async () => {
      return await expect(
        agent.authenticateMsVcApi()
      ).resolves.not.toBeNull()
    });
  })
}
