import { createAgent, DIDResolutionResult, IKeyManager } from '@veramo/core'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { KeyManager, MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { KeyManagementSystem } from '@veramo/kms-local'
import { Resolver } from 'did-resolver'
import { getDidJwkResolver, JwkDIDProvider } from '../src'

const DID_METHOD = 'did:jwk'

const jwkDIDProvider = new JwkDIDProvider({
  defaultKms: 'mem',
})

const agent = createAgent<IKeyManager, DIDManager>({
  plugins: [
    new DIDResolverPlugin({
      resolver: new Resolver({...getDidJwkResolver()})
    }),
    new KeyManager({
      store: new MemoryKeyStore(),
      kms: {
        mem: new KeyManagementSystem(new MemoryPrivateKeyStore()),
      },
    }),
    new DIDManager({
      providers: {
        [DID_METHOD]: jwkDIDProvider,
      },
      defaultProvider: DID_METHOD,
      store: new MemoryDIDStore(),
    }),
  ],
})

describe('@sphereon/jwk-did-resolver', () => {
  it('should resolve did:jwk', async () => {
    const didResolutionResult: DIDResolutionResult = await agent.resolveDid({ didUrl: 'did:jwk:eyJrdHkiOiJFQyIsImNydiI6InNlY3AyNTZrMSIsIngiOiJCS2NlRjMwbHBTNkptT1RsS09LQVdudGtKdVRCSzNGX1JoaXlEcTRtdm9jIiwieSI6Im9WY1phQnpiSFJ2UW5iSXhwRWRXbVlRMGtSRm42ajVDRkVQcGxvX09ON1UifQ' })

    expect(didResolutionResult.didResolutionMetadata).not.toBeNull()
    expect(didResolutionResult.didDocument).not.toBeNull()
  })

  it('should resolve with did resolution metadata', async () => {
    const didResolutionResult: DIDResolutionResult = await agent.resolveDid({ didUrl: 'did:jwk:eyJrdHkiOiJFQyIsImNydiI6InNlY3AyNTZrMSIsIngiOiJCS2NlRjMwbHBTNkptT1RsS09LQVdudGtKdVRCSzNGX1JoaXlEcTRtdm9jIiwieSI6Im9WY1phQnpiSFJ2UW5iSXhwRWRXbVlRMGtSRm42ajVDRkVQcGxvX09ON1UifQ' })

    expect(didResolutionResult.didResolutionMetadata).not.toBeNull()
    expect(didResolutionResult.didDocument).not.toBeNull()
    expect(didResolutionResult.didResolutionMetadata.contentType).not.toBeNull()
    expect(didResolutionResult.didResolutionMetadata.pattern).not.toBeNull()
    expect(didResolutionResult.didResolutionMetadata.did).not.toBeNull()
    expect(didResolutionResult.didResolutionMetadata.did.didString).not.toBeNull()
    expect(didResolutionResult.didResolutionMetadata.did.methodSpecificId).not.toBeNull()
    expect(didResolutionResult.didResolutionMetadata.did.method).not.toBeNull()
  })

  it('should resolve to correct did document', async () => {
    const didResolutionResult: DIDResolutionResult = await agent.resolveDid({ didUrl: 'did:jwk:eyJrdHkiOiJFQyIsImNydiI6InNlY3AyNTZrMSIsIngiOiJCS2NlRjMwbHBTNkptT1RsS09LQVdudGtKdVRCSzNGX1JoaXlEcTRtdm9jIiwieSI6Im9WY1phQnpiSFJ2UW5iSXhwRWRXbVlRMGtSRm42ajVDRkVQcGxvX09ON1UifQ' })

    expect(didResolutionResult.didDocument).not.toBeNull()
    expect(didResolutionResult!.didDocument!['@context']).not.toBeNull()
    expect(didResolutionResult!.didDocument!.id).not.toBeNull()
    expect(didResolutionResult!.didDocument!.verificationMethod).not.toBeNull()
    expect(didResolutionResult!.didDocument!.assertionMethod).not.toBeNull()
    expect(didResolutionResult!.didDocument!.authentication).not.toBeNull()
    expect(didResolutionResult!.didDocument!.capabilityInvocation).not.toBeNull()
    expect(didResolutionResult!.didDocument!.capabilityDelegation).not.toBeNull()
    expect(didResolutionResult!.didDocument!.keyAgreement).not.toBeNull()
  })

  it('should resolve to correct did document with use encryption', async () => {
    const didResolutionResult: DIDResolutionResult = await agent.resolveDid({ didUrl: 'did:jwk:eyJ1c2UiOiJlbmMiLCJrdHkiOiJFQyIsImNydiI6InNlY3AyNTZrMSIsIngiOiJCRnhTU29XTnBCOElYVktUYk44U0xNbVlVeThTSG1Ybk9lb050RHB1QVpNIiwieSI6InBWRmxxSlJqNkNNaFljZ3dqVTk2eko3V09mWk9GWXpScE1selZGT0NKcFEifQ' })

    expect(didResolutionResult.didDocument).not.toBeNull()
    expect(didResolutionResult!.didDocument!['@context']).not.toBeNull()
    expect(didResolutionResult!.didDocument!.id).not.toBeNull()
    expect(didResolutionResult!.didDocument!.verificationMethod).not.toBeNull()
    expect(didResolutionResult!.didDocument?.assertionMethod).toBeUndefined()
    expect(didResolutionResult!.didDocument?.authentication).toBeUndefined()
    expect(didResolutionResult!.didDocument?.capabilityInvocation).toBeUndefined()
    expect(didResolutionResult!.didDocument?.capabilityDelegation).toBeUndefined()
    expect(didResolutionResult!.didDocument!.keyAgreement).not.toBeNull()
  })

  it('should resolve to correct did document with use signature', async () => {
    const didResolutionResult: DIDResolutionResult = await agent.resolveDid({ didUrl: 'did:jwk:eyJ1c2UiOiJzaWciLCJrdHkiOiJFQyIsImNydiI6InNlY3AyNTZrMSIsIngiOiJCUEVwN2lKU2dFREVGZGZpUEJTMnlQbWU4ZzB1UFNZQS14S1VJb1hWdEpvIiwieSI6InhwckRtMExLWGpxSUtGNjI1VGJjN3FhZEVTY1FDSVk1bTlITGkzbmtHT0UifQ' })

    expect(didResolutionResult.didDocument).not.toBeNull()
    expect(didResolutionResult!.didDocument!['@context']).not.toBeNull()
    expect(didResolutionResult!.didDocument!.id).not.toBeNull()
    expect(didResolutionResult!.didDocument!.verificationMethod).not.toBeNull()
    expect(didResolutionResult!.didDocument!.assertionMethod).not.toBeNull()
    expect(didResolutionResult!.didDocument!.authentication).not.toBeNull()
    expect(didResolutionResult!.didDocument!.capabilityInvocation).not.toBeNull()
    expect(didResolutionResult!.didDocument!.capabilityDelegation).not.toBeNull()
    expect(didResolutionResult!.didDocument?.keyAgreement).toBeUndefined()
  })

})
