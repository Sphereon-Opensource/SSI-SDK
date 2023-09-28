import { createAgent, IDIDManager, IKeyManager, IResolver, TAgent, W3CVerifiableCredential } from '@veramo/core'
import { CredentialPlugin } from '@veramo/credential-w3c'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { getDidKeyResolver, KeyDIDProvider } from '@veramo/did-provider-key'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { KeyManager, MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { KeyManagementSystem } from '@veramo/kms-local'
import { Resolver } from 'did-resolver'
// @ts-ignore
import nock from 'nock'
import { CredentialHandlerLDLocal } from '../agent'
import { LdDefaultContexts } from '../ld-default-contexts'
import { SphereonEd25519Signature2018 } from '../suites'
import { SphereonEd25519Signature2020 } from '../suites'
import { ICredentialHandlerLDLocal, MethodNames } from '../types'
import { diwalaVC } from './fixtures/diwala'

jest.setTimeout(100000)

describe('Diwala issued VC', () => {
  let agent: TAgent<IResolver & IKeyManager & IDIDManager & ICredentialHandlerLDLocal>

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
        new CredentialPlugin(),
        new CredentialHandlerLDLocal({
          contextMaps: [LdDefaultContexts],
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
  })

  it('should be verified with Ed25519Signature2018', async () => {
    const verifiableCredential: W3CVerifiableCredential = diwalaVC
    expect(verifiableCredential).toBeDefined()
    // console.log(verifiableCredential)

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
            '@context': ['https://www.w3.org/2018/credentials/v1', 'https://purl.imsglobal.org/spec/ob/v3p0/context.json'],
            created: '2023-05-06T00:57:07Z',
            jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..d3MzWbyiG-gWH4LV15waD7UXXDC9-qKqJpx1g7tOeSrw7TdDeIrzzP9xr-e93ppWN0oYflp1xBxHZaUU2b2SCQ',
            proofPurpose: 'assertionMethod',
            type: 'Ed25519Signature2018',
            verificationMethod: 'did:key:z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9#z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9',
          },
          purposeResult: {
            controller: {
              '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/suites/ed25519-2018/v1'],
              assertionMethod: ['did:key:z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9#z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9'],
              authentication: ['did:key:z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9#z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9'],
              capabilityDelegation: ['did:key:z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9#z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9'],
              capabilityInvocation: ['did:key:z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9#z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9'],
              id: 'did:key:z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9',
              verificationMethod: [
                {
                  controller: 'did:key:z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9',
                  id: 'did:key:z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9#z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9',
                  publicKeyBase58: 'DYGA3LbwgD66VokM9CQsB3XwrPNzoyX79P19mpPjTp4m',
                  type: 'Ed25519VerificationKey2018',
                },
              ],
            },
            valid: true,
          },
          verificationMethod: {
            '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/suites/ed25519-2018/v1'],
            controller: {
              id: 'did:key:z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9#z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9',
              // @fixme: The above is incorrect. Controller should be the DID not a VM, like below
              //id: 'did:key:z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9',
            },
            id: 'did:key:z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9#z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9',
            publicKeyBase58: 'DYGA3LbwgD66VokM9CQsB3XwrPNzoyX79P19mpPjTp4m',
            type: 'Ed25519VerificationKey2018',
          },
          verified: true,
        },
      ],
      verified: true,
    })
  })
})
