import { TAgent } from '@veramo/core'
import { IVcApiVerifierClient } from '../../src'

type ConfiguredAgent = TAgent<IVcApiVerifierClient>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }) => {
  describe('Verifier Agent Plugin', () => {
    let agent: ConfiguredAgent

    beforeAll(() => {
      testContext.setup()
      agent = testContext.getAgent()
    })

    afterAll(async () => {
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000)) // avoid jest open handle error
      await testContext.tearDown()
    })

    xit('should verify', async () => {
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
        proof: {
          type: 'Ed25519Signature2018',
          created: '2022-05-12T12:01:59Z',
          jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..QeGMmbvX6Y9Ba6DEHj-oFmprs09ZRT4vpvMPRl6_MsndN-gGWnWFKsmNr4JMWrirnXuReKTL8oqUe5IUF9NODg',
          proofPurpose: 'assertionMethod',
          verificationMethod: 'did:factom:5c282b46ae5beee50812a2dd9750bf8600d5c9040891c3cc09013521b5750f82#key-0',
        },
      }

      const result = await agent.vcApiClientVerifyCredential({
        credential,
      })

      expect(result.checks).toContain('proof')
      expect(result.errors).toEqual([])
    })
  })
}
