import { PresentationDefinitionWithLocation, PresentationLocation } from '@sphereon/did-auth-siop/dist/main/types/SIOP.types'

export const pdSingle: PresentationDefinitionWithLocation[] = [
  {
    definition: {
      id: 'Credentials',
      input_descriptors: [
        {
          id: 'ID Card Credential',
          schema: [
            {
              uri: 'https://www.w3.org/2018/credentials/examples/v1/IDCardCredential',
            },
          ],
          constraints: {
            fields: [
              {
                path: ['$.issuer.id'],
                filter: {
                  type: 'string',
                  pattern: 'did:example:issuer',
                },
              },
            ],
          },
        },
      ],
    },
    location: PresentationLocation.ID_TOKEN,
  },
]

export const pdMultiple: PresentationDefinitionWithLocation[] = [
  {
    definition: {
      id: 'Credentials',
      input_descriptors: [
        {
          id: "ID Card Credential and Driver's License",
          schema: [
            {
              uri: 'https://www.w3.org/2018/credentials/examples/v1/IDCardCredential',
            },
            {
              uri: 'https://www.w3.org/2018/credentials/examples/v1/DriversLicense',
            },
          ],
          constraints: {
            fields: [
              {
                path: ['$.issuer.id'],
                filter: {
                  type: 'string',
                  pattern: 'did:example:[issuer|ebfeb1f712ebc6f1c276e12ec21]',
                },
              },
            ],
          },
        },
      ],
    },
    location: PresentationLocation.ID_TOKEN,
  },
]

export const vcs = [
  {
    id: 'https://example.com/credentials/1872',
    type: ['VerifiableCredential', 'IDCardCredential'],
    '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2018/credentials/examples/v1/IDCardCredential'],
    issuer: {
      id: 'did:example:issuer',
    },
    issuanceDate: '2010-01-01T19:23:24Z',
    credentialSubject: {
      given_name: 'Fredrik',
      family_name: 'Stremberg',
      birthdate: '1949-01-22',
    },
    proof: {
      type: 'RsaSignature2018',
      created: '2018-09-14T21:19:10Z',
      proofPurpose: 'authentication',
      verificationMethod: 'did:example:ebfeb1f712ebc6f1c276e12ec21#keys-1',
      challenge: '1f44d55f-f161-4938-a659-f8026467f126',
      domain: '4jt78h47fh47',
      jws: 'eyJhbGciOiJSUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..kTCYt5XsITJX1CxPCT8yAV-TVIw5WEuts01mq-pQy7UJiN5mgREEMGlv50aqzpqh4Qq_PbChOMqsLfRoPsnsgxD-WUcX16dUOqV0G_zS245-kronKb78cPktb3rk-BuQy72IFLN25DYuNzVBAh4vGHSrQyHUGlcTwLtjPAnKb78',
    },
  },
  {
    id: 'https://example.com/credentials/1873',
    type: ['VerifiableCredential', 'DriversLicense'],
    '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2018/credentials/examples/v1/DriversLicense'],
    issuer: {
      id: 'did:example:ebfeb1f712ebc6f1c276e12ec21',
    },
    issuanceDate: '2010-01-01T19:23:24Z',
    credentialSubject: {
      given_name: 'John',
      family_name: 'Doe',
      birthdate: '1975-01-05',
    },
    proof: {
      type: 'RsaSignature2018',
      created: '2018-09-14T21:19:10Z',
      proofPurpose: 'authentication',
      verificationMethod: 'did:example:ebfeb1f712ebc6f1c276e12ec21#keys-1',
      challenge: '1f44d55f-f161-4938-a659-f8026467f126',
      domain: '4jt78h47fh47',
      jws: 'eyJhbGciOiJSUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..kTCYt5XsITJX1CxPCT8yAV-TVIw5WEuts01mq-pQy7UJiN5mgREEMGlv50aqzpqh4Qq_PbChOMqsLfRoPsnsgxD-WUcX16dUOqV0G_zS245-kronKb78cPktb3rk-BuQy72IFLN25DYuNzVBAh4vGHSrQyHUGlcTwLtjPAnKb78',
    },
  },
]

