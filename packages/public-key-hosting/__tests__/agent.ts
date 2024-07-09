import { ExpressBuilder } from '@sphereon/ssi-express-support'
import { JwkDIDProvider } from '@sphereon/ssi-sdk-ext.did-provider-jwk'
import { SphereonKeyManager } from '@sphereon/ssi-sdk-ext.key-manager'
import { SphereonKeyManagementSystem } from '@sphereon/ssi-sdk-ext.kms-local'
import { DataSources } from '@sphereon/ssi-sdk.agent-config'
import { createAgent, IDataStore, IDataStoreORM, IDIDManager, IKeyManager, IResolver } from '@veramo/core'
import { DataStore, DataStoreORM, DIDStore, KeyStore, PrivateKeyStore } from '@veramo/data-store'
import { DIDManager } from '@veramo/did-manager'

import { SecretBox } from '@veramo/kms-local'

import { logger, PublicKeyHosting } from '../src'
import { DB_CONNECTION_NAME_SQLITE, DB_ENCRYPTION_KEY, sqliteConfig } from './database'

export const PRIVATE_KEY_HEX = 'a5e81a8cd50cf5c31d5b87db3e153e2817f86de350a60edc2335f76d5c3b4e0d'
// export const PUBLIC_KEY_HEX = '02cfc48d497317d51e9e4cacc91a6f80ede8c07c596e0e588726ea2039a3ec0c34'

const dbConnection = DataSources.singleInstance()
  .addConfig(DB_CONNECTION_NAME_SQLITE, sqliteConfig)
  // .addConfig(DB_CONNECTION_NAME_SQLITE, sqliteConfig)
  .getDbConnection(DB_CONNECTION_NAME_SQLITE)
const privateKeyStore: PrivateKeyStore = new PrivateKeyStore(dbConnection, new SecretBox(DB_ENCRYPTION_KEY))

const agent = createAgent<IDIDManager & IKeyManager & IDataStoreORM & IResolver>({
  plugins: [
    new DataStore(dbConnection),
    new DataStoreORM(dbConnection),
    new SphereonKeyManager({
      store: new KeyStore(dbConnection),
      kms: {
        local: new SphereonKeyManagementSystem(privateKeyStore),
      },
    }),
    new DIDManager({
      store: new DIDStore(dbConnection),
      defaultProvider: `did:jwk`,
      providers: {
        'did:jwk': new JwkDIDProvider({
          defaultKms: 'local',
        }),
      },
    }),
  ],
})

// let keyRef = "did:ion:EiAeobpQwEVpR-Ib9toYwbISQZZGIBck6zIUm0ZDmm9v0g:eyJkZWx0YSI6eyJwYXRjaGVzIjpbeyJhY3Rpb24iOiJyZXBsYWNlIiwiZG9jdW1lbnQiOnsicHVibGljS2V5cyI6W3siaWQiOiJhdXRoLWtleSIsInB1YmxpY0tleUp3ayI6eyJjcnYiOiJzZWNwMjU2azEiLCJrdHkiOiJFQyIsIngiOiJmUUE3WUpNRk1qNXFET0RrS25qR1ZLNW0za1VSRFc1YnJ1TWhUa1NYSGQwIiwieSI6IlI3cVBNNEsxWHlqNkprM3M2a3I2aFNrQzlDa0ExSEFpMVFTejZqSU56dFkifSwicHVycG9zZXMiOlsiYXV0aGVudGljYXRpb24iLCJhc3NlcnRpb25NZXRob2QiXSwidHlwZSI6IkVjZHNhU2VjcDI1NmsxVmVyaWZpY2F0aW9uS2V5MjAxOSJ9XX19XSwidXBkYXRlQ29tbWl0bWVudCI6IkVpQnpwN1loTjltaFVjWnNGZHhuZi1sd2tSVS1oVmJCdFpXc1ZvSkhWNmprd0EifSwic3VmZml4RGF0YSI6eyJkZWx0YUhhc2giOiJFaUJvbWxvZ0JPOERROFdpVVFsa3diYmxuMXpsRFU2Q3Jvc01wNDRySjYzWHhBIiwicmVjb3ZlcnlDb21taXRtZW50IjoiRWlEQVFYU2k3SGNqSlZCWUFLZE8yenJNNEhmeWJtQkJDV3NsNlBRUEpfamtsQSJ9fQ"

// agent.didManagerImport({did: RP_DID, keys: })
agent.dataStoreORMGetIdentifiers().then((ids) => ids.forEach((id) => console.log(JSON.stringify(id, null, 2))))

agent
  .didManagerCreate({
    provider: 'did:jwk',
    alias: 'test',
    options: {
      type: 'Secp256r1',
      key: {
        privateKeyHex: PRIVATE_KEY_HEX,
      },
    },
  })
  .then((value) => {
    logger.log(`IDENTIFIER: ${value.did}`)
  })
  .catch((reason) => {
    logger.log(`error on creation:  ${reason}`)
  })
  .finally(() => {
    const builder = ExpressBuilder.fromServerOpts({
      port: 5005,
      envVarPrefix: 'PK_HOSTING_',
      hostname: '0.0.0.0',
    })
      .withMorganLogging({ format: 'dev' })
      .withPassportAuth(false)
    const expressSupport = builder.build()

    new PublicKeyHosting({
      opts: {
        endpointOpts: {
          globalAuth: {
            authentication: {
              enabled: false,
            },
          },
        },
        hostingOpts: {
          enableFeatures: ['did-jwks'],
        },
      },
      expressSupport,
      agent,
    })
    expressSupport.start()
  })

export default agent
