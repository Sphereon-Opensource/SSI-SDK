import { createAgent, IDIDManager, IIdentifier, IKeyManager, TAgent, IResolver, PresentationPayload } from '@veramo/core'
import { CredentialHandlerLDLocal } from '../../agent/CredentialHandlerLDLocal'
import { LdDefaultContexts } from '../../ld-default-contexts'
import { ICredentialHandlerLDLocal, MethodNames } from '../../types/ICredentialHandlerLDLocal'
import { SphereonBbsBlsSignature2020 } from '../../suites'
import { MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { BlsKeyManagementSystem, BlsKeyManager } from '@sphereon/ssi-sdk-bls-key-manager'
import {VerifiableCredentialSP, VerifiablePresentationSP} from '@sphereon/ssi-sdk-core'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { BlsKeyDidProvider } from '../../agent/BlsKeyDidProvider'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { Resolver } from 'did-resolver'
import { getDidKeyResolver } from '../../agent/BlsKeyDidResolver'

export default (testContext: { setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }) => {
  describe('Issuer Agent Plugin', () => {
    let agent: TAgent<IResolver & IKeyManager & IDIDManager & ICredentialHandlerLDLocal>
    let didKeyIdentifier: IIdentifier
    let verifiableCredential: VerifiableCredentialSP
    let verifiablePresentation: VerifiablePresentationSP

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
              'did:key': new BlsKeyDidProvider({ defaultKms: 'local' }),
            },
            store: new MemoryDIDStore(),
            defaultProvider: 'did:key',
          }),
          new DIDResolverPlugin({
            resolver: new Resolver({
              ...getDidKeyResolver(),
            }),
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
      didKeyIdentifier = await agent.didManagerCreate({ kms: 'local', options: { type: 'Bls12381G2' }, provider: 'did:key' })
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

      verifiableCredential = await agent.createVerifiableCredentialLD({ credential, keyRef: didKeyIdentifier.keys[0].kid })
      expect(verifiableCredential).toEqual(
        expect.objectContaining({
          '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://www.w3.org/2018/credentials/examples/v1',
            'https://w3id.org/security/bbs/v1',
          ],
          credentialSubject: {
            alumniOf: {
              id: didKeyIdentifier.did,
              name: 'Example University',
            },
            id: didKeyIdentifier.did,
          },
          issuanceDate: expect.any(String),
          issuer: didKeyIdentifier.did,
          proof: {
            '@context': 'https://w3id.org/security/v2',
            created: expect.any(String),
            proofPurpose: 'assertionMethod',
            proofValue: expect.any(String),
            type: 'sec:BbsBlsSignature2020',
            verificationMethod: expect.any(String),
          },
          type: ['VerifiableCredential', 'AlumniCredential'],
        })
      )
    })

    it('Should verify a BBS+ verifiable credential', async () => {
      await expect(agent.verifyCredentialLDLocal({ credential: verifiableCredential })).resolves.toEqual(true)
    })

    it('Should issue a BBS+ verifiable presentation', async () => {
      const presentationPayload: PresentationPayload = {
        holder: didKeyIdentifier.did,
        verifiableCredential: [verifiableCredential]
      }
      verifiablePresentation = await agent.createVerifiablePresentationLDLocal({ presentation: presentationPayload, keyRef: didKeyIdentifier.keys[0].kid })
      expect(verifiablePresentation).toEqual({})
    })

    it('Should verify a BBS+ verifiable presentation', async () => {
      await expect(agent.verifyPresentationLDLocal({ presentation: verifiablePresentation })).resolves.toEqual(true)
    })
  })
}
