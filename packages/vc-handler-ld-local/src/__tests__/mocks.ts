export const ltoDIDResolutionResult = {
  didResolutionMetadata: {
    contentType: 'application/did+ld+json',
    pattern: '^(did:lto:.+)$',
    driverUrl: 'https://uniresolver-lto.test.sphereon.io/1.0/identifiers/',
    duration: 71,
    did: {
      didString: 'did:lto:3MsS3gqXkcx9m4wYSbfprYfjdZTFmx2ofdX',
      methodSpecificId: '3MsS3gqXkcx9m4wYSbfprYfjdZTFmx2ofdX',
      method: 'lto',
    },
  },
  didDocument: {
    '@context': 'https://www.w3.org/ns/did/v1',
    id: 'did:lto:3MsS3gqXkcx9m4wYSbfprYfjdZTFmx2ofdX',
    verificationMethod: [
      {
        id: 'did:lto:3MsS3gqXkcx9m4wYSbfprYfjdZTFmx2ofdX#sign',
        type: 'Ed25519VerificationKey2018',
        controller: 'did:lto:3MsS3gqXkcx9m4wYSbfprYfjdZTFmx2ofdX',
        publicKeyBase58: 'AM7FSkt3ZfySQZjBEyeCLP9yCdCsv8UPKJRpfBNBUXCT',
        blockchainAccountId: '3MsS3gqXkcx9m4wYSbfprYfjdZTFmx2ofdX@lto:T',
      },
      {
        id: 'did:lto:3MvwLeKQAaLRD2e1MALJC15fjjmSATnvYsW#sign',
        type: 'Ed25519VerificationKey2018',
        controller: 'did:lto:3MvwLeKQAaLRD2e1MALJC15fjjmSATnvYsW',
        publicKeyBase58: '5P48F9Mr8cuhZUWrmnanEpmqSQXC6jPdv8EoMvraTgNQ',
        blockchainAccountId: '3MvwLeKQAaLRD2e1MALJC15fjjmSATnvYsW@lto:T',
      },
    ],
    capabilityDelegation: ['did:lto:3MvwLeKQAaLRD2e1MALJC15fjjmSATnvYsW#sign'],
  },
  didDocumentMetadata: {},
}

export const ltoDIDSubjectResolutionResult_2018 = {
  didResolutionMetadata: {
    contentType: 'application/did+ld+json',
    pattern: '^(did:lto:.+)$',
    driverUrl: 'https://uniresolver-lto.test.sphereon.io/1.0/identifiers/',
    duration: 88,
    did: {
      didString: 'did:lto:3MrjGusMnFspFfyVctYg3cJaNKGnaAhMZXM',
      methodSpecificId: '3MrjGusMnFspFfyVctYg3cJaNKGnaAhMZXM',
      method: 'lto',
    },
  },
  didDocument: {
    '@context': 'https://www.w3.org/ns/did/v1',
    id: 'did:lto:3MrjGusMnFspFfyVctYg3cJaNKGnaAhMZXM',
    verificationMethod: [
      {
        id: 'did:lto:3MrjGusMnFspFfyVctYg3cJaNKGnaAhMZXM#sign',
        type: 'Ed25519VerificationKey2018',
        controller: 'did:lto:3MrjGusMnFspFfyVctYg3cJaNKGnaAhMZXM',
        publicKeyBase58: 'HUQvVQkkTJT4en7Vn448TJG8nUN6sT59bKFx3fZXsWu4',
        blockchainAccountId: '3MrjGusMnFspFfyVctYg3cJaNKGnaAhMZXM@lto:T',
      },
      {
        id: 'did:lto:3MrFbAxGB66Hw4tByJE6sGy9xMh1EJNxf5j#sign',
        type: 'Ed25519VerificationKey2018',
        controller: 'did:lto:3MrFbAxGB66Hw4tByJE6sGy9xMh1EJNxf5j',
        publicKeyBase58: '6DevzoRy9wzyCXxPqeKMEPGhVqENyB4yS7dBwnLyEjCm',
        blockchainAccountId: '3MrFbAxGB66Hw4tByJE6sGy9xMh1EJNxf5j@lto:T',
      },
    ],
    capabilityInvocation: ['did:lto:3MrFbAxGB66Hw4tByJE6sGy9xMh1EJNxf5j#sign'],
  },
  didDocumentMetadata: {},
}

