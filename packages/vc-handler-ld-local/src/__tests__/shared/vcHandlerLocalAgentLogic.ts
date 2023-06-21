import { getUniResolver } from '@sphereon/did-uni-client'
import { IDidConnectionMode } from '@sphereon/ssi-sdk-ext.did-provider-lto'
import { checkStatus } from '@transmute/vc-status-rl-2020'
import { createAgent, IDIDManager, IIdentifier, IKeyManager, IResolver, PresentationPayload, TAgent } from '@veramo/core'
import { CredentialIssuer, ICredentialIssuer } from '@veramo/credential-w3c'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { getDidKeyResolver, KeyDIDProvider } from '@veramo/did-provider-key'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { KeyManager, MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { KeyManagementSystem } from '@veramo/kms-local'
import { Resolver } from 'did-resolver'
// @ts-ignore
import nock from 'nock'

import { LtoDidProvider } from '@sphereon/ssi-sdk-ext.did-provider-lto'
import { CredentialHandlerLDLocal } from '../../agent'
import { LdDefaultContexts } from '../../ld-default-contexts'
import { SphereonEd25519Signature2018 } from '../../suites'
import { ICredentialHandlerLDLocal, MethodNames } from '../../types'
import { ControllerProofPurpose } from '../../types'
import { boaExampleVC, ltoDIDResolutionResult } from '../mocks'

const LTO_DID = 'did:lto:3MsS3gqXkcx9m4wYSbfprYfjdZTFmx2ofdX'

export default (testContext: { setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }) => {
  describe('Issuer Agent Plugin', () => {
    let didKeyIdentifier: IIdentifier
    let didLtoIdentifier: IIdentifier
    let agent: TAgent<IResolver & IKeyManager & IDIDManager & ICredentialIssuer & ICredentialHandlerLDLocal>
    nock('https://lto-mock/1.0/identifiers')
      .get(`/${LTO_DID}`)
      .times(10)
      .reply(200, {
        ...ltoDIDResolutionResult,
      })

    beforeAll(async () => {
      agent = createAgent({
        plugins: [
          new KeyManager({
            store: new MemoryKeyStore(),
            kms: {
              local: new KeyManagementSystem(new MemoryPrivateKeyStore()),
            },
          }),
          new DIDManager({
            providers: {
              'did:key': new KeyDIDProvider({ defaultKms: 'local' }),
              'did:lto': new LtoDidProvider({
                defaultKms: 'local',
                connectionMode: IDidConnectionMode.NODE,
                network: 'T',
                sponsorPrivateKeyBase58: '5gqCU5NbwU4gc62be39LXDDALKj8opj1KZszx7ULJc2k33kk52prn8D1H2pPPwm6QVKvkuo72YJSoUhzzmAFmDH8',
              }),
            },
            store: new MemoryDIDStore(),
            defaultProvider: 'did:key',
          }),
          new DIDResolverPlugin({
            resolver: new Resolver({
              ...getDidKeyResolver(),
              ...getUniResolver('lto', { resolveUrl: 'https://lto-mock/1.0/identifiers' }),
              ...getUniResolver('factom', { resolveUrl: 'https://uniresolver.sphereon.io/1.0/identifiers' }),
            }),
          }),
          new CredentialIssuer(),
          new CredentialHandlerLDLocal({
            contextMaps: [LdDefaultContexts /*, customContext*/],
            suites: [new SphereonEd25519Signature2018()],
            bindingOverrides: new Map([
              // Bindings to test overrides of credential-ld plugin methods
              ['createVerifiableCredentialLD', MethodNames.createVerifiableCredentialLDLocal],
              ['createVerifiablePresentationLD', MethodNames.createVerifiablePresentationLDLocal],
              // We test the verify methods by using the LDLocal versions directly in the tests
            ]),
          }),
        ],
      })
      didKeyIdentifier = await agent.didManagerCreate()

      didLtoIdentifier = await agent.didManagerImport({
        provider: 'did:lto',
        did: LTO_DID,
        controllerKeyId: `${LTO_DID}#sign`,
        keys: [
          {
            privateKeyHex:
              '078c0f0eaa6510fab9f4f2cf8657b32811c53d7d98869fd0d5bd08a7ba34376b8adfdd44784dea407e088ff2437d5e2123e685a26dca91efceb7a9f4dfd81848',
            publicKeyHex: '8adfdd44784dea407e088ff2437d5e2123e685a26dca91efceb7a9f4dfd81848',
            kms: 'local',
            kid: `${LTO_DID}#sign`,
            type: 'Ed25519',
          },
        ],
      })
    })

    afterAll(async () => {
      // await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000)) // avoid jest open handle error
      await testContext.tearDown()
    })

    it('should issue and verify a 2018 VC', async () => {
      const credential = {
        issuer: didKeyIdentifier.did,
        type: ['VerifiableCredential', 'AlumniCredential'],
        '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2018/credentials/examples/v1'],
        credentialSubject: {
          id: didKeyIdentifier.did,
          alumniOf: {
            id: 'did:example:c276e12ec21ebfeb1f712ebc6f1',
            name: 'Example University',
          },
        },
      }

      const verifiableCredential = await agent.createVerifiableCredentialLDLocal({ credential })
      expect(verifiableCredential).not.toBeNull()

      const verified = await agent.verifyCredentialLDLocal({
        credential: verifiableCredential,
        fetchRemoteContexts: true,
      })
      expect(verified).toBeTruthy()
    })

    xit('should verify a VC API issued VC with status list and create/verify a VP', async () => {
      jest.setTimeout(100000)

      const verifiableCredential = boaExampleVC

      const verified = await agent.verifyCredentialLDLocal({
        credential: verifiableCredential,
        fetchRemoteContexts: true,
        checkStatus,
      })
      expect(verified).toBeTruthy()

      const presentationPayload: PresentationPayload = {
        holder: didLtoIdentifier.did,
        verifiableCredential: [verifiableCredential],
      }
      const vp = await agent.createVerifiablePresentationLDLocal({
        presentation: presentationPayload,
        keyRef: `${didLtoIdentifier.did}#sign`,
        // We are overriding the purpose since the DID in this test does not have an authentication proof purpose
        purpose: new ControllerProofPurpose({ term: 'verificationMethod' }),
      })
      expect(vp).toBeDefined()

      const vpVerification = await agent.verifyPresentationLDLocal({
        presentation: vp,
        // We are overriding the purpose since the DID in this test does not have an authentication proof purpose
        presentationPurpose: new ControllerProofPurpose({ term: 'verificationMethod' }),
        fetchRemoteContexts: true,
        checkStatus,
      })
      expect(vpVerification).toBeTruthy()
    })
  })
}
