import { createAgent, DIDResolutionResult } from '@veramo/core'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { Resolver } from 'did-resolver'
import { ContextType, getDidJwkResolver, VerificationType, VocabType } from '../src'

const agent = createAgent({
  plugins: [
    new DIDResolverPlugin({
      resolver: new Resolver({ ...getDidJwkResolver() }),
    }),
  ],
})

describe('@sphereon/jwk-did-resolver', () => {
  it('should resolve with did resolution metadata', async () => {
    const identifier =
      'eyJrdHkiOiJFQyIsImNydiI6InNlY3AyNTZrMSIsIngiOiJCS2NlRjMwbHBTNkptT1RsS09LQVdudGtKdVRCSzNGX1JoaXlEcTRtdm9jIiwieSI6Im9WY1phQnpiSFJ2UW5iSXhwRWRXbVlRMGtSRm42ajVDRkVQcGxvX09ON1UifQ'
    const did = `did:jwk:${identifier}`

    const didResolutionResult: DIDResolutionResult = await agent.resolveDid({ didUrl: did })

    expect(didResolutionResult.didResolutionMetadata).toBeDefined()
    expect(didResolutionResult.didResolutionMetadata.contentType).toEqual('application/did+ld+json')
    expect(didResolutionResult.didResolutionMetadata.pattern).toEqual('^(did:jwk:.+)$')
    expect(didResolutionResult.didResolutionMetadata.did).toBeDefined()
    expect(didResolutionResult.didResolutionMetadata.did.didString).toEqual(did)
    expect(didResolutionResult.didResolutionMetadata.did.methodSpecificId).toEqual(identifier)
    expect(didResolutionResult.didResolutionMetadata.did.method).toEqual('jwk')
  })

  it('should resolve to correct did document with no use', async () => {
    const did =
      'did:jwk:eyJrdHkiOiJFQyIsImNydiI6InNlY3AyNTZrMSIsIngiOiJCS2NlRjMwbHBTNkptT1RsS09LQVdudGtKdVRCSzNGX1JoaXlEcTRtdm9jIiwieSI6Im9WY1phQnpiSFJ2UW5iSXhwRWRXbVlRMGtSRm42ajVDRkVQcGxvX09ON1UifQ'

    const didResolutionResult: DIDResolutionResult = await agent.resolveDid({ didUrl: did })

    expect(didResolutionResult.didDocument).toBeDefined()
    expect(didResolutionResult!.didDocument!['@context']).toEqual([
      ContextType.DidDocument,
      {
        '@vocab': VocabType.Jose,
      },
    ])
    expect(didResolutionResult.didDocument!.id).toEqual(did)
    expect(didResolutionResult.didDocument!.verificationMethod).toBeDefined()
    expect(didResolutionResult.didDocument!.verificationMethod!.length).toEqual(1)
    expect(didResolutionResult.didDocument!.verificationMethod![0].id).toEqual('#0')
    expect(didResolutionResult.didDocument!.verificationMethod![0].type).toEqual(VerificationType.JsonWebKey2020)
    expect(didResolutionResult.didDocument!.verificationMethod![0].controller).toEqual(did)
    expect(didResolutionResult.didDocument!.verificationMethod![0].publicKeyJwk).toBeDefined()
    expect(didResolutionResult.didDocument!.keyAgreement).toBeUndefined()
  })

  it('should resolve to correct did document with use encryption', async () => {
    const did =
      'did:jwk:eyJ1c2UiOiJlbmMiLCJrdHkiOiJFQyIsImNydiI6InNlY3AyNTZrMSIsIngiOiJCRnhTU29XTnBCOElYVktUYk44U0xNbVlVeThTSG1Ybk9lb050RHB1QVpNIiwieSI6InBWRmxxSlJqNkNNaFljZ3dqVTk2eko3V09mWk9GWXpScE1selZGT0NKcFEifQ'

    const didResolutionResult: DIDResolutionResult = await agent.resolveDid({ didUrl: did })

    expect(didResolutionResult.didDocument).toBeDefined()
    expect(didResolutionResult.didDocument!.keyAgreement).toEqual(['#0'])
  })

  it('should resolve to correct did document with use signature', async () => {
    const did =
      'did:jwk:eyJ1c2UiOiJzaWciLCJrdHkiOiJFQyIsImNydiI6InNlY3AyNTZrMSIsIngiOiJCUEVwN2lKU2dFREVGZGZpUEJTMnlQbWU4ZzB1UFNZQS14S1VJb1hWdEpvIiwieSI6InhwckRtMExLWGpxSUtGNjI1VGJjN3FhZEVTY1FDSVk1bTlITGkzbmtHT0UifQ'

    const didResolutionResult: DIDResolutionResult = await agent.resolveDid({ didUrl: did })

    expect(didResolutionResult.didDocument).toBeDefined()
    expect(didResolutionResult.didDocument?.keyAgreement).toBeUndefined()
  })
})
