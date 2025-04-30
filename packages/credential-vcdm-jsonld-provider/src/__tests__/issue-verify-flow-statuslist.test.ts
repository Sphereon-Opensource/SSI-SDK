import { describe, expect, it, beforeAll } from 'vitest'
import { IdentifierResolution, IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { createNewStatusList } from '@sphereon/ssi-sdk.vc-status-list'
import { StatusListType } from '@sphereon/ssi-types'
import { createAgent, IDIDManager, IIdentifier, IKeyManager, IResolver, TAgent } from '@veramo/core'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { getDidKeyResolver, SphereonKeyDidProvider } from '@sphereon/ssi-sdk-ext.did-provider-key'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { Resolver } from 'did-resolver'
import { CredentialProviderJsonld } from '../agent'
import { LdDefaultContexts } from '../ld-default-contexts'
import { SphereonEd25519Signature2018, SphereonEd25519Signature2020 } from '../suites'

import { bedrijfsInformatieV1, exampleV1 } from './mocks'
import { ContextDoc, IVcdmCredentialPlugin, VcdmCredentialPlugin } from '@sphereon/ssi-sdk.credential-vcdm'
import { SphereonKeyManager } from '@sphereon/ssi-sdk-ext.key-manager'
import { SphereonKeyManagementSystem } from '@sphereon/ssi-sdk-ext.kms-local'

//jest.setTimeout(100000)

const customContext = new Map<string, ContextDoc>([
  [`https://www.w3.org/2018/credentials/examples/v1`, exampleV1],
  ['https://sphereon-opensource.github.io/vc-contexts/myc/bedrijfsinformatie-v1.jsonld', bedrijfsInformatieV1],
])

describe('credential-LD full flow', () => {
  let didKeyIdentifier: IIdentifier
  let agent: TAgent<IResolver & IKeyManager & IDIDManager & IVcdmCredentialPlugin & IIdentifierResolution>

  const jsonld = new CredentialProviderJsonld({
    contextMaps: [LdDefaultContexts, customContext],
    suites: [new SphereonEd25519Signature2018(), new SphereonEd25519Signature2020()],
  })

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
        new IdentifierResolution({}),
        new VcdmCredentialPlugin({ issuers: [jsonld] }),
      ],
    })
    didKeyIdentifier = await agent.didManagerCreate({ options: { type: 'Ed25519' } })
    console.log(JSON.stringify(didKeyIdentifier, null, 2))
  })

  it('create a new status list', async () => {
    const statusList = await createNewStatusList(
      {
        type: StatusListType.StatusList2021,
        proofFormat: 'lds',
        id: 'http://localhost:9543/list1',
        issuer: didKeyIdentifier.did,
        length: 99999,
        correlationId: '1234',
        statusList2021: {
          statusPurpose: 'revocation',
          indexingDirection: 'rightToLeft',
        },
      },
      { agent },
    )
    expect(statusList).toBeDefined()
    expect(statusList.id).toEqual('http://localhost:9543/list1')
    expect(statusList.encodedList).toBeDefined()
    expect(statusList.issuer).toEqual(didKeyIdentifier.did)
    expect(statusList.length).toEqual(99999)
    expect(statusList.statusList2021).toBeTruthy()
    expect(statusList.statusList2021!.indexingDirection).toEqual('rightToLeft')
    expect(statusList.statusList2021!.statusPurpose).toEqual('revocation')
    expect(statusList.proofFormat).toEqual('lds')
    expect(statusList.statusListCredential).toBeDefined()
  })
})
