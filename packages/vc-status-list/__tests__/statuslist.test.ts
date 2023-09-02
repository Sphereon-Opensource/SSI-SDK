
import {
  CredentialHandlerLDLocal,
  ICredentialHandlerLDLocal,
  LdDefaultContexts, MethodNames, SphereonEd25519Signature2018, SphereonEd25519Signature2020
} from "@sphereon/ssi-sdk.vc-handler-ld-local";
import {createAgent, ICredentialPlugin, IDIDManager, IIdentifier, IKeyManager, IResolver, TAgent} from '@veramo/core'
import {CredentialPlugin, ICredentialIssuer} from '@veramo/credential-w3c'
import {DIDManager, MemoryDIDStore} from '@veramo/did-manager'
import {getDidKeyResolver, SphereonKeyDidProvider} from '@sphereon/ssi-sdk-ext.did-provider-key'
import {DIDResolverPlugin} from '@veramo/did-resolver'
import {SphereonKeyManager} from '@sphereon/ssi-sdk-ext.key-manager'
import {SphereonKeyManagementSystem} from '@sphereon/ssi-sdk-ext.kms-local'
import {MemoryKeyStore, MemoryPrivateKeyStore} from "@veramo/key-manager";
import {Resolver} from 'did-resolver'
// @ts-ignore
import nock from 'nock'
import {createNewStatusList} from "../src";

jest.setTimeout(100000)

describe.skip('Status list', () => {
  let didKeyIdentifier: IIdentifier
  let agent: TAgent<IResolver & IKeyManager & IDIDManager & ICredentialPlugin & ICredentialIssuer & ICredentialHandlerLDLocal>

  // jest.setTimeout(1000000)
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
    didKeyIdentifier = await agent.didManagerCreate()
  })

  it('create a new status list', async () => {

    const statusList = await createNewStatusList({statusPurpose: 'revocation', proofFormat: 'lds', id: 'http://localhost:9543/list1', issuer: didKeyIdentifier.did, length: 99999}, {agent})
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
