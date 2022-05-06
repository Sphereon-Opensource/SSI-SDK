import {createAgent, IKey, IKeyManager, TAgent, TKeyType} from '@veramo/core'
import {CredentialHandlerLDLocal} from '../../agent/CredentialHandlerLDLocal'
import {LdDefaultContexts} from '../../ld-default-contexts'
import {ICredentialHandlerLDLocal, MethodNames} from '../../types/ICredentialHandlerLDLocal'
import {SphereonBbsBlsSignature2020} from '../../suites'
import {MemoryKeyStore, MemoryPrivateKeyStore} from '@veramo/key-manager'
import {BlsKeyManager, BlsKeyManagementSystem} from "@sphereon/ssi-sdk-bls-key-manager";
import {generateBls12381G2KeyPair} from '@mattrglobal/bbs-signatures'

export default (testContext: { setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }) => {
  describe('Issuer Agent Plugin', () => {
    let key: Partial<IKey>
    let agent: TAgent<IKeyManager & ICredentialHandlerLDLocal>

    beforeAll(async () => {
      const keyStore = new MemoryPrivateKeyStore()
      agent = createAgent({
        plugins: [
          new BlsKeyManager({
            store: new MemoryKeyStore(),
            kms: {
              local: new BlsKeyManagementSystem(keyStore),
            },
          }),
          new CredentialHandlerLDLocal({
            keyStore,
            contextMaps: [LdDefaultContexts /*, customContext*/],
            suites: [new SphereonBbsBlsSignature2020()],
            bindingOverrides: new Map([
              // Bindings to test overrides of credential-ld plugin methods
              ['createVerifiableCredentialLD', MethodNames.createVerifiableCredentialLDLocal],
              ['createVerifiablePresentationLD', MethodNames.createVerifiablePresentationLDLocal],
              // We test the verify methods by using the LDLocal versions directly in the tests
            ]),
          }),
        ],
      })
    })

    afterAll(async () => {
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000)) // avoid jest open handle error
      await testContext.tearDown()
    })

    it('should issue a BBS+ signed 2018 VC', async () => {
      const credential = {
        issuer: 'did:example:123',
        type: ['VerifiableCredential', 'AlumniCredential'],
        '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2018/credentials/examples/v1'],
        credentialSubject: {
          id: 'did:example:123',
          alumniOf: {
            id: 'did:example:c276e12ec21ebfeb1f712ebc6f1',
            name: 'Example University',
          },
        },
      }
      const bls = await generateBls12381G2KeyPair()
      key = await agent.keyManagerImport({
        kms: 'local',
        type: <TKeyType>'Bls12381G2',
        privateKeyHex: Buffer.from(bls.secretKey).toString('hex'),
        publicKeyHex: Buffer.from(bls.publicKey).toString('hex'),
      })
      //Needs a valid did to be able to verify the VC
      await expect(agent.createBBSVerifiableCredentialLD({credential, keyRef: key.publicKeyHex})).resolves.toEqual(expect.objectContaining({
            "@context": [
                "https://www.w3.org/2018/credentials/v1",
                "https://www.w3.org/2018/credentials/examples/v1",
                "https://w3id.org/security/bbs/v1",
            ],
            "credentialSubject": {
              "alumniOf": {
                "id": "did:example:c276e12ec21ebfeb1f712ebc6f1",
                "name": "Example University",
              },
              "id": "did:example:123",
            },
            "issuanceDate": expect.any(String),
            "issuer": "did:example:123",
            "proof": {
              "@context": "https://w3id.org/security/v2",
              "created": expect.any(String),
              "proofPurpose": "assertionMethod",
              "proofValue": expect.any(String),
              "type": "sec:BbsBlsSignature2020",
              "verificationMethod": expect.any(String),
            },
            "type": [
              "VerifiableCredential",
              "AlumniCredential",
            ]
      }))
    })
  })
}
