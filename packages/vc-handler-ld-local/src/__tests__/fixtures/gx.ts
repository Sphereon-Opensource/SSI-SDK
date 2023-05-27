export const GX_CS_DID_WEB = 'did:web:78b7-2001-1c04-2b10-ee00-7bb-e5a9-24c7-7e84.ngrok-free.app'
export const GX_CS_DID_DOC = {
  '@context': 'https://w3id.org/did/v1',
  id: 'did:web:78b7-2001-1c04-2b10-ee00-7bb-e5a9-24c7-7e84.ngrok-free.app',
  verificationMethod: [
    {
      id: 'did:web:78b7-2001-1c04-2b10-ee00-7bb-e5a9-24c7-7e84.ngrok-free.app#JWK2020-RSA',
      type: 'JsonWebKey2020',
      controller: 'did:web:78b7-2001-1c04-2b10-ee00-7bb-e5a9-24c7-7e84.ngrok-free.app',
      publicKeyJwk: {
        kty: 'RSA',
        n: 'uUGlbA84qYjmawZ1r9j1rUDAhkrsxdvS7rE7AZIIj41-kNpZw3UU9gPgcRwZIA7TdXewDmU5sLbOXwmNu4WuTlaXBkJAFZ390E5S_fvCBxthE8nMjjyFV8Juj_kZ__00WAHSkZxmsGs6en1AUHhRH74nX8b55Eh5UvysYbP8C6KJlyb8TUpJcOlfLT-RE-1byxgDR4Vnz3r-2kPYxdViUButOGWqKSjSIJtYZi5_kYAQC5zweUBlWeyZ3W5Ai3zRX9MC5_Y6B9fGCZu0__5y6ORCoTOU_hG2U3y7zyMCGIObjCsURhmRSwi30vyE3oIMtBV7YVl4KmrSH2jEg4iaeQ',
        e: 'AQAB',
        x5u: 'https://78b7-2001-1c04-2b10-ee00-7bb-e5a9-24c7-7e84.ngrok-free.app/.well-known/fullchain.pem',
      },
    },
  ],
  authentication: ['did:web:78b7-2001-1c04-2b10-ee00-7bb-e5a9-24c7-7e84.ngrok-free.app#JWK2020-RSA'],
  assertionMethod: ['did:web:78b7-2001-1c04-2b10-ee00-7bb-e5a9-24c7-7e84.ngrok-free.app#JWK2020-RSA'],
  service: [],
}

