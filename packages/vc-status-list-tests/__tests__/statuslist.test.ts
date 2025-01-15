import { IdentifierResolution, IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { createAgent, ICredentialPlugin, IDIDManager, IIdentifier, IKeyManager, IResolver, TAgent } from '@veramo/core'
import { CredentialPlugin, ICredentialIssuer } from '@veramo/credential-w3c'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { getDidKeyResolver, SphereonKeyDidProvider } from '@sphereon/ssi-sdk-ext.did-provider-key'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { SphereonKeyManager } from '@sphereon/ssi-sdk-ext.key-manager'
import { SphereonKeyManagementSystem } from '@sphereon/ssi-sdk-ext.kms-local'
import { MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { Resolver } from 'did-resolver'
import {
  checkStatusIndexFromStatusListCredential,
  createNewStatusList,
  updateStatusIndexFromStatusListCredential,
} from '@sphereon/ssi-sdk.vc-status-list'
import {
  CredentialHandlerLDLocal,
  ICredentialHandlerLDLocal,
  LdDefaultContexts,
  MethodNames,
  SphereonEcdsaSecp256k1RecoverySignature2020,
  SphereonEd25519Signature2018,
  SphereonEd25519Signature2020,
} from '@sphereon/ssi-sdk.vc-handler-ld-local'
// @ts-ignore
import nock from 'nock'
import { StatusListType } from '@sphereon/ssi-types'
import { JwtService } from '@sphereon/ssi-sdk-ext.jwt-service'

jest.setTimeout(100000)

describe('Status list', () => {
  let didKeyIdentifier: IIdentifier
  let agent: TAgent<IResolver & IKeyManager & IDIDManager & ICredentialPlugin & IIdentifierResolution & ICredentialIssuer & ICredentialHandlerLDLocal>

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
        new IdentifierResolution({ crypto: global.crypto }),
        new JwtService(),
        new DIDResolverPlugin({
          resolver: new Resolver({
            ...getDidKeyResolver(),
          }),
        }),
        new CredentialPlugin(),
        new CredentialHandlerLDLocal({
          contextMaps: [LdDefaultContexts],
          suites: [new SphereonEd25519Signature2018(), new SphereonEd25519Signature2020(), new SphereonEcdsaSecp256k1RecoverySignature2020()],
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

  describe('StatusList2021', () => {
    it('should create and update using LD-Signatures', async () => {
      const statusList = await createNewStatusList(
        {
          type: StatusListType.StatusList2021,
          proofFormat: 'lds',
          id: 'http://localhost:9543/list1',
          issuer: didKeyIdentifier.did,
          length: 99999,
          correlationId: 'test-1-' + Date.now(),
          statusList2021: {
            indexingDirection: 'rightToLeft',
          },
        },
        { agent },
      )
      expect(statusList.type).toBe(StatusListType.StatusList2021)
      expect(statusList.proofFormat).toBe('lds')
      expect(statusList.statusList2021?.indexingDirection).toBe('rightToLeft')

      const updated = await updateStatusIndexFromStatusListCredential(
        { statusListCredential: statusList.statusListCredential, statusListIndex: 2, value: true },
        { agent },
      )
      const status = await checkStatusIndexFromStatusListCredential({
        statusListCredential: updated.statusListCredential,
        statusListIndex: '2',
      })
      expect(status).toBe(1)
    })

    it('should create and update using JWT format', async () => {
      const statusList = await createNewStatusList(
        {
          type: StatusListType.StatusList2021,
          proofFormat: 'jwt',
          id: 'http://localhost:9543/list2',
          issuer: didKeyIdentifier.did,
          length: 99999,
          correlationId: 'test-2-' + Date.now(),
          statusList2021: {
            indexingDirection: 'rightToLeft',
          },
        },
        { agent },
      )

      const updated = await updateStatusIndexFromStatusListCredential(
        { statusListCredential: statusList.statusListCredential, statusListIndex: 3, value: true },
        { agent },
      )
      const status = await checkStatusIndexFromStatusListCredential({
        statusListCredential: updated.statusListCredential,
        statusListIndex: '3',
      })
      expect(status).toBe(1)
    })
  })

  describe('OAuthStatusList', () => {
    it('should create and update using JWT format', async () => {
      const statusList = await createNewStatusList(
        {
          type: StatusListType.OAuthStatusList,
          proofFormat: 'jwt',
          id: 'http://localhost:9543/oauth1',
          issuer: didKeyIdentifier.did,
          length: 99999,
          correlationId: 'test-3-' + Date.now(),
          oauthStatusList: {
            bitsPerStatus: 2,
          },
        },
        { agent },
      )

      const updated = await updateStatusIndexFromStatusListCredential(
        { statusListCredential: statusList.statusListCredential, statusListIndex: 4, value: true },
        { agent },
      )
      const status = await checkStatusIndexFromStatusListCredential({
        statusListCredential: updated.statusListCredential,
        statusListIndex: '4',
      })
      expect(status).toBe(1)
    })

    it('should reject LD-Signatures format', async () => {
      await expect(
        createNewStatusList(
          {
            type: StatusListType.OAuthStatusList,
            proofFormat: 'lds',
            id: 'http://localhost:9543/oauth2',
            issuer: didKeyIdentifier.did,
            length: 99999,
            oauthStatusList: {
              bitsPerStatus: 2,
            },
          },
          { agent },
        ),
      ).rejects.toThrow("Invalid proof format 'lds' for OAuthStatusList")
    })
  })
})
