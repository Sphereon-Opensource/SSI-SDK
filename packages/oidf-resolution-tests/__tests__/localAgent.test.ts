import { IJwtService, JwtService } from '@sphereon/ssi-sdk-ext.jwt-service'
import { SphereonKeyManager } from '@sphereon/ssi-sdk-ext.key-manager'
import { SphereonKeyManagementSystem } from '@sphereon/ssi-sdk-ext.kms-local'
import { OIDFClient } from '@sphereon/ssi-sdk.oidf-client'
import { ResourceResolver } from '@sphereon/ssi-sdk.resource-resolver'
import { createAgent, IKeyManager, TAgent } from '@veramo/core'
import { Entities, KeyStore, migrations, PrivateKeyStore } from '@veramo/data-store'
import { SecretBox } from '@veramo/kms-local'
import { OrPromise } from '@veramo/utils'
import { DataSource } from 'typeorm'

import { describe } from 'vitest'
import { IdentifierResolution, IIdentifierResolution } from '../../identifier-resolution/src' // FIXME fix when new types have been absorbed throughout ssi-sdk
import oidfResolutionTests from './shared/oidfResolutionTest'

const KMS_SECRET_KEY = 'd17c8674f5db9396f8eecccde25e882bb0336316bc411ae38dc1f3dcd7ed100f'
let databaseFile = ':memory:'
let dbConnection: OrPromise<DataSource>
let agent: TAgent<IKeyManager & IIdentifierResolution & IJwtService>

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

  const localAgent = createAgent<IKeyManager & IIdentifierResolution & IJwtService>({
    plugins: [
      new SphereonKeyManager({
        store: new KeyStore(db),
        kms: {
          local: new SphereonKeyManagementSystem(new PrivateKeyStore(db, secretBox)),
        },
      }),
      new IdentifierResolution(),
      new JwtService(),
      new ResourceResolver(),
      new OIDFClient(),
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
  oidfResolutionTests(testContext)
})