export const vpSingle = [
  {
    format: 'ldp_vp',
    location: 'id_token',
    presentation: {
      '@context': ['https://www.w3.org/2018/credentials/v1', 'https://identity.foundation/presentation-exchange/submission/v1'],
      presentation_submission: {
        definition_id: 'Credentials',
        descriptor_map: [
          {
            format: 'ldp_vc',
            id: 'ID Card Credential',
            path: '$.verifiableCredential[0]',
          },
        ],
        id: expect.any(String),
      },
      type: ['VerifiablePresentation', 'PresentationSubmission'],
      verifiableCredential: [
        {
          '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2018/credentials/examples/v1/IDCardCredential'],
          credentialSubject: {
            birthdate: '1949-01-22',
            family_name: 'Stremberg',
            given_name: 'Fredrik',
          },
          id: 'https://example.com/credentials/1872',
          issuanceDate: '2010-01-01T19:23:24Z',
          issuer: {
            id: 'did:example:issuer',
          },
          proof: {
            challenge: '1f44d55f-f161-4938-a659-f8026467f126',
            created: '2018-09-14T21:19:10Z',
            domain: '4jt78h47fh47',
            jws: 'eyJhbGciOiJSUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..kTCYt5XsITJX1CxPCT8yAV-TVIw5WEuts01mq-pQy7UJiN5mgREEMGlv50aqzpqh4Qq_PbChOMqsLfRoPsnsgxD-WUcX16dUOqV0G_zS245-kronKb78cPktb3rk-BuQy72IFLN25DYuNzVBAh4vGHSrQyHUGlcTwLtjPAnKb78',
            proofPurpose: 'authentication',
            type: 'RsaSignature2018',
            verificationMethod: 'did:example:ebfeb1f712ebc6f1c276e12ec21#keys-1',
          },
          type: ['VerifiableCredential', 'IDCardCredential'],
        },
      ],
    },
  },
]

export const vpMultiple = [
  {
    format: 'ldp_vp',
    location: 'id_token',
    presentation: {
      '@context': ['https://www.w3.org/2018/credentials/v1', 'https://identity.foundation/presentation-exchange/submission/v1'],
      presentation_submission: {
        definition_id: 'Credentials',
        descriptor_map: [
          {
            format: 'ldp_vc',
            id: "ID Card Credential and Driver's License",
            path: '$.verifiableCredential[0]',
          },
          {
            format: 'ldp_vc',
            id: "ID Card Credential and Driver's License",
            path: '$.verifiableCredential[1]',
          },
        ],
        id: expect.any(String),
      },
      type: ['VerifiablePresentation', 'PresentationSubmission'],
      verifiableCredential: [
        {
          '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2018/credentials/examples/v1/IDCardCredential'],
          credentialSubject: {
            birthdate: '1949-01-22',
            family_name: 'Stremberg',
            given_name: 'Fredrik',
          },
          id: 'https://example.com/credentials/1872',
          issuanceDate: '2010-01-01T19:23:24Z',
          issuer: {
            id: 'did:example:issuer',
          },
          proof: {
            challenge: '1f44d55f-f161-4938-a659-f8026467f126',
            created: '2018-09-14T21:19:10Z',
            domain: '4jt78h47fh47',
            jws: 'eyJhbGciOiJSUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..kTCYt5XsITJX1CxPCT8yAV-TVIw5WEuts01mq-pQy7UJiN5mgREEMGlv50aqzpqh4Qq_PbChOMqsLfRoPsnsgxD-WUcX16dUOqV0G_zS245-kronKb78cPktb3rk-BuQy72IFLN25DYuNzVBAh4vGHSrQyHUGlcTwLtjPAnKb78',
            proofPurpose: 'authentication',
            type: 'RsaSignature2018',
            verificationMethod: 'did:example:ebfeb1f712ebc6f1c276e12ec21#keys-1',
          },
          type: ['VerifiableCredential', 'IDCardCredential'],
        },
        {
          id: 'https://example.com/credentials/1873',
          type: ['VerifiableCredential', 'DriversLicense'],
          '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2018/credentials/examples/v1/DriversLicense'],
          issuer: {
            id: 'did:example:ebfeb1f712ebc6f1c276e12ec21',
          },
          issuanceDate: '2010-01-01T19:23:24Z',
          credentialSubject: {
            given_name: 'John',
            family_name: 'Doe',
            birthdate: '1975-01-05',
          },
          proof: {
            type: 'RsaSignature2018',
            created: '2018-09-14T21:19:10Z',
            proofPurpose: 'authentication',
            verificationMethod: 'did:example:ebfeb1f712ebc6f1c276e12ec21#keys-1',
            challenge: '1f44d55f-f161-4938-a659-f8026467f126',
            domain: '4jt78h47fh47',
            jws: 'eyJhbGciOiJSUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..kTCYt5XsITJX1CxPCT8yAV-TVIw5WEuts01mq-pQy7UJiN5mgREEMGlv50aqzpqh4Qq_PbChOMqsLfRoPsnsgxD-WUcX16dUOqV0G_zS245-kronKb78cPktb3rk-BuQy72IFLN25DYuNzVBAh4vGHSrQyHUGlcTwLtjPAnKb78',
          },
        },
      ],
    },
  },
]
