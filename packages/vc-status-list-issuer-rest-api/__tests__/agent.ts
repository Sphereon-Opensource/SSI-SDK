import { ExpressBuilder } from '@sphereon/ssi-express-support'
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

import { StatuslistManagementApiServer } from '../src'
import { IRequiredPlugins } from '@sphereon/ssi-sdk.vc-status-list-issuer-drivers'
import { DB_CONNECTION_NAME_POSTGRES, DB_ENCRYPTION_KEY, postgresConfig } from './database'

const debug = Debug('sphereon:status-list-api')

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
  .addConfig(DB_CONNECTION_NAME_POSTGRES, postgresConfig)
  // .addConfig(DB_CONNECTION_NAME_SQLITE, sqliteConfig)
  .getDbConnection(DB_CONNECTION_NAME_POSTGRES)
const privateKeyStore: PrivateKeyStore = new PrivateKeyStore(dbConnection, new SecretBox(DB_ENCRYPTION_KEY))

const agent: TAgent<IRequiredPlugins> = createAgent<
  IDIDManager & IKeyManager & IDataStoreORM & IResolver & ICredentialHandlerLDLocal & ICredentialPlugin & IIdentifierResolution
>({
  plugins: [
    new DataStore(dbConnection),
    new DataStoreORM(dbConnection),
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

agent.dataStoreORMGetIdentifiers().then((ids) => ids.forEach((id) => console.log(JSON.stringify(id, null, 2))))
agent
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
  .then((value) => {
    debug(`IDENTIFIER: ${value.did}`)
  })
  .catch((reason) => {
    console.log(`error on creation:  ${reason}`)
  })
  .finally(() => {
    const builder = ExpressBuilder.fromServerOpts({
      port: 5002,
      hostname: 'localhost',
    })
      .withMorganLogging({ format: 'dev' })
      .withPassportAuth(true)
      .withSessionOptions({ secret: '1234', name: 'oidc-session' })
    const expressSupport = builder.build()

    new StatuslistManagementApiServer({
      opts: {
        endpointOpts: {
          globalAuth: {
            authentication: {
              enabled: false,
              // strategy: bearerStrategy,
            },
          },
          vcApiCredentialStatus: {
            dbName: DB_CONNECTION_NAME_POSTGRES,
            disableGlobalAuth: true,
            correlationId: '123',
          },
          getStatusList: {
            dbName: DB_CONNECTION_NAME_POSTGRES,
          },
          createStatusList: {
            dbName: DB_CONNECTION_NAME_POSTGRES,
          },
        },
        enableFeatures: ['w3c-vc-api-credential-status', 'status-list-hosting', 'status-list-management'],
      },
      expressSupport,
      agent,
    })
    expressSupport.start()
  })

export default agent
