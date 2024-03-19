import { TAgent } from '@veramo/core'
import { IVcApiIssuerClient } from '../../src'

type ConfiguredAgent = TAgent<IVcApiIssuerClient>

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

    it.skip('should issue', async () => {
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
        agent.vcApiClientIssueCredential({
          credential,
        }),
      ).resolves.not.toBeNull()
    })
  })
}