export const ltoDIDSubjectResolutionResult_2020 = {
  didResolutionMetadata: {
    contentType: 'application/did+ld+json',
    pattern: '^(did:lto:.+)$',
    driverUrl: 'https://uniresolver-lto.test.sphereon.io/1.0/identifiers/',
    duration: 88,
    did: {
      didString: 'did:lto:3MrjGusMnFspFfyVctYg3cJaNKGnaAhMZXM',
      methodSpecificId: '3MrjGusMnFspFfyVctYg3cJaNKGnaAhMZXM',
      method: 'lto',
    },
  },
  didDocument: {
    '@context': 'https://www.w3.org/ns/did/v1',
    id: 'did:lto:3MrjGusMnFspFfyVctYg3cJaNKGnaAhMZXM',
    verificationMethod: [
      {
        id: 'did:lto:3MrjGusMnFspFfyVctYg3cJaNKGnaAhMZXM#sign',
        type: 'Ed25519VerificationKey2020',
        controller: 'did:lto:3MrjGusMnFspFfyVctYg3cJaNKGnaAhMZXM',
        publicKeyBase58: 'zHUQvVQkkTJT4en7Vn448TJG8nUN6sT59bKFx3fZXsWu4',
        blockchainAccountId: '3MrjGusMnFspFfyVctYg3cJaNKGnaAhMZXM@lto:T',
      },
      {
        id: 'did:lto:3MrFbAxGB66Hw4tByJE6sGy9xMh1EJNxf5j#sign',
        type: 'Ed25519VerificationKey2020',
        controller: 'did:lto:3MrFbAxGB66Hw4tByJE6sGy9xMh1EJNxf5j',
        publicKeyBase58: 'z6DevzoRy9wzyCXxPqeKMEPGhVqENyB4yS7dBwnLyEjCm',
        blockchainAccountId: '3MrFbAxGB66Hw4tByJE6sGy9xMh1EJNxf5j@lto:T',
      },
    ],
    capabilityInvocation: ['did:lto:3MrFbAxGB66Hw4tByJE6sGy9xMh1EJNxf5j#sign'],
  },
  didDocumentMetadata: {},
}

