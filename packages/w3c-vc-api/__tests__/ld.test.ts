import agent from './agent'

const LDP_VC =
  '{\n' +
  '  "@context": [\n' +
  '    "https://www.w3.org/2018/credentials/v1"\n' +
  '  ],\n' +
  '  "type": [\n' +
  '    "VerifiableCredential",\n' +
  '    "OydCredential"\n' +
  '  ],\n' +
  '  "issuer": "did:oyd:zQmYSydHP5A1nRuqMcAoxpb971mfJrKJxpGJPEsxc5mw5Wt",\n' +
  '  "issuanceDate": "2024-10-01T19:04:54Z",\n' +
  '  "credentialSubject": {\n' +
  '    "id": "did:oyd:zQmZxuZAsQ6zqBtLMDTPGKwkMP9hzaKVLdE4qhuQLDHGW1j",\n' +
  '    "hello": "world"\n' +
  '  },\n' +
  '  "proof": {\n' +
  '    "type": "Ed25519Signature2020",\n' +
  '    "verificationMethod": "did:oyd:zQmYSydHP5A1nRuqMcAoxpb971mfJrKJxpGJPEsxc5mw5Wt#key-doc",\n' +
  '    "proofPurpose": "assertionMethod",\n' +
  '    "proofValue": "z5zqAY3f3hDPyuBC5zmVgEi4iQLQirZBJkwdgjEPN3UTQ4EoS2f149Yi4N4YRLAnJVapVdLbgHvSKwXNGzi4nwN6M"\n' +
  '  },\n' +
  '  "identifier": "zQmRNwW468JQq6nb8pN6vxzCj8cUUzyW7HqRBCtEbrCLieg",\n' +
  '  "id": "zQmRNwW468JQq6nb8pN6vxzCj8cUUzyW7HqRBCtEbrCLieg"\n' +
  '}'



describe('JSON-LD Verifiable Credential, should be', () => {

  it('verifiable using agent verify function', async () => {
    // The verify function would throw an exception if it did not verify (see next test)

    const result = await agent.verifyCredential({credential: JSON.parse(LDP_VC), fetchRemoteContexts: true})

    expect(result.verified).toEqual(true)



  })


})
