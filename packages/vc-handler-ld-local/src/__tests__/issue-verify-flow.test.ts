import { CredentialHandlerLDLocal } from '../agent/CredentialHandlerLDLocal'
import { Resolver } from 'did-resolver'
import { ContextDoc, LdDefaultContexts, VeramoEd25519Signature2018 } from '@veramo/credential-ld'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { createAgent, CredentialPayload, IDIDManager, IIdentifier, IKeyManager, IResolver, PresentationPayload, TAgent } from '@veramo/core'
import { KeyManagementSystem } from '@veramo/kms-local'
import { KeyManager, MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { CredentialIssuer, ICredentialIssuer } from '@veramo/credential-w3c'
import { getDidKeyResolver, KeyDIDProvider } from '@veramo/did-provider-key'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { getUniResolver } from '@sphereon/did-uni-client'
import { LtoDidProvider } from '../../../lto-did-provider/src/lto-did-provider'
import { IDidConnectionMode } from '../../../lto-did-provider/src/types/lto-provider-types'
import { ICredentialHandlerLDLocal, MethodNames } from '../types/ICredentialHandlerLDLocal'

const customContext: Record<string, ContextDoc> = {
  'custom:example.context': {
    '@context': {
      nothing: 'custom:example.context#blank',
    },
  },
}

describe('credential-LD full flow', () => {
  let didKeyIdentifier: IIdentifier
  let didLtoIdentifier: IIdentifier
  let agent: TAgent<IResolver & IKeyManager & IDIDManager & ICredentialIssuer & ICredentialHandlerLDLocal>

  jest.setTimeout(1000000)
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
            ...getUniResolver('lto', { resolveUrl: 'https://uniresolver.test.sphereon.io/1.0/identifiers' }),
          }),
        }),
        new CredentialIssuer(),
        new CredentialHandlerLDLocal({
          contextMaps: [LdDefaultContexts /*, customContext*/],
          suites: [new VeramoEd25519Signature2018()],
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
      did: 'did:lto:3MsS3gqXkcx9m4wYSbfprYfjdZTFmx2ofdX',
      controllerKeyId: 'did:lto:3MsS3gqXkcx9m4wYSbfprYfjdZTFmx2ofdX#sign',
      keys: [
        {
          privateKeyHex:
            '078c0f0eaa6510fab9f4f2cf8657b32811c53d7d98869fd0d5bd08a7ba34376b8adfdd44784dea407e088ff2437d5e2123e685a26dca91efceb7a9f4dfd81848',
          publicKeyHex: '8adfdd44784dea407e088ff2437d5e2123e685a26dca91efceb7a9f4dfd81848',
          kms: 'local',
          kid: 'did:lto:3MsS3gqXkcx9m4wYSbfprYfjdZTFmx2ofdX#sign',
          type: 'Ed25519',
        },
      ],
    })
  })

  it('works with Ed25519Signature2018', async () => {
    const credentialPayload: CredentialPayload = {
      issuer: didKeyIdentifier.did,
      type: ['VerifiableCredential', 'AlumniCredential'],
      '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2018/credentials/examples/v1'],
      credentialSubject: {
        id: didLtoIdentifier.did,
        alumniOf: {
          id: 'did:example:c276e12ec21ebfeb1f712ebc6f1',
          name: 'Example University',
        },
      },
    }
    const verifiableCredential = await agent.createVerifiableCredential({
      credential: credentialPayload,
      proofFormat: 'lds',
    })

    expect(verifiableCredential).toBeDefined()

    const verifiedCredential = await agent.verifyCredentialLDLocal({
      credential: verifiableCredential,
      fetchRemoteContexts: false,
    })

    expect(verifiedCredential).toBe(true)

    const presentationPayload: PresentationPayload = {
      holder: didKeyIdentifier.did,

      verifiableCredential: [verifiableCredential],
    }
    const verifiablePresentation = await agent.createVerifiablePresentationLDLocal({
      keyRef: didKeyIdentifier.controllerKeyId,
      presentation: presentationPayload,

      challenge: 'test',
      domain: 'test',
    })

    expect(verifiablePresentation).toBeDefined()

    const verifiedPresentation = await agent.verifyPresentation({
      presentation: verifiablePresentation,
      domain: 'test',
      challenge: 'test',
      fetchRemoteContexts: false,
    })

    expect(verifiedPresentation).toBe(true)
  })
})
