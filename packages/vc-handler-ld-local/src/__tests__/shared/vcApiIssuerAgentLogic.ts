import { TAgent } from '@veramo/core'
import { ICredentialHandlerLDLocal } from '../../types/ICredentialHandlerLDLocal'

type ConfiguredAgent = TAgent<ICredentialHandlerLDLocal>

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

    it('should issue', async () => {
      const credential = {
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          'https://www.w3.org/2018/credentials/examples/v1',
          'https://w3id.org/vc-revocation-list-2020/v1',
        ],
        credentialStatus: {
          id: 'http://example.gov/credentials/3732#2',
          type: 'RevocationList2020Status',
          revocationListIndex: '2',
          revocationListCredential: 'https://example.github.io/example-repo/revocation-credential.jsonld',
        },
        credentialSubject: {
          degree: {
            name: 'Bachelor of Science and Arts',
            type: 'BachelorDegree',
          },
          id: 'did:example:123',
        },
        id: 'http://example.gov/credentials/3732',
        issuanceDate: '2020-03-16T22:37:26.544Z',
        issuer: 'did:example:123',
        type: ['VerifiableCredential', 'UniversityDegreeCredential'],
      }

      return await expect(
        agent.issueCredentialUsingVcApi({
          credential,
        })
      ).resolves.not.toBeNull()
    })
  })
}
