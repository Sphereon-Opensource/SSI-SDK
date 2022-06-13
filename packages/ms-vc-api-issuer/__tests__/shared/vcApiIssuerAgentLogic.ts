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
      const authenticationInfo = {
        azClientId: '3064c4d2-ccc6-40ff-a292-f1aa09b1c509',
        azClientSecret: 'Ub-8Q~yCzpmh6ouAttSde7L0YeqajaB99gdiKaT.',
        azTenantId: 'e2a42b2f-7460-4499-afc2-425315ef058a',
        credentialManifest: 'https://beta.eu.did.msidentity.com/v1.0/e2a42b2f-7460-4499-afc2-425315ef058a/verifiableCredential/contracts/mehmetvc'
      }

      return await expect(
        agent.issueCredentialUsingVcApi({
          authenticationInfo
        })
      ).resolves.not.toBeNull()
    })
    /*
    it('should issue', async () => {
      const credential = {
        '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2018/credentials/examples/v1'],
        credentialSubject: {
          degree: {
            name: 'Bachelor of Science and Arts',
            type: 'BachelorDegree',
          },
          id: 'did:example:123',
        },
        id: 'http://example.gov/credentials/3732',
        issuanceDate: '2020-03-16T22:37:26.544Z',
        issuer: 'did:factom:5c282b46ae5beee50812a2dd9750bf8600d5c9040891c3cc09013521b5750f82',
        type: ['VerifiableCredential', 'UniversityDegreeCredential'],
      }

      return await expect(
        agent.issueCredentialUsingVcApi({
          credential,
        })
      ).resolves.not.toBeNull()
    })
    */
  })
}
