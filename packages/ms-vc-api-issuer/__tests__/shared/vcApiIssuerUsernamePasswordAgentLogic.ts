import {TAgent, createAgent} from '@veramo/core'
import {MsVcApiIssuer, IMsVcApiIssuer, MsAuthenticationTypeEnum} from '../../src'


type ConfiguredAgent = TAgent<IMsVcApiIssuer>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }) => {
  describe('Issuer Agent Plugin', () => {
    let agent: TAgent<IMsVcApiIssuer>
    agent = createAgent({
      plugins:[
      new MsVcApiIssuer({
        authenticationType: MsAuthenticationTypeEnum.UsernamePassword,
        authenticationArgs: {
          azTenantId: '<tenant_id>',
          azClientId: '<client_id>',
          scopes: ["user.read"],
          username: '<username>',
          password:'<password>',
        }})]
    })
    beforeAll(async () => {
      await testContext.setup()
      agent = testContext.getAgent()
    })

    afterAll(async () => {
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000)) // avoid jest open handle error
      await testContext.tearDown()
    })


    it('should authenticate to Microsoft Azure Active Directory with UsernamePassword', async () => {
      const result = await agent.authenticateMsVcApi();
      console.log(result)
      return await expect(
        agent.authenticateMsVcApi()
      ).resolves.not.toBeNull()
    });
  })
}
