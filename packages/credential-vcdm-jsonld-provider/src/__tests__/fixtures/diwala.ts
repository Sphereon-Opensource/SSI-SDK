export const diwalaVC = {
  '@context': ['https://www.w3.org/2018/credentials/v1', 'https://purl.imsglobal.org/spec/ob/v3p0/context.json'],
  id: 'urn:uuid:04331fea-f92b-4fb5-9e04-838c9b39d154',
  type: ['VerifiableCredential', 'OpenBadgeCredential'],
  name: 'JFF x vc-edu PlugFest 2 Interoperability',
  issuer: {
    type: ['Profile'],
    id: 'did:key:z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9',
    name: 'Jobs for the Future (JFF)',
    url: 'https://www.jff.org/',
    image: {
      id: 'https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/images/JFF_LogoLockup.png',
      type: 'Image',
    },
  },
  issuanceDate: '2023-05-06T00:57:07Z',
  credentialSubject: {
    type: ['AchievementSubject'],
    id: 'did:key:z6MkrwRmStZZMf4mEkot8VnjtDX6VSfWyHeCj9nceCV3HyE9',
    achievement: {
      id: 'urn:uuid:94cc8fcf-b1be-481e-9105-682c37a307af',
      type: ['Achievement'],
      name: 'Diwala issued JFF x vc-edu PlugFest 2 Interoperability',
      description:
        'This credential solution supports the use of OBv3 and w3c Verifiable Credentials and is interoperable with at least two other solutions.  This was demonstrated successfully during JFF x vc-edu PlugFest 2.',
      criteria: {
        narrative:
          'Solutions providers earned this badge by demonstrating interoperability between multiple providers based on the OBv3 candidate final standard, with some additional required fields. Credential issuers earning this badge successfully issued a credential into at least two wallets.  Wallet implementers earning this badge successfully displayed credentials issued by at least two different credential issuers.',
      },
      image: {
        id: 'https://w3c-ccg.github.io/vc-ed/plugfest-2-2022/images/JFF-VC-EDU-PLUGFEST2-badge-image.png',
        type: 'Image',
      },
    },
  },
  proof: {
    type: 'Ed25519Signature2018',
    created: '2023-05-06T00:57:07Z',
    verificationMethod: 'did:key:z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9#z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9',
    proofPurpose: 'assertionMethod',
    jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..d3MzWbyiG-gWH4LV15waD7UXXDC9-qKqJpx1g7tOeSrw7TdDeIrzzP9xr-e93ppWN0oYflp1xBxHZaUU2b2SCQ',
  },
}