export const GX_PARTICIPANT_VC = {
  id: 'urn:uuid:ee98b05d-094b-440b-8ab3-5c7836128994',
  type: ['VerifiablePresentation'],
  '@context': ['https://www.w3.org/2018/credentials/v1'],
  verifiableCredential: [
    {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#',
      ],
      type: ['VerifiableCredential'],
      id: 'urn:uuid:554db947-e001-431c-ae55-22a781e1f928',
      issuer: 'did:web:78b7-2001-1c04-2b10-ee00-7bb-e5a9-24c7-7e84.ngrok-free.app',
      issuanceDate: '2023-05-26T14:12:00.887Z',
      credentialSubject: {
        id: 'did:web:78b7-2001-1c04-2b10-ee00-7bb-e5a9-24c7-7e84.ngrok-free.app',
        type: 'gx:LegalParticipant',
        'gx:legalName': 'Gaia-X European Association for Data and Cloud AISBL',
        'gx:legalRegistrationNumber': {
          'gx:vatID': 'BE0762747721',
        },
        'gx:headquarterAddress': {
          'gx:countrySubdivisionCode': 'BE-BRU',
        },
        'gx:legalAddress': {
          'gx:countrySubdivisionCode': 'BE-BRU',
        },
        'gx-terms-and-conditions:gaiaxTermsAndConditions': '70c1d713215f95191a11d38fe2341faed27d19e083917bc8732ca4fea4976700',
      },
      proof: {
        type: 'JsonWebSignature2020',
        created: '2023-05-26T14:13:44Z',
        verificationMethod: 'did:web:78b7-2001-1c04-2b10-ee00-7bb-e5a9-24c7-7e84.ngrok-free.app#JWK2020-RSA',
        proofPurpose: 'assertionMethod',
        jws: 'eyJhbGciOiJSUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..l6SL95yETjLfYUAQ0dZ3sDmUFvAlG8-ArP8WQKSYBq8Ef3Ute5jVEMSr6XmF5ZT1cuyEWca3YbOcMS9g16cA0BQ29_rRYjoZOpYFPAQUzB17FebiQuhc1MTMr4lJ8mpF5C2UVYoIK-RDFGAyk1J0gyDaSGivLG2DROK2YAHMcnlkSr3IjCpemMF0uWffWIvVh3lpQ_k4cFBdZo-ehvcvENgcYSEEV_5-tFBKAXtjXJMAiZz1dyamkQShdCUnF2RmHLsLpneO50co1vYTuTg5fxrNPpkEJX5gphP9jGSmCZ2Pq-TjKQRhllmkwWY9uyEa27tHlnUeaOP2kznXQYj_2A',
      },
    },
  ],
  holder: 'did:web:78b7-2001-1c04-2b10-ee00-7bb-e5a9-24c7-7e84.ngrok-free.app',
  proof: {
    type: 'JsonWebSignature2020',
    created: '2023-05-26T14:16:39Z',
    verificationMethod: 'did:web:78b7-2001-1c04-2b10-ee00-7bb-e5a9-24c7-7e84.ngrok-free.app#JWK2020-RSA',
    proofPurpose: 'assertionMethod',
    jws: 'eyJhbGciOiJSUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..rzkVRsImHlHpfUPm4yZKiYOZhE370eoa_1CnOkcb4E4YeU0Hhv8SzPD8zBRWmfsiV7BOoBGT0MEONuuNgnPQCd9iWPmDyy4Y3w7fkrrX9pxolryhwXpDMwgoq3i1AH4mZrb7jD1JFN_DrJNv93U7yYVSSvt4hSMEvDomLNbj13rLHsY-ab7FkVdNM0nsBy4OocP6izMigenkWf_Sky0TFo8PAuR_OXl7F0ngzKiZ_KCSJPoFyotaUb6ZARAGDo_ZZgRh5dNAOcwA3KdWek-6mo8geQDLBMBGs1E8VzPFB8ghbZHrOfvWLG54ptGJhEYf3eybTdKUK7h58IVCVGbakg',
  },
}
export const GX_COMPLIANCE_VC = {
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'https://registry.lab.gaia-x.eu//development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#',
  ],
  type: ['VerifiableCredential'],
  id: 'https://storage.gaia-x.eu/credential-offers/b3e0a068-4bf8-4796-932e-2fa83043e203',
  issuer: 'did:web:78b7-2001-1c04-2b10-ee00-7bb-e5a9-24c7-7e84.ngrok-free.app',
  issuanceDate: '2023-05-26T16:41:48.102Z',
  expirationDate: '2023-08-24T16:41:48.102Z',
  credentialSubject: {
    id: 'did:web:78b7-2001-1c04-2b10-ee00-7bb-e5a9-24c7-7e84.ngrok-free.app',
  },
  proof: {
    type: 'JsonWebSignature2020',
    created: '2023-05-26T16:41:48.737Z',
    proofPurpose: 'assertionMethod',
    jws: 'eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..j8-pWmt0XJf9bfbRsat8Uwy-wN9Q2jY6DS4LNEwiFQSOFekJBXJLikF0P8y_dST7oZohZNjPdv3WCehCK5D6B2Y_LpNMWAYZgrwFjoIMH4otumme_N-EA3mxAhfh4QXRbKRCGi1tJrd1Mdv3PFpwjhUqwNWGdfQK9OAvpjPgVqtwX7H9LyZ_gprOkZSrZN8K0oztC7JBQ35P4iAVdpAMsWytlnVR5o2O-0vV4BbnxGPPuvWyCGjvmTLNcTO9eTDWgimnI2YABPJ_6KpJye8zFOVYqowLxOdoeIPzmXjvvQsb40FIvSi4w2OWdsHLpmsntvIjf_N3LrGhS5wZoLrV8A',
    verificationMethod: 'did:web:78b7-2001-1c04-2b10-ee00-7bb-e5a9-24c7-7e84.ngrok-free.app#JWK2020-RSA',
  },
}
