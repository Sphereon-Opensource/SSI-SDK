import { JwkDIDProvider } from '@sphereon/ssi-sdk-ext.did-provider-jwk'
import { getDidJwkResolver } from '@sphereon/ssi-sdk-ext.did-resolver-jwk'
import { IdentifierResolution, IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { DataSources } from '@sphereon/ssi-sdk.agent-config'
import {
  CredentialHandlerLDLocal,
  ICredentialHandlerLDLocal,
  LdDefaultContexts,
  MethodNames,
  SphereonEcdsaSecp256k1RecoverySignature2020,
  SphereonEd25519Signature2018,
  SphereonEd25519Signature2020,
  SphereonJsonWebSignature2020,
} from '@sphereon/ssi-sdk.vc-handler-ld-local'
import { IStatusListPlugin, StatusListResult } from '@sphereon/ssi-sdk.vc-status-list'
import { IVerifiableCredential, StatusListDriverType, StatusListType } from '@sphereon/ssi-types'
import { createAgent, ICredentialPlugin, IDataStoreORM, IDIDManager, IKeyManager, IResolver, TAgent } from '@veramo/core'
import { CredentialPlugin } from '@veramo/credential-w3c'
import { DataStore, DataStoreORM, DIDStore, KeyStore, PrivateKeyStore } from '@veramo/data-store'
import { DIDManager } from '@veramo/did-manager'
import { getDidKeyResolver, KeyDIDProvider } from '@veramo/did-provider-key'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { KeyManager } from '@veramo/key-manager'
import { KeyManagementSystem, SecretBox } from '@veramo/kms-local'
import Debug from 'debug'
import { Resolver } from 'did-resolver'
import { StatusListPlugin } from '../src/agent/StatusListPlugin'
import { DB_CONNECTION_NAME_POSTGRES, DB_ENCRYPTION_KEY, sqliteConfig } from './database'

const debug = Debug('sphereon:status-list-issuer')

export const DID_PREFIX = 'did'

export enum KeyManagementSystemEnum {
  LOCAL = 'local',
}

export enum SupportedDidMethodEnum {
  DID_KEY = 'key',
  DID_JWK = 'jwk',
}

const PRIVATE_KEY_HEX =
  'ea6aaeebe17557e0fe256bfce08e8224a412ea1e25a5ec8b5d69618a58bad89e89a4661e446b46401325a38d3b20582d1dd277eb448a3181012a671b7ae15837'
// const PUBLIC_KEY_HEX = '89a4661e446b46401325a38d3b20582d1dd277eb448a3181012a671b7ae15837'

export const resolver = new Resolver({
  ...getDidKeyResolver(),
  ...getDidJwkResolver(),
})

export const didProviders = {
  [`${DID_PREFIX}:${SupportedDidMethodEnum.DID_KEY}`]: new KeyDIDProvider({
    defaultKms: KeyManagementSystemEnum.LOCAL,
  }),
  [`${DID_PREFIX}:${SupportedDidMethodEnum.DID_JWK}`]: new JwkDIDProvider({
    defaultKms: KeyManagementSystemEnum.LOCAL,
  }),
}

const dbConnection = DataSources.singleInstance()
  .addConfig(DB_CONNECTION_NAME_POSTGRES, sqliteConfig)
  // .addConfig(DB_CONNECTION_NAME_SQLITE, sqliteConfig)
  .getDbConnection(DB_CONNECTION_NAME_POSTGRES)
const privateKeyStore: PrivateKeyStore = new PrivateKeyStore(dbConnection, new SecretBox(DB_ENCRYPTION_KEY))

type Plugins = IDIDManager &
  IKeyManager &
  IDataStoreORM &
  IResolver &
  ICredentialHandlerLDLocal &
  ICredentialPlugin &
  IIdentifierResolution &
  IStatusListPlugin

describe('JWT Verifiable Credential, should be', () => {
  let agent: TAgent<Plugins>
  // let agentContext: IAgentContext<Plugins>

  beforeAll(async () => {
    agent = createAgent<Plugins>({
      plugins: [
        new DataStore(dbConnection),
        new DataStoreORM(dbConnection),
        new StatusListPlugin({
          instances: [
            {
              id: 'http://localhost/test/1',
              driverType: StatusListDriverType.AGENT_TYPEORM,
              dataSource: dbConnection,
            },
          ],
          defaultInstanceId: 'http://localhost/test/1',
          allDataSources: DataSources.singleInstance(),
        }),
        new KeyManager({
          store: new KeyStore(dbConnection),
          kms: {
            local: new KeyManagementSystem(privateKeyStore),
          },
        }),
        new DIDManager({
          store: new DIDStore(dbConnection),
          defaultProvider: `${DID_PREFIX}:${SupportedDidMethodEnum.DID_JWK}`,
          providers: didProviders,
        }),
        new DIDResolverPlugin({
          resolver,
        }),
        new IdentifierResolution({ crypto: global.crypto }),
        new CredentialPlugin(),
        new CredentialHandlerLDLocal({
          contextMaps: [LdDefaultContexts],
          suites: [
            new SphereonEd25519Signature2018(),
            new SphereonEd25519Signature2020(),
            new SphereonJsonWebSignature2020(),
            new SphereonEcdsaSecp256k1RecoverySignature2020(),
          ],
          bindingOverrides: new Map([
            ['createVerifiableCredentialLD', MethodNames.createVerifiableCredentialLDLocal],
            ['createVerifiablePresentationLD', MethodNames.createVerifiablePresentationLDLocal],
          ]),
          keyStore: privateKeyStore,
        }),
      ],
    })
    // agentContext = {...agent.context, agent};

    await agent.dataStoreORMGetIdentifiers().then((ids) => ids.forEach((id) => console.log(JSON.stringify(id, null, 2))))
    await agent
      .didManagerCreate({
        provider: 'did:jwk',
        alias: 'test',
        options: {
          type: 'Ed25519',
          key: {
            privateKeyHex: PRIVATE_KEY_HEX,
          },
        },
      })
      .then((identifier) => {
        debug(`IDENTIFIER: ${identifier.did}`)
        return identifier
      })
  })

  describe('slCreateStatusList', () => {
    it('should reject non-JWT proof formats like LD-Signatures when creating OAuth status list', async () => {
      await expect(
        agent.slCreateStatusList({
          type: StatusListType.OAuthStatusList,
          issuer: 'did:example:123',
          id: 'list123',
          correlationId: 'test-1-' + Date.now(),
          proofFormat: 'lds',
          oauthStatusList: {
            bitsPerStatus: 2,
          },
        }),
      ).rejects.toThrow("Invalid proof format 'lds' for OAuthStatusList")
    })

    it('should successfully create OAuth status list using JWT format with proper header and encoding', async () => {
      const mockResult = {
        type: StatusListType.OAuthStatusList,
        proofFormat: 'jwt',
        statusListCredential: 'ey_eyMockJWT',
        encodedList: 'AAAA',
        id: 'list123',
        issuer: 'did:example:123',
        length: 250000,
        oauthStatusList: {
          bitsPerStatus: 2,
        },
      } satisfies StatusListResult
      jest.spyOn(agent, 'slCreateStatusList').mockResolvedValue(mockResult)

      const result = await agent.slCreateStatusList({
        type: StatusListType.OAuthStatusList,
        issuer: 'did:example:123',
        id: 'list123',
        proofFormat: 'jwt',
        oauthStatusList: {
          bitsPerStatus: 2,
        },
      })

      expect(result.type).toBe(StatusListType.OAuthStatusList)
      expect(result.proofFormat).toBe('jwt')
      expect(result.statusListCredential).toBe('ey_eyMockJWT')
    })
  })

  describe('slAddStatusToCredential', () => {
    it('should inject a status to a credential', async () => {
      const mockCredential: IVerifiableCredential = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        issuer: 'did:example:123',
        issuanceDate: '2024-01-15T00:00:00Z',
        credentialSubject: {
          id: 'did:example:456',
        },
        proof: {
          type: 'Ed25519Signature2018',
          created: '2024-01-15T00:00:00Z',
          proofPurpose: 'assertionMethod',
          verificationMethod: 'did:example:123#key-1',
        },
      }

      const mockResultCredential: IVerifiableCredential = {
        ...mockCredential,
        credentialStatus: {
          id: 'list123#0',
          type: 'OAuth2StatusList',
          statusListIndex: '0',
          statusListCredential: 'eyMockJWT',
        },
      }

      jest.spyOn(agent, 'slAddStatusToCredential').mockResolvedValue(mockResultCredential)

      const result = await agent.slAddStatusToCredential({
        credential: mockCredential,
        statusListId: 'list123',
        statusListIndex: 0,
      })

      expect(result.credentialStatus?.type).toBe('OAuth2StatusList')
      expect(result.credentialStatus?.id).toBe('list123#0')
      expect(result.credentialStatus?.statusListIndex).toBe('0')
      expect(result.credentialStatus?.statusListCredential).toBe('eyMockJWT')
      expect(result.issuer).toBe('did:example:123')
    })
  })

  describe('slGetStatusList', () => {
    it('should retrieve an existing status list', async () => {
      const mockResult: StatusListResult = {
        type: StatusListType.OAuthStatusList,
        proofFormat: 'jwt',
        statusListCredential: 'ey_mockJWT',
        encodedList: 'AAAA',
        id: 'list123',
        issuer: 'did:example:123',
        length: 250000,
        statuslistContentType: 'application/statuslist+jwt',
        oauthStatusList: {
          bitsPerStatus: 2,
        },
      }

      jest.spyOn(agent, 'slGetStatusList').mockResolvedValue(mockResult)

      const result = await agent.slGetStatusList({
        id: 'list123',
      })

      expect(result.id).toBe('list123')
      expect(result.type).toBe(StatusListType.OAuthStatusList)
      expect(result.encodedList).toBe('AAAA')
      expect(result.statusListCredential).toBe('ey_mockJWT')
      expect(result.length).toBe(250000)
    })

    it('should throw when status list not found', async () => {
      jest.spyOn(agent, 'slGetStatusList').mockRejectedValue(new Error('Status list not found'))

      await expect(
        agent.slGetStatusList({
          id: 'nonexistent',
        }),
      ).rejects.toThrow('Status list not found')
    })
  })
})
