import { IdentifierResolution, IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { createNewStatusList } from '@sphereon/ssi-sdk.vc-status-list'
import { StatusListType } from '@sphereon/ssi-types'
import { createAgent, ICredentialPlugin, IDIDManager, IIdentifier, IKeyManager, IResolver, TAgent } from '@veramo/core'
import { CredentialPlugin, ICredentialIssuer } from '@veramo/credential-w3c'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { getDidKeyResolver, KeyDIDProvider } from '@veramo/did-provider-key'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { KeyManager, MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { KeyManagementSystem } from '@veramo/kms-local'
import { Resolver } from 'did-resolver'
import { CredentialHandlerLDLocal } from '../agent/CredentialHandlerLDLocal'
import { LdDefaultContexts } from '../ld-default-contexts'
import { SphereonEd25519Signature2018 } from '../suites/Ed25519Signature2018'
import { SphereonEd25519Signature2020 } from '../suites/Ed25519Signature2020'
import { ICredentialHandlerLDLocal, MethodNames } from '../types/ICredentialHandlerLDLocal'
import { ContextDoc } from '../types/types'

import { bedrijfsInformatieV1, exampleV1 } from './mocks'

jest.setTimeout(100000)

const customContext = new Map<string, ContextDoc>([
  [`https://www.w3.org/2018/credentials/examples/v1`, exampleV1],
  ['https://sphereon-opensource.github.io/vc-contexts/myc/bedrijfsinformatie-v1.jsonld', bedrijfsInformatieV1],
])

describe('credential-LD full flow', () => {
  let didKeyIdentifier: IIdentifier
  let agent: TAgent<IResolver & IKeyManager & IDIDManager & ICredentialPlugin & IIdentifierResolution & ICredentialIssuer & ICredentialHandlerLDLocal>

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
        new IdentifierResolution({}),
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
  })

  it('create a new status list', async () => {
    const statusList = await createNewStatusList(
      {
        statusPurpose: 'revocation',
        proofFormat: 'lds',
        id: 'http://localhost:9543/list1',
        issuer: didKeyIdentifier.did,
        length: 99999,
        correlationId: '1234',
        type: StatusListType.StatusList2021,
      },
      { agent },
    )
    expect(statusList).toBeDefined()
    expect(statusList.id).toEqual('http://localhost:9543/list1')
    expect(statusList.encodedList).toBeDefined()
    expect(statusList.issuer).toEqual(didKeyIdentifier.did)
    expect(statusList.length).toEqual(99999)
    expect(statusList.indexingDirection).toEqual('rightToLeft')
    expect(statusList.proofFormat).toEqual('lds')
    expect(statusList.statusListCredential).toBeDefined()
  })
})