export const factomDIDResolutionResult_2018 = {
  didResolutionMetadata: {
    factomdNode: 'https://api.factomd.net/v2',
    chainCreationEntryHash: '3798a20a4ece9c769c28c45e1aef21f850e955d122c4ac4cc17d41af00bc3263',
    resolvedFactomIdentity: {
      identity: {
        version: 1,
        keys: ['idpub32dHQwPhDcaT1bH9cko2122RArWPp5LGT6PAqQZcK1P878oSNq'],
      },
      metadata: {
        creation: {
          blockHeight: 326065,
          entryTimestamp: 1638410640,
          blockTimestamp: 1638410100,
          entryHash: '3798a20a4ece9c769c28c45e1aef21f850e955d122c4ac4cc17d41af00bc3263',
        },
        update: {
          blockHeight: 326065,
          entryTimestamp: 1638410640,
          blockTimestamp: 1638410100,
          entryHash: '3798a20a4ece9c769c28c45e1aef21f850e955d122c4ac4cc17d41af00bc3263',
        },
      },
      didVersion: 'FACTOM_IDENTITY_CHAIN',
      content: { version: 1, keys: ['idpub32dHQwPhDcaT1bH9cko2122RArWPp5LGT6PAqQZcK1P878oSNq'] },
    },
    currentEntryTimestamp: 1638410640,
    currentBlockHeight: 326065,
    chainCreationEntryTimestamp: 1638410640,
    chainCreationBlockTimestamp: 1638410100,
    chainCreationBlockHeight: 326065,
    currentEntryHash: '3798a20a4ece9c769c28c45e1aef21f850e955d122c4ac4cc17d41af00bc3263',
    currentBlockTimestamp: 1638410100,
    network: 'mainnet',
    contentType: 'application/did+ld+json',
    pattern: '^(did:factom:.+)$',
    driverUrl: 'https://uniresolver-factom.test.sphereon.io/1.0/identifiers/',
    duration: 1024,
    did: {
      didString: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d',
      methodSpecificId: '9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d',
      method: 'factom',
    },
  },
  didDocument: {
    '@context': ['https://www.w3.org/ns/did/v1'],
    id: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d',
    verificationMethod: [
      {
        type: 'Ed25519VerificationKey2018',
        id: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d#key-0',
        publicKeyBase58: 'CHMEhQe2jGfJjXevNuWHmLsSj2VEerHmueku5k1o3hky',
        controller: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d',
      },
    ],
    authentication: [
      {
        type: 'Ed25519VerificationKey2018',
        id: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d#key-0',
        publicKeyBase58: 'CHMEhQe2jGfJjXevNuWHmLsSj2VEerHmueku5k1o3hky',
        controller: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d',
      },
    ],
    assertionMethod: [
      {
        type: 'Ed25519VerificationKey2018',
        id: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d#key-0',
        publicKeyBase58: 'CHMEhQe2jGfJjXevNuWHmLsSj2VEerHmueku5k1o3hky',
        controller: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d',
      },
    ],
    keyAgreement: [
      {
        type: 'Ed25519VerificationKey2018',
        id: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d#key-0',
        publicKeyBase58: 'CHMEhQe2jGfJjXevNuWHmLsSj2VEerHmueku5k1o3hky',
        controller: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d',
      },
    ],
    capabilityInvocation: [
      {
        type: 'Ed25519VerificationKey2018',
        id: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d#key-0',
        publicKeyBase58: 'CHMEhQe2jGfJjXevNuWHmLsSj2VEerHmueku5k1o3hky',
        controller: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d',
      },
    ],
  },
  didDocumentMetadata: {
    duration: 826,
    method: 'factom',
    driverId: 'sphereon/uni-resolver-driver-did-factom',
    vendor: 'Factom Protocol',
    startTime: '2021-12-11T00:44:16.723223Z',
    didUrl: {
      didUrlString: {
        string: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d',
        valueType: 'STRING',
        chars: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d',
      },
      did: {
        didString: {
          string: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d',
          valueType: 'STRING',
          chars: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d',
        },
        method: { string: 'factom', valueType: 'STRING', chars: 'factom' },
        methodSpecificId: {
          string: '9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d',
          valueType: 'STRING',
          chars: '9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d',
        },
      },
      parameters: { valueType: 'NULL' },
      path: { valueType: 'NULL' },
      query: { valueType: 'NULL' },
      fragment: { valueType: 'NULL' },
    },
    version: '0.4.0',
  },
}

