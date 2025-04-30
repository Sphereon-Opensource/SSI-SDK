import { JwkDIDProvider } from '@sphereon/ssi-sdk-ext.did-provider-jwk'
import { getDidJwkResolver } from '@sphereon/ssi-sdk-ext.did-resolver-jwk'
import { IdentifierResolution, IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { DataSources } from '@sphereon/ssi-sdk.agent-config'
import {
  CredentialProviderJsonld,
  LdDefaultContexts,
  SphereonEcdsaSecp256k1RecoverySignature2020,
  SphereonEd25519Signature2018,
  SphereonEd25519Signature2020,
} from '@sphereon/ssi-sdk.credential-jsonld'
import { IStatusListPlugin } from '@sphereon/ssi-sdk.vc-status-list'
import { IVerifiableCredential, StatusListDriverType, StatusListType } from '@sphereon/ssi-types'
import { createAgent, IDataStoreORM, IDIDManager, IIdentifier, IKeyManager, IResolver, TAgent } from '@veramo/core'
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
import { JwtService } from '@sphereon/ssi-sdk-ext.jwt-service'
import { beforeAll, describe, expect, it } from 'vitest'
import { IVcdmCredentialPlugin, VcdmCredentialPlugin } from '@sphereon/ssi-sdk.credential-vcdm'

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

type Plugins = IDIDManager & IKeyManager & IDataStoreORM & IResolver & IVcdmCredentialPlugin & IIdentifierResolution & IStatusListPlugin

describe('Status List VC handling', () => {
  let agent: TAgent<Plugins>
  let identifier: IIdentifier

  const baseCredential: IVerifiableCredential = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    issuer: 'temp',
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

  const defaultStatuslistImport = {
    id: 'http://localhost/test/default',
    correlationId: 'default-sl',
    driverType: StatusListDriverType.AGENT_TYPEORM,
    type: StatusListType.StatusList2021,
    issuer: 'temp',
  }

  beforeAll(async () => {
    const jsonld = new CredentialProviderJsonld({
      contextMaps: [LdDefaultContexts],
      suites: [new SphereonEd25519Signature2018(), new SphereonEd25519Signature2020(), new SphereonEcdsaSecp256k1RecoverySignature2020()],
      keyStore: privateKeyStore,
    })

    agent = createAgent<Plugins>({
      plugins: [
        new DataStore(dbConnection),
        new DataStoreORM(dbConnection),
        new StatusListPlugin({
          defaultStatusListId: 'http://localhost/test/default',
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
        new VcdmCredentialPlugin({ issuers: [jsonld] }),
        new JwtService(),
      ],
    })

    await agent.dataStoreORMGetIdentifiers().then((ids) => {
      ids.forEach((id) => console.log(JSON.stringify(id, null, 2)))
    })
    identifier = await agent
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
    baseCredential.issuer = identifier.did
    defaultStatuslistImport.issuer = identifier.did
    await agent.slImportStatusLists([defaultStatuslistImport])
  })

  describe('slCreateStatusList', () => {
    it('should reject non-JWT proof formats like LD-Signatures when creating OAuth status list', async () => {
      await expect(
        agent.slCreateStatusList({
          type: StatusListType.OAuthStatusList,
          issuer: identifier.did,
          id: 'http://localhost/test/fails',
          correlationId: 'test-fails',
          proofFormat: 'lds',
          oauthStatusList: {
            bitsPerStatus: 2,
          },
        }),
      ).rejects.toThrow("Invalid proof format 'lds' for OAuthStatusList")
    })

    it('should successfully create OAuth status list using JWT format with proper header and encoding', async () => {
      const result = await agent.slCreateStatusList({
        type: StatusListType.OAuthStatusList,
        issuer: identifier.did,
        id: 'http://localhost/test/jwt',
        correlationId: 'test-jwt',
        proofFormat: 'jwt',
        oauthStatusList: {
          bitsPerStatus: 2,
        },
      })

      expect(result.type).toBe(StatusListType.OAuthStatusList)
      expect(result.proofFormat).toBe('jwt')
      expect(result.statusListCredential).toMatch(/^ey/)
    })
  })

  describe('slAddStatusToCredential', () => {
    it('should inject a status to a credential using statusListId', async () => {
      const mockCredential: IVerifiableCredential = {
        ...baseCredential,
      }
      const result = await agent.slAddStatusToCredential({
        credential: mockCredential,
        statusLists: [
          {
            statusListId: 'http://localhost/test/jwt',
            statusListIndex: 123,
          },
        ],
      })

      const credentialStatus = Array.isArray(result.credentialStatus) ? result.credentialStatus[0] : result.credentialStatus
      expect(credentialStatus?.type).toBe('OAuthStatusListEntry')
      expect(credentialStatus?.id).toMatch(/^http:\/\/localhost\/test\/jwt#\d+$/)
      expect(credentialStatus?.statusListIndex).toBe('123')
      expect(credentialStatus?.statusListCredential).toBe('http://localhost/test/jwt') // TODO should we not return the status list payload? If not, the name is weird
      expect(result.issuer).toBe(identifier.did)
    })

    it('should inject a status to a credential using statuslistCorrelationId', async () => {
      const mockCredential: IVerifiableCredential = {
        ...baseCredential,
      }
      const result = await agent.slAddStatusToCredential({
        credential: mockCredential,
        statusLists: [
          {
            statusEntryCorrelationId: 'test-sl',
            statusListIndex: 456,
          },
        ],
      })
      expect(result).toBeTruthy()
      expect(result.credentialStatus).toBeTruthy()
    })

    it('should add status when credential has no credentialStatus', async () => {
      const mockCredential = {
        ...baseCredential,
      }
      const result = await agent.slAddStatusToCredential({
        credential: mockCredential,
        statusLists: [
          {
            statusListId: 'http://localhost/test/jwt',
          },
        ],
      })

      expect(result.credentialStatus).toBeDefined()
    })

    /*  it('should handle array of credential statuses', async () => { TODO this is only true for VCDM v2.0  SSISDK-2
              const mockCredential: IVerifiableCredential = {
                ...baseCredential,
                credentialStatus: [
                  {
                    id: 'http://localhost/test/1#0',
                    type: 'StatusList2021Entry',
                    statusPurpose: 'revocation',
                    statusListIndex: '0',
                    statusListCredential: 'http://localhost/test/1',
                  },
                ],
              }
        
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

      const result = await agent.slAddStatusToCredential({
        credential: mockCredential,
        statusLists: [
          {
            statusListCorrelationId: 'test-jwt',
            statusEntryCorrelationId: 'entry-456',
          },
        ],
      })

      expect(result.credentialStatus).toBeDefined()
    })

    /* 
            it('should handle multiple status list options', async () => { TODO this is only true for VCDM v2.0  SSISDK-2
              const mockCredential: IVerifiableCredential = {
                ...baseCredential,
              }
        
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
          id: 'http://localhost/test/jwt#5',
          type: 'StatusList2021Entry',
          statusListIndex: '5',
          statusListCredential: 'http://localhost/test/jwt',
        },
      }
      const result = await agent.slAddStatusToCredential({ credential: mockCredential })

      const credStatus = Array.isArray(result.credentialStatus) ? result.credentialStatus[0] : result.credentialStatus
      expect(credStatus?.statusListIndex).toBe('5')
    })
  })

  describe('slAddStatusToSdJwtCredential', () => {
    it('should add status to SD-JWT credential without existing status', async () => {
      const mockCredential = {
        iss: identifier.did,
        vct: 'VerifiableCredential',
        sub: 'did:example:456',
      }

      const result = await agent.slAddStatusToSdJwtCredential({
        credential: mockCredential,
        statusLists: [{ statusListId: 'http://localhost/test/jwt' }],
      })

      expect(result.status?.status_list.uri).toBe('http://localhost/test/jwt')
      expect(result.status?.status_list.idx).toBeGreaterThan(1)
    })

    it('should update existing status in SD-JWT credential', async () => {
      const mockCredential = {
        iss: identifier.did,
        vct: 'VerifiableCredential',
        status: {
          status_list: {
            uri: 'http://localhost/test/jwt',
            idx: 5,
          },
        },
      }

      const result = await agent.slAddStatusToSdJwtCredential({
        credential: mockCredential,
        statusLists: [
          {
            statusListId: 'http://localhost/test/jwt',
            statusListIndex: 10,
          },
        ],
      })

      expect(result.status?.status_list.idx).toBe(10)
    })
  })

  describe('slGetStatusList', () => {
    it('should retrieve an existing status list', async () => {
      const result = await agent.slGetStatusList({ id: 'http://localhost/test/jwt' })

      expect(result.id).toBe('http://localhost/test/jwt')
      expect(result.type).toBe(StatusListType.OAuthStatusList)
      expect(result.encodedList).toBe(
        'eNrtwTEBAAAAwqD1T20IX6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgM_QkAAE',
      )
      expect(result.statusListCredential).toMatch(/^ey/)
      expect(result.length).toBe(250000)
    })

    it('should throw when status list not found', async () => {
      await expect(agent.slGetStatusList({ id: 'nonexistent' })).rejects.toThrow('No status list found for id nonexistent')
    })
  })
})
