import { beforeAll, describe, expect, it } from 'vitest'
import { getUniResolver } from '@sphereon/did-uni-client'
import { getDidKeyResolver, SphereonKeyDidProvider } from '@sphereon/ssi-sdk-ext.did-provider-key'

import { IDidConnectionMode, LtoDidProvider } from '@sphereon/ssi-sdk-ext.did-provider-lto'
import { IdentifierResolution, IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { SphereonKeyManager } from '@sphereon/ssi-sdk-ext.key-manager'
import { SphereonKeyManagementSystem } from '@sphereon/ssi-sdk-ext.kms-local'
import { createAgent, CredentialPayload, IDIDManager, IIdentifier, IKeyManager, IResolver, PresentationPayload, TAgent } from '@veramo/core'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { Resolver } from 'did-resolver'
// @ts-ignore
import nock from 'nock'
import { CredentialProviderJsonld } from '../agent/CredentialProviderJsonld'
import { LdDefaultContexts } from '../ld-default-contexts'
import { SphereonEd25519Signature2018, SphereonEd25519Signature2020 } from '../suites'
import { bedrijfsInformatieV1, exampleV1, ltoDIDResolutionResult } from './mocks'
import { ContextDoc, IVcdmCredentialPlugin, VcdmCredentialPlugin } from '@sphereon/ssi-sdk.credential-vcdm'
import { ControllerProofPurpose } from '../enums'

const LTO_DID = 'did:lto:3MsS3gqXkcx9m4wYSbfprYfjdZTFmx2ofdX'
const FACTOM_DID = 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d'
const customContext = new Map<string, ContextDoc>([
  [`https://www.w3.org/2018/credentials/examples/v1`, exampleV1],
  ['https://sphereon-opensource.github.io/vc-contexts/myc/bedrijfsinformatie-v1.jsonld', bedrijfsInformatieV1],
])

describe('credential-LD full flow', () => {
  let didKeyIdentifier: IIdentifier
  let didLtoIdentifier: IIdentifier
  let agent: TAgent<IResolver & IKeyManager & IDIDManager & IIdentifierResolution & IVcdmCredentialPlugin>

  const jsonld = new CredentialProviderJsonld({
    contextMaps: [LdDefaultContexts],
    suites: [new SphereonEd25519Signature2018(), new SphereonEd25519Signature2020()],
  })

  // //jest.setTimeout(1000000)
  beforeAll(async () => {
    agent = createAgent({
      plugins: [
        new SphereonKeyManager({
          store: new MemoryKeyStore(),
          kms: {
            local: new SphereonKeyManagementSystem(new MemoryPrivateKeyStore()),
          },
        }),
        new IdentifierResolution({ crypto: global.crypto }),
        new DIDManager({
          providers: {
            'did:key': new SphereonKeyDidProvider({ defaultKms: 'local' }),
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
            ...getUniResolver('factom', { resolveUrl: 'https://factom-mock/1.0/identifiers' }),
          }),
        }),
        new VcdmCredentialPlugin({ issuers: [jsonld] }),
      ],
    })
    didKeyIdentifier = await agent.didManagerCreate({ provider: 'did:key', options: { type: 'Ed25519' } })
    console.log('didKeyIdentifier', didKeyIdentifier.did)
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

  it('should work with Ed25519Signature2020', async () => {
    nock('https://lto-mock/1.0/identifiers')
      .get(`/${LTO_DID}`)
      .times(5)
      .reply(200, {
        ...ltoDIDResolutionResult,
      })
    const credentialPayload: CredentialPayload = {
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
    const verifiableCredential = await agent.createVerifiableCredential({
      credential: credentialPayload,
      proofFormat: 'lds',
      fetchRemoteContexts: true,
    })

    expect(verifiableCredential).toBeDefined()

    const verifiedCredential = await agent.verifyCredential({
      credential: verifiableCredential,
      fetchRemoteContexts: true,
    })

    console.log(JSON.stringify(verifiedCredential, null, 2))

    expect(verifiedCredential).toMatchObject({
      log: [
        {
          id: 'valid_signature',
          valid: true,
        },
        {
          id: 'issuer_did_resolves',
          valid: true,
        },
        {
          id: 'expiration',
          valid: true,
        },
      ],
      results: [
        {
          log: [
            {
              id: 'valid_signature',
              valid: true,
            },
            {
              id: 'issuer_did_resolves',
              valid: true,
            },
            {
              id: 'expiration',
              valid: true,
            },
          ],
          proof: {
            '@context': [
              'https://www.w3.org/2018/credentials/v1',
              'https://www.w3.org/2018/credentials/examples/v1',
              'https://w3id.org/security/suites/ed25519-2020/v1',
            ],
            proofPurpose: 'assertionMethod',
            type: 'Ed25519Signature2020',
          },
          purposeResult: {
            controller: {
              '@context': [
                'https://www.w3.org/ns/did/v1',
                'https://w3id.org/security/suites/ed25519-2020/v1',
                'https://w3id.org/security/suites/x25519-2020/v1',
              ],
            },
            valid: true,
          },
          verificationMethod: {
            '@context': [
              'https://www.w3.org/ns/did/v1',
              'https://w3id.org/security/suites/ed25519-2020/v1',
              'https://w3id.org/security/suites/x25519-2020/v1',
            ],
            type: 'Ed25519VerificationKey2020',
          },
          verified: true,
        },
      ],
      verified: true,
    })

    const presentationPayload: PresentationPayload = {
      holder: didKeyIdentifier.did,

      verifiableCredential: [verifiableCredential],
    }
    const verifiablePresentation = await agent.createVerifiablePresentation({
      keyRef: didKeyIdentifier.controllerKeyId,
      presentation: presentationPayload,
      proofFormat: 'lds',
      // We are overriding the purpose since the DID in this test does not have an authentication proof purpose
      purpose: new ControllerProofPurpose({ term: 'verificationMethod' }),
    })

    expect(verifiablePresentation).toBeDefined()

    const verifiedPresentation = await agent.verifyPresentation({
      presentation: verifiablePresentation,
      fetchRemoteContexts: true,
      // We are overriding the purpose since the DID in this test does not have an authentication proof purpose
      presentationPurpose: new ControllerProofPurpose({ term: 'verificationMethod' }),
    })

    expect(verifiedPresentation).toMatchObject({
      credentialResults: [
        {
          log: [
            {
              id: 'valid_signature',
              valid: true,
            },
            {
              id: 'issuer_did_resolves',
              valid: true,
            },
            {
              id: 'expiration',
              valid: true,
            },
          ],
          results: [
            {
              log: [
                {
                  id: 'valid_signature',
                  valid: true,
                },
                {
                  id: 'issuer_did_resolves',
                  valid: true,
                },
                {
                  id: 'expiration',
                  valid: true,
                },
              ],
              proof: {
                '@context': [
                  'https://www.w3.org/2018/credentials/v1',
                  'https://www.w3.org/2018/credentials/examples/v1',
                  'https://w3id.org/security/suites/ed25519-2020/v1',
                ],
                proofPurpose: 'assertionMethod',
                type: 'Ed25519Signature2020',
              },
              purposeResult: {
                valid: true,
              },
              verificationMethod: {
                '@context': [
                  'https://www.w3.org/ns/did/v1',
                  'https://w3id.org/security/suites/ed25519-2020/v1',
                  'https://w3id.org/security/suites/x25519-2020/v1',
                ],
                type: 'Ed25519VerificationKey2020',
              },
              verified: true,
            },
          ],
          verified: true,
        },
      ],
      presentationResult: {
        results: [
          {
            proof: {
              '@context': ['https://www.w3.org/2018/credentials/v1', 'https://w3id.org/security/suites/ed25519-2020/v1'],
              proofPurpose: 'verificationMethod',
              type: 'Ed25519Signature2020',
            },
            purposeResult: {
              controller: {
                '@context': [
                  'https://www.w3.org/ns/did/v1',
                  'https://w3id.org/security/suites/ed25519-2020/v1',
                  'https://w3id.org/security/suites/x25519-2020/v1',
                ],
              },
              valid: true,
            },
            verificationMethod: {
              '@context': [
                'https://www.w3.org/ns/did/v1',
                'https://w3id.org/security/suites/ed25519-2020/v1',
                'https://w3id.org/security/suites/x25519-2020/v1',
              ],
              type: 'Ed25519VerificationKey2020',
            },
            verified: true,
          },
        ],
        verified: true,
      },
      verified: true,
    })
  })
})