export const factomDIDResolutionResult_2020 = {
  didResolutionMetadata: {
    factomdNode: 'https://api.factomd.net/v2',
    chainCreationEntryHash: '3798a20a4ece9c769c28c45e1aef21f850e955d122c4ac4cc17d41af00bc3263',
    resolvedFactomIdentity: {
      identity: {
        version: 1,
        keys: ['idpub32dHQwPhDcaT1bH9cko2122RArWPp5LGT6PAqQZcK1P878oSNq'],
      },
      metadata: {
        creation: {
          blockHeight: 326065,
          entryTimestamp: 1638410640,
          blockTimestamp: 1638410100,
          entryHash: '3798a20a4ece9c769c28c45e1aef21f850e955d122c4ac4cc17d41af00bc3263',
        },
        update: {
          blockHeight: 326065,
          entryTimestamp: 1638410640,
          blockTimestamp: 1638410100,
          entryHash: '3798a20a4ece9c769c28c45e1aef21f850e955d122c4ac4cc17d41af00bc3263',
        },
      },
      didVersion: 'FACTOM_IDENTITY_CHAIN',
      content: { version: 1, keys: ['idpub32dHQwPhDcaT1bH9cko2122RArWPp5LGT6PAqQZcK1P878oSNq'] },
    },
    currentEntryTimestamp: 1638410640,
    currentBlockHeight: 326065,
    chainCreationEntryTimestamp: 1638410640,
    chainCreationBlockTimestamp: 1638410100,
    chainCreationBlockHeight: 326065,
    currentEntryHash: '3798a20a4ece9c769c28c45e1aef21f850e955d122c4ac4cc17d41af00bc3263',
    currentBlockTimestamp: 1638410100,
    network: 'mainnet',
    contentType: 'application/did+ld+json',
    pattern: '^(did:factom:.+)$',
    driverUrl: 'https://uniresolver-factom.test.sphereon.io/1.0/identifiers/',
    duration: 1024,
    did: {
      didString: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d',
      methodSpecificId: '9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d',
      method: 'factom',
    },
  },
  didDocument: {
    '@context': ['https://www.w3.org/ns/did/v1'],
    id: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d',
    verificationMethod: [
      {
        type: 'Ed25519VerificationKey2020',
        id: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d#key-0',
        publicKeyBase58: 'zCHMEhQe2jGfJjXevNuWHmLsSj2VEerHmueku5k1o3hky',
        controller: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d',
      },
    ],
    authentication: [
      {
        type: 'Ed25519VerificationKey2020',
        id: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d#key-0',
        publicKeyBase58: 'zCHMEhQe2jGfJjXevNuWHmLsSj2VEerHmueku5k1o3hky',
        controller: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d',
      },
    ],
    assertionMethod: [
      {
        type: 'Ed25519VerificationKey2020',
        id: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d#key-0',
        publicKeyBase58: 'zCHMEhQe2jGfJjXevNuWHmLsSj2VEerHmueku5k1o3hky',
        controller: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d',
      },
    ],
    keyAgreement: [
      {
        type: 'Ed25519VerificationKey2020',
        id: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d#key-0',
        publicKeyBase58: 'zCHMEhQe2jGfJjXevNuWHmLsSj2VEerHmueku5k1o3hky',
        controller: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d',
      },
    ],
    capabilityInvocation: [
      {
        type: 'Ed25519VerificationKey2020',
        id: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d#key-0',
        publicKeyBase58: 'zCHMEhQe2jGfJjXevNuWHmLsSj2VEerHmueku5k1o3hky',
        controller: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d',
      },
    ],
  },
  didDocumentMetadata: {
    duration: 826,
    method: 'factom',
    driverId: 'sphereon/uni-resolver-driver-did-factom',
    vendor: 'Factom Protocol',
    startTime: '2021-12-11T00:44:16.723223Z',
    didUrl: {
      didUrlString: {
        string: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d',
        valueType: 'STRING',
        chars: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d',
      },
      did: {
        didString: {
          string: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d',
          valueType: 'STRING',
          chars: 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d',
        },
        method: { string: 'factom', valueType: 'STRING', chars: 'factom' },
        methodSpecificId: {
          string: '9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d',
          valueType: 'STRING',
          chars: '9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d',
        },
      },
      parameters: { valueType: 'NULL' },
      path: { valueType: 'NULL' },
      query: { valueType: 'NULL' },
      fragment: { valueType: 'NULL' },
    },
    version: '0.4.0',
  },
}

export const bedrijfsInformatieV1 = {
  '@context': {
    '@version': 1.1,
    bi: 'https://sphereon-opensource.github.io/vc-contexts/myc/bedrijfsinformatie-v1#',
    Bedrijfsinformatie: {
      '@id': 'https://sphereon-opensource.github.io/vc-contexts/myc/bedrijfsinformatie-v1#bi',
      '@context': {
        '@version': 1.1,
        '@protected': true,
        id: '@id',
        type: '@type',

        naam: 'bi:naam',
        kvkNummer: 'bi:kvkNummer',
        rechtsvorm: 'bi:rechtsvorm',
        straatnaam: 'bi:straatnaam',
        aanduidingBijHuisnummer: 'bi:aanduidingBijHuisnummer',
        huisnummer: 'bi:huisnummer',
        huisnummerToevoeging: 'bi:huisnummerToevoeging',
        huisletter: 'bi:huisletter',
        postbusnummer: 'bi:postbusnummer',
        postcode: 'bi:postcode',
        plaats: 'bi:plaats',
        bagId: 'bi:bagId',
        datumAkteOprichting: 'bi:datumAkteOprichting',
      },
    },
  },
}

