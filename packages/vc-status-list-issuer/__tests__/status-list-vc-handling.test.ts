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

describe('Status List VC handling', () => {
  let agent: TAgent<Plugins>

  const baseCredential: IVerifiableCredential = {
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
      const mockResult: StatusListResult = {
        type: StatusListType.OAuthStatusList,
        proofFormat: 'jwt',
        statusListCredential: 'ey_eyMockJWT',
        statuslistContentType: 'application/statuslist+jwt',
        encodedList: 'AAAA',
        id: 'list123',
        issuer: 'did:example:123',
        length: 250000,
        oauthStatusList: {
          bitsPerStatus: 2,
        },
      }
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
        ...baseCredential,
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
        statusListOpts: [
          {
            statusListId: 'list123',
            statusListIndex: 0,
          },
        ],
      })

      const credentialStatus = Array.isArray(result.credentialStatus) ? result.credentialStatus[0] : result.credentialStatus
      expect(credentialStatus?.type).toBe('OAuth2StatusList')
      expect(credentialStatus?.id).toBe('list123#0')
      expect(credentialStatus?.statusListIndex).toBe('0')
      expect(credentialStatus?.statusListCredential).toBe('eyMockJWT')
      expect(result.issuer).toBe('did:example:123')
    })

    it('should add status when credential has no credentialStatus', async () => {
      const mockCredential = {
        ...baseCredential,
      }

      const mockResultCredential = {
        ...mockCredential,
        credentialStatus: {
          id: 'list123#0',
          type: 'StatusList2021Entry',
          statusPurpose: 'revocation',
          statusListIndex: '0',
          statusListCredential: 'list123',
        },
      }

      jest.spyOn(agent, 'slAddStatusToCredential').mockResolvedValue(mockResultCredential)

      const result = await agent.slAddStatusToCredential({
        credential: mockCredential,
        statusListOpts: [
          {
            statusListId: 'list123',
          },
        ],
      })

      expect(result.credentialStatus).toBeDefined()
    })

    /*  it('should handle array of credential statuses', async () => { TODO this is only true for VC v2.0  CREATE TICKET BEFORE PR
      const mockCredential: IVerifiableCredential = {
        ...baseCredential,
        credentialStatus: [
          {
            id: 'list123#0',
            type: 'StatusList2021Entry',
            statusPurpose: 'revocation',
            statusListIndex: '0',
            statusListCredential: 'list123',
          },
        ],
      }

      const mockResultCredential: IVerifiableCredential = {
        ...mockCredential,
        credentialStatus: [
          // Need to check if array and has elements
          Array.isArray(mockCredential.credentialStatus) && mockCredential.credentialStatus.length > 0
            ? mockCredential.credentialStatus[0]
            : {
                id: 'list123#0',
                type: 'StatusList2021Entry',
                statusPurpose: 'revocation',
                statusListIndex: '0',
                statusListCredential: 'list123',
              },
          {
            id: 'list456#5',
            type: 'StatusList2021Entry',
            statusPurpose: 'revocation',
            statusListIndex: '5',
            statusListCredential: 'list456',
          },
        ],
      }

      jest.spyOn(agent, 'slAddStatusToCredential').mockResolvedValue(mockResultCredential)

      const result = await agent.slAddStatusToCredential({
        credential: mockCredential,
        statusListOpts: [
          {
            statusListId: 'list456',
            statusListIndex: 5,
          },
        ],
      })

      expect(Array.isArray(result.credentialStatus)).toBe(true)
      expect((result.credentialStatus as ICredentialStatus[]).length).toBe(2)
      expect((result.credentialStatus as ICredentialStatus[])[1].statusListCredential).toBe('list456')
    })
*/
    it('should use correlation IDs when provided', async () => {
      const mockCredential: IVerifiableCredential = {
        ...baseCredential,
      }

      const mockResultCredential: IVerifiableCredential = {
        ...mockCredential,
        credentialStatus: {
          id: 'list123#0',
          type: 'StatusList2021Entry',
          statusListIndex: '0',
          statusListCredential: 'list123',
        },
      }

      jest.spyOn(agent, 'slAddStatusToCredential').mockResolvedValue(mockResultCredential)

      const result = await agent.slAddStatusToCredential({
        credential: mockCredential,
        statusListOpts: [
          {
            statusListCorrelationId: 'corr-123',
            statusEntryCorrelationId: 'entry-456',
          },
        ],
      })

      expect(result.credentialStatus).toBeDefined()
    })

    /* 
    it('should handle multiple status list options', async () => { TODO this is only true for VC v2.0  CREATE TICKET BEFORE PR
      const mockCredential: IVerifiableCredential = {
        ...baseCredential,
      }

      const mockResultCredential: IVerifiableCredential = {
        ...mockCredential,
        credentialStatus: [
          {
            id: 'list1#0',
            type: 'StatusList2021Entry',
            statusListIndex: '0',
            statusListCredential: 'list1',
          },
          {
            id: 'list2#5',
            type: 'StatusList2021Entry',
            statusListIndex: '5',
            statusListCredential: 'list2',
          },
        ],
      }

      jest.spyOn(agent, 'slAddStatusToCredential').mockResolvedValue(mockResultCredential)

      const result = await agent.slAddStatusToCredential({
        credential: mockCredential,
        statusListOpts: [{ statusListId: 'list1' }, { statusListId: 'list2', statusListIndex: 5 }],
      })

      expect(Array.isArray(result.credentialStatus)).toBe(true)
      const credStatus = result.credentialStatus as ICredentialStatus[]
      expect(credStatus.length).toBe(2)
    }) 
*/

    it('should handle credential with no options but existing status', async () => {
      const mockCredential: IVerifiableCredential = {
        ...baseCredential,
        credentialStatus: {
          id: 'list123#5',
          type: 'StatusList2021Entry',
          statusListIndex: '5',
          statusListCredential: 'list123',
        },
      }

      const mockResultCredential: IVerifiableCredential = {
        ...mockCredential,
        credentialStatus: {
          id: 'list123#10',
          type: 'StatusList2021Entry',
          statusListIndex: '10',
          statusListCredential: 'list123',
        },
      }

      jest.spyOn(agent, 'slAddStatusToCredential').mockResolvedValue(mockResultCredential)
      const result = await agent.slAddStatusToCredential({ credential: mockCredential })

      const credStatus = Array.isArray(result.credentialStatus) ? result.credentialStatus[0] : result.credentialStatus
      expect(credStatus?.statusListIndex).toBe('10')
    })
  })

  describe('slAddStatusToSdJwtCredential', () => {
    it('should add status to SD-JWT credential without existing status', async () => {
      const mockCredential = {
        iss: 'did:example:123',
        vct: 'VerifiableCredential',
        sub: 'did:example:456',
      }

      const mockResultCredential = {
        ...mockCredential,
        status: {
          status_list: {
            uri: 'list123',
            idx: 0,
          },
        },
      }

      jest.spyOn(agent, 'slAddStatusToSdJwtCredential').mockResolvedValue(mockResultCredential)

      const result = await agent.slAddStatusToSdJwtCredential({
        credential: mockCredential,
        statusListOpts: [{ statusListId: 'list123' }],
      })

      expect(result.status?.status_list.uri).toBe('list123')
      expect(result.status?.status_list.idx).toBe(0)
    })

    it('should update existing status in SD-JWT credential', async () => {
      const mockCredential = {
        iss: 'did:example:123',
        vct: 'VerifiableCredential',
        status: {
          status_list: {
            uri: 'list123',
            idx: 5,
          },
        },
      }

      const mockResultCredential = {
        ...mockCredential,
        status: {
          status_list: {
            uri: 'list123',
            idx: 10,
          },
        },
      }

      jest.spyOn(agent, 'slAddStatusToSdJwtCredential').mockResolvedValue(mockResultCredential)

      const result = await agent.slAddStatusToSdJwtCredential({
        credential: mockCredential,
        statusListOpts: [
          {
            statusListId: 'list123',
            statusListIndex: 10,
          },
        ],
      })

      expect(result.status?.status_list.idx).toBe(10)
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

      const result = await agent.slGetStatusList({ id: 'list123' })

      expect(result.id).toBe('list123')
      expect(result.type).toBe(StatusListType.OAuthStatusList)
      expect(result.encodedList).toBe('AAAA')
      expect(result.statusListCredential).toBe('ey_mockJWT')
      expect(result.length).toBe(250000)
    })

    it('should throw when status list not found', async () => {
      jest.spyOn(agent, 'slGetStatusList').mockRejectedValue(new Error('Status list not found'))
      await expect(agent.slGetStatusList({ id: 'nonexistent' })).rejects.toThrow('Status list not found')
    })
  })
})
