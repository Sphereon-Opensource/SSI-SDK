import { CredentialHandlerLDLocal } from '../../agent/CredentialHandlerLDLocal'
import { Resolver } from 'did-resolver'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { createAgent, IDIDManager, IIdentifier, IKeyManager, IResolver, TAgent } from '@veramo/core'
import { KeyManagementSystem } from '@veramo/kms-local'
import { KeyManager, MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { CredentialIssuer, ICredentialIssuer } from '@veramo/credential-w3c'
import { getDidKeyResolver, KeyDIDProvider } from '@veramo/did-provider-key'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { ICredentialHandlerLDLocal, MethodNames } from '../../types/ICredentialHandlerLDLocal'
import { SphereonEd25519Signature2018 } from '../../suites/Ed25519Signature2018'
import { LdDefaultContexts } from '../../ld-default-contexts'

export default (testContext: { setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }) => {
  describe('Issuer Agent Plugin', () => {
    let didKeyIdentifier: IIdentifier
    let didLtoIdentifier: IIdentifier
    let agent: TAgent<IResolver & IKeyManager & IDIDManager & ICredentialIssuer & ICredentialHandlerLDLocal>

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
            },
            store: new MemoryDIDStore(),
            defaultProvider: 'did:key',
          }),
          new DIDResolverPlugin({
            resolver: new Resolver({
              ...getDidKeyResolver(),
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
    })

    afterAll(async () => {
      // await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000)) // avoid jest open handle error
      await testContext.tearDown()
    })

    it('should issue', async () => {
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

      return await expect(
        agent.createVerifiableCredentialLDLocal({
          credential,
        })
      ).resolves.not.toBeNull()
    })
  })
}
