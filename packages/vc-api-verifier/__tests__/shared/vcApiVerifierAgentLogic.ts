import { TAgent } from '@veramo/core'
import { IVcApiVerifier } from '../../src'

type ConfiguredAgent = TAgent<IVcApiVerifier>

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

    it('should verify', async () => {
      const credential = {
        '@context': ['https://www.w3.org/2018/credentials/v1', 'https://sphereon-opensource.github.io/vc-contexts/myc/bedrijfsinformatie-v1.jsonld'],
        issuer: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d',
        issuanceDate: '2021-12-02T02:55:39.608Z',
        credentialSubject: {
          Bedrijfsinformatie: {
            id: 'did:lto:3MrjGusMnFspFfyVctYg3cJaNKGnaAhMZXM',
            naam: 'Test Bedrijf',
            kvkNummer: '1234',
            rechtsvorm: '1234',
            straatnaam: 'Kerkstraat',
            huisnummer: '11',
            postcode: '1111 AB',
            plaats: 'Voorbeeld',
            bagId: '12132',
            datumAkteOprichting: '2020-12-30',
          },
        },
        type: ['VerifiableCredential', 'Bedrijfsinformatie'],
        proof: {
          type: 'Ed25519Signature2018',
          created: '2021-12-02T02:55:39Z',
          jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..SsE_Z6iAktFvsiB1FRJT7lGMnCjHjZ6kvjmXLjJWFZG6trMlm1IJtwvGm1huRgFKfjyiB2LK3166eSboWqwPCg',
          proofPurpose: 'assertionMethod',
          verificationMethod: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d#key-0',
        },
      }

      const result = await agent.verifyCredentialUsingVcApi({
        credential,
      })

      expect(result.checks).toContain('proof')
      expect(result.errors).toEqual([])
    })
  })
}
