import { TAgent } from '@veramo/core';
import { IVcApiIssuer } from '../../src/types/IVcApiIssuer';

type ConfiguredAgent = TAgent<IVcApiIssuer>;

export default (testContext: {
  getAgent: () => ConfiguredAgent;
  setup: () => Promise<boolean>;
  tearDown: () => Promise<boolean>;
}) => {
  describe('Issuer Agent Plugin', () => {
    let agent: ConfiguredAgent;

    beforeAll(() => {
      testContext.setup();
      agent = testContext.getAgent();
    });

    afterAll(testContext.tearDown);

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
      };

      const result = await agent.issueCredentialUsingVcApi({
        credential,
      });

      expect(result.proof).not.toBeNull();
    });
  });
};
