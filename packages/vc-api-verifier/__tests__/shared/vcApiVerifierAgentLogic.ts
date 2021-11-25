import { TAgent } from '@veramo/core';
import { IVcApiVerifier } from '../../src/types/IVcApiVerifier';

type ConfiguredAgent = TAgent<IVcApiVerifier>;

export default (testContext: {
  getAgent: () => ConfiguredAgent;
  setup: () => Promise<boolean>;
  tearDown: () => Promise<boolean>;
}) => {
  describe('Verifier Agent Plugin', () => {
    let agent: ConfiguredAgent;

    beforeAll(() => {
      testContext.setup();
      agent = testContext.getAgent();
    });

    afterAll(testContext.tearDown);

    it('should verify', async () => {
      const credential = {
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          'https://www.w3.org/2018/credentials/examples/v1',
          'https://w3id.org/vc-revocation-list-2020/v1',
        ],
        credentialSubject: {
          degree: {
            name: 'Bachelor of Science and Arts',
            type: 'BachelorDegree',
          },
          id: 'did:factom:d366396f3ce68741bf32a8e09931d3d1c4a66007a17a26129a5f05300cbc7912',
        },
        id: 'http://example.gov/credentials/3732',
        issuanceDate: '2020-03-16T22:37:26.544Z',
        expirationDate: '2020-03-16T22:37:26.544Z',
        issuer: 'did:factom:testnet:f64f6ea12a81c2d815b8aa2621c6a7ad551c15163f8eed115a2aeaf83be82da0',
        type: ['VerifiableCredential', 'UniversityDegreeCredential'],
        proof: {
          type: 'Ed25519Signature2018',
          created: '2021-11-19T11:34:47Z',
          jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..OpuzmKNsTapr-ZFN8AywcG-4jBTobh7_uaqYHUwl8oLYyhPaRH-6_I8rY4CbeuOpg2XHgRctSNnTrcOAVInxAw',
          proofPurpose: 'assertionMethod',
          verificationMethod:
            'did:factom:testnet:f64f6ea12a81c2d815b8aa2621c6a7ad551c15163f8eed115a2aeaf83be82da0#key-0',
        },
      };

      const result = await agent.verifyCredentialUsingVcApi({
        credential,
      });

      expect(result.errors).toEqual([]);
    });
  });
};
