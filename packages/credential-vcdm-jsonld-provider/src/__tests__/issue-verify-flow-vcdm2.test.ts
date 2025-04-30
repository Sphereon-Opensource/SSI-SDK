import { beforeAll, describe, expect, it } from 'vitest'
import { getDidKeyResolver, SphereonKeyDidProvider } from '@sphereon/ssi-sdk-ext.did-provider-key'
import { IdentifierResolution, IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { SphereonKeyManager } from '@sphereon/ssi-sdk-ext.key-manager'
import { SphereonKeyManagementSystem } from '@sphereon/ssi-sdk-ext.kms-local'
import { createAgent, CredentialPayload, IDIDManager, IIdentifier, IKeyManager, IResolver, PresentationPayload, TAgent } from '@veramo/core'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { Resolver } from 'did-resolver'
import { CredentialProviderJsonld } from '../agent'
import { LdDefaultContexts } from '../ld-default-contexts'
import { SphereonEd25519Signature2020 } from '../suites'

import { bedrijfsInformatieV1, exampleV1 } from './mocks'
import { ContextDoc, IVcdmCredentialPlugin, VcdmCredentialPlugin } from '@sphereon/ssi-sdk.credential-vcdm'
import { ControllerProofPurpose } from '../enums'

const customContext = new Map<string, ContextDoc>([
  [`https://www.w3.org/2018/credentials/examples/v1`, exampleV1],
  ['https://sphereon-opensource.github.io/vc-contexts/myc/bedrijfsinformatie-v1.jsonld', bedrijfsInformatieV1],
])

describe('credential-LD full flow with VCDM2', () => {
  let didKeyIdentifier: IIdentifier
  let agent: TAgent<IResolver & IKeyManager & IDIDManager & IIdentifierResolution & IVcdmCredentialPlugin>
  const jsonld = new CredentialProviderJsonld({
    contextMaps: [LdDefaultContexts],
    suites: [new SphereonEd25519Signature2020()],
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
          },
          store: new MemoryDIDStore(),
          defaultProvider: 'did:key',
        }),
        new DIDResolverPlugin({
          resolver: new Resolver({
            ...getDidKeyResolver(),
          }),
        }),
        new VcdmCredentialPlugin({ issuers: [jsonld] }),
      ],
    })
    didKeyIdentifier = await agent.didManagerCreate({ provider: 'did:key', options: { type: 'Ed25519' } })
    console.log('didKeyIdentifier', didKeyIdentifier.did)
  })

  it('should work with Ed25519Signature2020', async () => {
    const credentialPayload: CredentialPayload = {
      issuer: didKeyIdentifier.did,
      type: ['VerifiableCredential', 'AlumniCredential'],
      '@context': ['https://www.w3.org/ns/credentials/v2', 'https://www.w3.org/ns/credentials/examples/v2'],
      issuanceDate: '2020-08-19T21:41:50Z',
      credentialSubject: {
        id: didKeyIdentifier.did,
        mySubjectProperty: 'mySubjectValue',
      },
    }
    const verifiableCredential = await agent.createVerifiableCredential({
      credential: credentialPayload,
      proofFormat: 'lds',
      fetchRemoteContexts: true,
    })
    console.log(JSON.stringify(verifiableCredential, null, 2))

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
              'https://www.w3.org/ns/credentials/v2',
              'https://www.w3.org/ns/credentials/examples/v2',
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
      proofFormat: 'lds',
      presentation: presentationPayload,
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
                  'https://www.w3.org/ns/credentials/v2',
                  'https://www.w3.org/ns/credentials/examples/v2',
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
              '@context': ['https://www.w3.org/ns/credentials/v2', 'https://w3id.org/security/suites/ed25519-2020/v1'],
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
