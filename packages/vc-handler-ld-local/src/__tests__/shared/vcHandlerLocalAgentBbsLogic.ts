import {createAgent, IKey, IKeyManager, TAgent, TKeyType, IIdentifier, IDIDManager} from '@veramo/core'
import {CredentialHandlerLDLocal} from '../../agent/CredentialHandlerLDLocal'
import {LdDefaultContexts} from '../../ld-default-contexts'
import {ICredentialHandlerLDLocal, MethodNames} from '../../types/ICredentialHandlerLDLocal'
import {SphereonBbsBlsSignature2020} from '../../suites'
import {MemoryKeyStore, MemoryPrivateKeyStore} from '@veramo/key-manager'
import {BlsKeyManager, BlsKeyManagementSystem} from "@sphereon/ssi-sdk-bls-key-manager";
import {generateBls12381G2KeyPair} from '@mattrglobal/bbs-signatures'
import {DIDManager, MemoryDIDStore} from '@veramo/did-manager'
import {KeyDIDProvider} from '@veramo/did-provider-key'

export default (testContext: { setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }) => {
  describe('Issuer Agent Plugin', () => {
    let key: Partial<IKey>
    let agent: TAgent<IKeyManager & IDIDManager & ICredentialHandlerLDLocal>
    let didKeyIdentifier: IIdentifier;

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
          new DIDManager({
            providers: {
              'did:key': new KeyDIDProvider({defaultKms: 'local'})
            },
            store: new MemoryDIDStore(),
            defaultProvider: 'did:key'
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
      });
      didKeyIdentifier = await agent.didManagerCreate()
    })

    afterAll(async () => {
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000)) // avoid jest open handle error
      await testContext.tearDown()
    })

    it('should issue a BBS+ signed 2018 VC', async () => {
      const credential = {
        issuer: didKeyIdentifier.did,
        type: ['VerifiableCredential', 'AlumniCredential'],
        '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2018/credentials/examples/v1'],
        credentialSubject: {
          id: didKeyIdentifier.did,
          alumniOf: {
            id: didKeyIdentifier.did,
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
                "id": didKeyIdentifier.did,
                "name": "Example University",
              },
              "id": didKeyIdentifier.did,
            },
            "issuanceDate": expect.any(String),
            "issuer": didKeyIdentifier.did,
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
