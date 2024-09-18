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
  SphereonJsonWebSignature2020
} from '@sphereon/ssi-sdk.vc-handler-ld-local'
import { IStatusListPlugin } from '@sphereon/ssi-sdk.vc-status-list'
import { StatusListDriverType, StatusListType } from '@sphereon/ssi-types'
import {
  createAgent,
  CredentialPayload,
  ICredentialPlugin,
  IDataStoreORM,
  IDIDManager,
  IIdentifier,
  IKeyManager,
  IResolver,
  TAgent
} from '@veramo/core'
import { CredentialPlugin } from '@veramo/credential-w3c'
import { DataStore, DataStoreORM, DIDStore, KeyStore, PrivateKeyStore } from '@veramo/data-store'
import { DIDManager } from '@veramo/did-manager'
import { getDidKeyResolver, KeyDIDProvider } from '@veramo/did-provider-key'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { KeyManager } from '@veramo/key-manager'
import { KeyManagementSystem, SecretBox } from '@veramo/kms-local'
import Debug from 'debug'
import { Resolver } from 'did-resolver'
import { v4 } from 'uuid'
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


type Plugins = IDIDManager & IKeyManager & IDataStoreORM & IResolver & ICredentialHandlerLDLocal & ICredentialPlugin & IIdentifierResolution & IStatusListPlugin

describe('JWT Verifiable Credential, should be', () => {
  let agent: TAgent<Plugins>
  // let agentContext: IAgentContext<Plugins>

  let identifier: IIdentifier
  beforeAll(async () => {
    agent = createAgent<Plugins>({
      plugins: [
        new DataStore(dbConnection),
        new DataStoreORM(dbConnection),
        new StatusListPlugin({instances: [{id: 'http://localhost/test/1', driverType: StatusListDriverType.AGENT_TYPEORM, dataSource: dbConnection}], defaultInstanceId: 'http://localhost/test/1', allDataSources: DataSources.singleInstance()}),
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
        new IdentifierResolution({crypto: global.crypto}),
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
  })

  it('should add status list to credential', async () => {
    // Just for this test we are creating the status list. Normally this has been pre-created of course
    const sl = await agent.slCreateStatusList({id: 'http://localhost/test/1', issuer: identifier.did, type: StatusListType.StatusList2021, proofFormat: 'jwt', statusPurpose: 'revocation', keyRef: identifier.keys[0].kid, correlationId: '1'})
    console.log(JSON.stringify(sl, null, 2))

    // @ts-ignore // We do not provide the credentialStatus id as the plugin should handle that
    const vcPayload = {
      issuer: identifier.did,
      id: v4(),
      credentialSubject: {
        id: identifier.did,
        example: 'value'
      },

      // Let's create a credentialStatus object, so that the status list handling code will assign an index automatically
      credentialStatus: {
        type: 'StatusList2021'
      }
    } as CredentialPayload
    const vc = await agent.createVerifiableCredentialLDLocal({credential: vcPayload, keyRef: identifier.keys[0].kid})
    expect(vc).toBeDefined()
    expect(vc.credentialStatus).toBeDefined()
    expect(vc.credentialStatus?.statusListIndex).toBeDefined()

    console.log(JSON.stringify(vc, null, 2))
  })
})
