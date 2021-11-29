import { CredentialHandlerLDLocal } from '../agent/CredentialHandlerLDLocal'
import { Resolver } from 'did-resolver'
import { ContextDoc, LdDefaultContexts, VeramoEd25519Signature2018 } from '@veramo/credential-ld'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { createAgent, CredentialPayload, PresentationPayload, IDIDManager, IIdentifier, IKeyManager, IResolver, TAgent } from '@veramo/core'
import { KeyManagementSystem } from '@veramo/kms-local'
import { KeyManager, MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { CredentialIssuer, ICredentialIssuer } from '@veramo/credential-w3c'
import { KeyDIDProvider, getDidKeyResolver } from '@veramo/did-provider-key'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { getUniResolver } from '@sphereon/did-uni-client'
import { LtoDidProvider } from '../../../lto-did-provider/src/lto-did-provider'
import { IDidConnectionMode } from '../../../lto-did-provider/src/types/lto-provider-types'
import { ICredentialHandlerLDLocal } from '../types/ICredentialHandlerLDLocal'

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
            ...getUniResolver('lto', {resolveUrl: 'https://uniresolver.test.sphereon.io/1.0/identifiers'}),
          }),
        }),
        new CredentialIssuer(),
        new CredentialHandlerLDLocal({
          contextMaps: [LdDefaultContexts, customContext],
          suites: [new VeramoEd25519Signature2018()],
        }),
      ],
    })
    didKeyIdentifier = await agent.didManagerCreate()
    didLtoIdentifier = await agent.didManagerImport({provider: 'did:lto', did: 'did:lto:3MzxuUh14pKJ6rJtp4QUR5PJoT6HtK28H4N',
      controllerKeyId: 'did:lto:3MzxuUh14pKJ6rJtp4QUR5PJoT6HtK28H4N#key', keys: [
        {
          privateKeyHex: 'ea6aaeebe17557e0fe256bfce08e8224a412ea1e25a5ec8b5d69618a58bad89e89a4661e446b46401325a38d3b20582d1dd277eb448a3181012a671b7ae15837',
          publicKeyHex: '89a4661e446b46401325a38d3b20582d1dd277eb448a3181012a671b7ae15837',
          kms: 'local',
          kid: 'did:lto:3MzxuUh14pKJ6rJtp4QUR5PJoT6HtK28H4N#key',
          type: 'Ed25519'
        }
      ]
    })
  })

  it('works with Ed25519Signature2018', async () => {
    const credentialPayload: CredentialPayload = {
      issuer: didKeyIdentifier.did,
      '@context': ['custom:example.context'],
      credentialSubject: {
        nothing: 'else matters',
      },
    }
    const verifiableCredential = await agent.createVerifiableCredential({
      credential: credentialPayload,
      proofFormat: 'lds',
    })

    expect(verifiableCredential).toBeDefined()

    const verifiedCredential = await agent.verifyCredential({
      credential: verifiableCredential,
    })

    expect(verifiedCredential).toBe(true)

    const presentationPayload: PresentationPayload = {
      holder: didLtoIdentifier.did,

      verifiableCredential: [verifiableCredential],
    }
    const verifiablePresentation = await agent.createVerifiablePresentationLDLocal({
      keyRef: didLtoIdentifier.controllerKeyId,
      presentation: presentationPayload,

      challenge: 'test',
      domain: 'test',
    })

    expect(verifiablePresentation).toBeDefined()

    const verifiedPresentation = await agent.verifyPresentation({
      presentation: verifiablePresentation,
      domain: 'test',
      challenge: 'test',
    })

    expect(verifiedPresentation).toBe(true)
  })
})
