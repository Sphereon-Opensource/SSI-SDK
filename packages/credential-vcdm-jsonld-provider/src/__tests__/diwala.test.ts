import { beforeAll, describe, expect, it } from 'vitest'
import { createAgent, IDIDManager, IKeyManager, IResolver, TAgent, W3CVerifiableCredential } from '@veramo/core'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { getDidKeyResolver, SphereonKeyDidProvider } from '@sphereon/ssi-sdk-ext.did-provider-key'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { Resolver } from 'did-resolver'
// @ts-ignore
import nock from 'nock'
import { CredentialProviderJsonld } from '../agent'
import { LdDefaultContexts } from '../ld-default-contexts'
import { SphereonEd25519Signature2018, SphereonEd25519Signature2020 } from '../suites'
import { diwalaVC } from './fixtures/diwala'
import { SphereonKeyManagementSystem } from '@sphereon/ssi-sdk-ext.kms-local'
import { SphereonKeyManager } from '@sphereon/ssi-sdk-ext.key-manager'
import { IVcdmCredentialPlugin, VcdmCredentialPlugin } from '@sphereon/ssi-sdk.credential-vcdm'

//jest.setTimeout(100000)

describe('Diwala issued VC', () => {
  let agent: TAgent<IResolver & IKeyManager & IDIDManager & IVcdmCredentialPlugin>

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
  })

  it('should be verified with Ed25519Signature2018', async () => {
    const verifiableCredential: W3CVerifiableCredential = diwalaVC
    expect(verifiableCredential).toBeDefined()
    // console.log(verifiableCredential)

    const verifiedCredential = await agent.verifyCredential({
      credential: verifiableCredential,
      fetchRemoteContexts: true,
    })

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
            '@context': ['https://www.w3.org/2018/credentials/v1', 'https://purl.imsglobal.org/spec/ob/v3p0/context.json'],
            created: '2023-05-06T00:57:07Z',
            jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..d3MzWbyiG-gWH4LV15waD7UXXDC9-qKqJpx1g7tOeSrw7TdDeIrzzP9xr-e93ppWN0oYflp1xBxHZaUU2b2SCQ',
            proofPurpose: 'assertionMethod',
            type: 'Ed25519Signature2018',
            verificationMethod: 'did:key:z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9#z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9',
          },
          purposeResult: {
            controller: {
              assertionMethod: ['did:key:z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9#z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9'],
              id: 'did:key:z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9',
              verificationMethod: [
                {
                  controller: 'did:key:z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9',
                  id: 'did:key:z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9#z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9',
                  type: 'Ed25519VerificationKey2020',
                },
              ],
            },
            valid: true,
          },
          verificationMethod: {
            controller: 'did:key:z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9',
            id: 'did:key:z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9#z6MkrzXCdarP1kaZcJb3pmNi295wfxerDrmTqPv5c6MkP2r9',
            // publicKeyBase58: 'DYGA3LbwgD66VokM9CQsB3XwrPNzoyX79P19mpPjTp4m',
            type: 'Ed25519VerificationKey2020',
          },
          verified: true,
        },
      ],
      verified: true,
    })
  })
})
