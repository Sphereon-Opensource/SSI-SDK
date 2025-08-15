import { JwkDIDProvider } from '@sphereon/ssi-sdk-ext.did-provider-jwk'
import { getDidJwkResolver } from '@sphereon/ssi-sdk-ext.did-resolver-jwk'
import { SphereonKeyManager } from '@sphereon/ssi-sdk-ext.key-manager'
import { SphereonKeyManagementSystem } from '@sphereon/ssi-sdk-ext.kms-local'
import { createAgent, IDIDManager, IKeyManager, TAgent } from '@veramo/core'
import { Entities, KeyStore, migrations, PrivateKeyStore } from '@veramo/data-store'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { SecretBox } from '@veramo/kms-local'
import { OrPromise } from '@veramo/utils'
import { Resolver } from 'did-resolver'
import { DataSource } from 'typeorm'

import { describe } from 'vitest'
import { IdentifierResolution, IIdentifierResolution } from '../src'
import identifierResolution from './shared/identifierResolution'

const KMS_SECRET_KEY = 'd17c8674f5db9396f8eecccde25e882bb0336316bc411ae38dc1f3dcd7ed100f'
let databaseFile = ':memory:'
let dbConnection: OrPromise<DataSource>
let agent: TAgent<IKeyManager & IDIDManager & IIdentifierResolution>

const DID_METHOD = 'did:jwk'

const jwkDIDProvider = new JwkDIDProvider({
  defaultKms: 'mem',
})

const setup = async (): Promise<boolean> => {
  const db: OrPromise<DataSource> = new DataSource({
    type: 'sqlite',
    database: databaseFile,
    synchronize: false,
    logging: ['info', 'warn'],
    entities: [...Entities],
    migrations: [...migrations],
    migrationsRun: true,
  }).initialize()
  const secretBox = new SecretBox(KMS_SECRET_KEY)

  const localAgent = createAgent<IKeyManager & IDIDManager & IIdentifierResolution>({
    plugins: [
      new SphereonKeyManager({
        store: new KeyStore(db),
        kms: {
          local: new SphereonKeyManagementSystem(new PrivateKeyStore(db, secretBox)),
        },
      }),
      new DIDResolverPlugin({
        resolver: new Resolver({ ...getDidJwkResolver() }),
      }),
      new DIDManager({
        providers: {
          [DID_METHOD]: jwkDIDProvider,
        },
        defaultProvider: DID_METHOD,
        store: new MemoryDIDStore(),
      }),
      new IdentifierResolution(),
    ],
  })
  agent = localAgent
  dbConnection = db
  return true
}

const tearDown = async (): Promise<boolean> => {
  await (await dbConnection).destroy()
  return true
}

const getAgent = () => agent

const testContext = { getAgent, setup, tearDown }

describe('Local integration tests', () => {
  identifierResolution(testContext)
})
