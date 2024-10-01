import { getUniResolver } from '@sphereon/did-uni-client'
import { IdentifierResolution, IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { createAgent, CredentialPayload, IDIDManager, IIdentifier, IKeyManager, IResolver, PresentationPayload, TAgent } from '@veramo/core'
import { CredentialPlugin, ICredentialIssuer } from '@veramo/credential-w3c'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { getDidKeyResolver, KeyDIDProvider } from '@veramo/did-provider-key'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { KeyManager, MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { KeyManagementSystem } from '@veramo/kms-local'
import { Resolver } from 'did-resolver'
// @ts-ignore
import nock from 'nock'

import { LtoDidProvider, IDidConnectionMode } from '@sphereon/ssi-sdk-ext.did-provider-lto'
import { CredentialHandlerLDLocal } from '../agent/CredentialHandlerLDLocal'
import { LdDefaultContexts } from '../ld-default-contexts'
import { SphereonEd25519Signature2018 } from '../suites/Ed25519Signature2018'
import { SphereonEd25519Signature2020 } from '../suites/Ed25519Signature2020'
import { ICredentialHandlerLDLocal, MethodNames } from '../types/ICredentialHandlerLDLocal'
import { ContextDoc, ControllerProofPurpose } from '../types/types'

import { bedrijfsInformatieV1, exampleV1, factomDIDResolutionResult_2018, ltoDIDResolutionResult, ltoDIDSubjectResolutionResult_2018 } from './mocks'

jest.setTimeout(100000)

const LTO_DID = 'did:lto:3MsS3gqXkcx9m4wYSbfprYfjdZTFmx2ofdX'
const FACTOM_DID = 'did:factom:9d612c949afee208f664e81dc16bdb4f4eff26776ebca2e94a9f06a40d68626d'
const customContext = new Map<string, ContextDoc>([
  [`https://www.w3.org/2018/credentials/examples/v1`, exampleV1],
  ['https://sphereon-opensource.github.io/vc-contexts/myc/bedrijfsinformatie-v1.jsonld', bedrijfsInformatieV1],
])

describe('credential-LD full flow', () => {
  let didKeyIdentifier: IIdentifier
  let didLtoIdentifier: IIdentifier
  let agent: TAgent<IResolver & IKeyManager & IDIDManager & IIdentifierResolution & ICredentialIssuer & ICredentialHandlerLDLocal>

  // jest.setTimeout(1000000)
  beforeAll(async () => {
    agent = createAgent({
      plugins: [
        new KeyManager({
          store: new MemoryKeyStore(),
          kms: {
            local: new KeyManagementSystem(new MemoryPrivateKeyStore()),
          },
        }),
        new IdentifierResolution({ crypto: global.crypto }),
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
            ...getUniResolver('factom', { resolveUrl: 'https://factom-mock/1.0/identifiers' }),
          }),
        }),
        new CredentialPlugin(),
        new CredentialHandlerLDLocal({
          contextMaps: [LdDefaultContexts, customContext],
          suites: [new SphereonEd25519Signature2018(), new SphereonEd25519Signature2020()],
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

  it('should work with Ed25519Signature2018', async () => {
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
      fetchRemoteContexts: true,
    })

    expect(verifiedCredential).toMatchObject({
      log: [
        {
          id: 'expiration',
          valid: true,
        },
        {
          id: 'valid_signature',
          valid: true,
        },
        {
          id: 'issuer_did_resolves',
          valid: true,
        },
        {
          id: 'revocation_status',
          valid: true,
        },
      ],
      results: [
        {
          log: [
            {
              id: 'expiration',
              valid: true,
            },
            {
              id: 'valid_signature',
              valid: true,
            },
            {
              id: 'issuer_did_resolves',
              valid: true,
            },
            {
              id: 'revocation_status',
              valid: true,
            },
          ],
          proof: {
            '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2018/credentials/examples/v1'],
            proofPurpose: 'assertionMethod',
            type: 'Ed25519Signature2018',
          },
          purposeResult: {
            controller: {
              '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/suites/ed25519-2018/v1'],
            },
            valid: true,
          },
          verificationMethod: {
            '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/suites/ed25519-2018/v1'],
            type: 'Ed25519VerificationKey2018',
          },
          verified: true,
        },
      ],
      verified: true,
    })

    const presentationPayload: PresentationPayload = {
      holder: didLtoIdentifier.did,

      verifiableCredential: [verifiableCredential],
    }
    const verifiablePresentation = await agent.createVerifiablePresentationLDLocal({
      keyRef: didLtoIdentifier.controllerKeyId,
      presentation: presentationPayload,
      // We are overriding the purpose since the DID in this test does not have an authentication proof purpose
      purpose: new ControllerProofPurpose({ term: 'verificationMethod' }),
    })

    expect(verifiablePresentation).toBeDefined()

    const verifiedPresentation = await agent.verifyPresentationLDLocal({
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
              id: 'expiration',
              valid: true,
            },
            {
              id: 'valid_signature',
              valid: true,
            },
            {
              id: 'issuer_did_resolves',
              valid: true,
            },
            {
              id: 'revocation_status',
              valid: true,
            },
          ],
          results: [
            {
              log: [
                {
                  id: 'expiration',
                  valid: true,
                },
                {
                  id: 'valid_signature',
                  valid: true,
                },
                {
                  id: 'issuer_did_resolves',
                  valid: true,
                },
                {
                  id: 'revocation_status',
                  valid: true,
                },
              ],
              proof: {
                '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2018/credentials/examples/v1'],
                proofPurpose: 'assertionMethod',
                type: 'Ed25519Signature2018',
              },
              purposeResult: {
                valid: true,
              },
              verificationMethod: {
                '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/suites/ed25519-2018/v1'],
                type: 'Ed25519VerificationKey2018',
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
              '@context': ['https://www.w3.org/2018/credentials/v1'],
              proofPurpose: 'verificationMethod',
              type: 'Ed25519Signature2018',
            },
            purposeResult: {
              controller: {
                '@context': 'https://www.w3.org/ns/did/v1',
              },
              valid: true,
            },
            verificationMethod: {
              '@context': 'https://www.w3.org/ns/did/v1',
              type: 'Ed25519VerificationKey2018',
            },
            verified: true,
          },
        ],
        verified: true,
      },
      verified: true,
    })
  })

  it('should verify issued credential with Factom issuer', async () => {
    nock('https://factom-mock/1.0/identifiers')
      .get(`/${FACTOM_DID}`)
      .times(3)
      .reply(200, {
        ...factomDIDResolutionResult_2018,
      })
    nock('https://lto-mock/1.0/identifiers')
      .get(`/did:lto:3MrjGusMnFspFfyVctYg3cJaNKGnaAhMZXM`)
      .times(3)
      .reply(200, {
        ...ltoDIDSubjectResolutionResult_2018,
      })

    const credential = {
      '@context': ['https://www.w3.org/2018/credentials/v1', 'https://sphereon-opensource.github.io/vc-contexts/myc/bedrijfsinformatie-v1.jsonld'],
      issuer: FACTOM_DID,
      issuanceDate: '2021-12-02T02:55:39.608Z',
      credentialSubject: {
        Bedrijfsinformatie: {
          id: 'did:lto:3MrjGusMnFspFfyVctYg3cJaNKGnaAhMZXM',
          naam: 'Test Bedrijf',
          kvkNummer: '1234',
          rechtsvorm: '1234',
          straatnaam: 'Kerkstraat',
          huisnummer: '11',
          postcode: '1111 AB',
          plaats: 'Voorbeeld',
          bagId: '12132',
          datumAkteOprichting: '2020-12-30',
        },
      },
      type: ['VerifiableCredential', 'Bedrijfsinformatie'],
      proof: {
        type: 'Ed25519Signature2018',
        created: '2021-12-02T02:55:39Z',
        jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..SsE_Z6iAktFvsiB1FRJT7lGMnCjHjZ6kvjmXLjJWFZG6trMlm1IJtwvGm1huRgFKfjyiB2LK3166eSboWqwPCg',
        proofPurpose: 'assertionMethod',
        verificationMethod: `${FACTOM_DID}#key-0`,
      },
    }

    const verifiedCredential = await agent.verifyCredentialLDLocal({
      credential,
      fetchRemoteContexts: true,
    })

    expect(verifiedCredential).toMatchObject({
      log: [
        {
          id: 'expiration',
          valid: true,
        },
        {
          id: 'valid_signature',
          valid: true,
        },
        {
          id: 'issuer_did_resolves',
          valid: true,
        },
        {
          id: 'revocation_status',
          valid: true,
        },
      ],
      results: [
        {
          log: [
            {
              id: 'expiration',
              valid: true,
            },
            {
              id: 'valid_signature',
              valid: true,
            },
            {
              id: 'issuer_did_resolves',
              valid: true,
            },
            {
              id: 'revocation_status',
              valid: true,
            },
          ],
          proof: {
            '@context': [
              'https://www.w3.org/2018/credentials/v1',
              'https://sphereon-opensource.github.io/vc-contexts/myc/bedrijfsinformatie-v1.jsonld',
            ],
            type: 'Ed25519Signature2018',
          },
          purposeResult: {
            controller: {
              '@context': ['https://www.w3.org/ns/did/v1'],
              assertionMethod: [
                {
                  type: 'Ed25519VerificationKey2018',
                },
              ],
              authentication: [
                {
                  type: 'Ed25519VerificationKey2018',
                },
              ],
              capabilityInvocation: [
                {
                  type: 'Ed25519VerificationKey2018',
                },
              ],
              keyAgreement: [
                {
                  type: 'Ed25519VerificationKey2018',
                },
              ],
              verificationMethod: [
                {
                  type: 'Ed25519VerificationKey2018',
                },
              ],
            },
            valid: true,
          },
          verificationMethod: {
            '@context': ['https://www.w3.org/ns/did/v1'],
            type: 'Ed25519VerificationKey2018',
          },
          verified: true,
        },
      ],
      verified: true,
    })
  })
})