export const exampleV1 = {
  '@context': [
    {
      '@version': 1.1,
    },
    'https://www.w3.org/ns/odrl.jsonld',
    {
      ex: 'https://example.org/examples#',
      schema: 'http://schema.org/',
      rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',

      '3rdPartyCorrelation': 'ex:3rdPartyCorrelation',
      AllVerifiers: 'ex:AllVerifiers',
      Archival: 'ex:Archival',
      BachelorDegree: 'ex:BachelorDegree',
      Child: 'ex:Child',
      CLCredentialDefinition2019: 'ex:CLCredentialDefinition2019',
      CLSignature2019: 'ex:CLSignature2019',
      IssuerPolicy: 'ex:IssuerPolicy',
      HolderPolicy: 'ex:HolderPolicy',
      Mother: 'ex:Mother',
      RelationshipCredential: 'ex:RelationshipCredential',
      UniversityDegreeCredential: 'ex:UniversityDegreeCredential',
      AlumniCredential: 'ex:AlumniCredential',
      DisputeCredential: 'ex:DisputeCredential',
      PrescriptionCredential: 'ex:PrescriptionCredential',
      ZkpExampleSchema2018: 'ex:ZkpExampleSchema2018',

      issuerData: 'ex:issuerData',
      attributes: 'ex:attributes',
      signature: 'ex:signature',
      signatureCorrectnessProof: 'ex:signatureCorrectnessProof',
      primaryProof: 'ex:primaryProof',
      nonRevocationProof: 'ex:nonRevocationProof',

      alumniOf: { '@id': 'schema:alumniOf', '@type': 'rdf:HTML' },
      child: { '@id': 'ex:child', '@type': '@id' },
      degree: 'ex:degree',
      degreeType: 'ex:degreeType',
      degreeSchool: 'ex:degreeSchool',
      college: 'ex:college',
      name: { '@id': 'schema:name', '@type': 'rdf:HTML' },
      givenName: 'schema:givenName',
      familyName: 'schema:familyName',
      parent: { '@id': 'ex:parent', '@type': '@id' },
      referenceId: 'ex:referenceId',
      documentPresence: 'ex:documentPresence',
      evidenceDocument: 'ex:evidenceDocument',
      spouse: 'schema:spouse',
      subjectPresence: 'ex:subjectPresence',
      verifier: { '@id': 'ex:verifier', '@type': '@id' },
      currentStatus: 'ex:currentStatus',
      statusReason: 'ex:statusReason',
      prescription: 'ex:prescription',
    },
  ],
}

export const boaExampleVC = {
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'https://sphereon-opensource.github.io/vc-contexts/boa/boa-id-v1.jsonld',
    'https://w3id.org/vc-revocation-list-2020/v1',
  ],
  issuer: 'did:factom:402995bdf7042954acfe86d1835e3ada191e96a0b26a320b32e04b7ae9cb1c00',
  issuanceDate: '2021-12-11T16:32:08.845Z',
  credentialSubject: {
    givenName: 'Bob',
    familyName: 'the Builder',
    idNumber: 'test-123456789',
    domain: 'IT dept',
    employer: 'Sphereon',
    locality: 'My City',
    validFrom: '2021-11-01T12:45:06Z',
    id: 'did:lto:3MsS3gqXkcx9m4wYSbfprYfjdZTFmx2ofdX',
  },
  type: ['VerifiableCredential', 'BoaIdCredential'],
  credentialStatus: {
    id: 'https://vc-api.sphereon.io/services/credentials/justis-boa-id-revocation-prod#22312',
    type: 'RevocationList2020Status',
    revocationListIndex: '22312',
    revocationListCredential: 'https://vc-api.sphereon.io/services/credentials/justis-boa-id-revocation-prod',
  },
  proof: {
    type: 'Ed25519Signature2018',
    created: '2021-12-11T16:32:09Z',
    jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..GyhRSzTjAKchqYrZEp8qfOAP18fBYpOuiZP_0P9xSm5NH9IbVqNJDekkNFgGmadvyfJzi-1_vl9NZxU_TkG3DA',
    proofPurpose: 'assertionMethod',
    verificationMethod: 'did:factom:402995bdf7042954acfe86d1835e3ada191e96a0b26a320b32e04b7ae9cb1c00#key-0',
  },
}
