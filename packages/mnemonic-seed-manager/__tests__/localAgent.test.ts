import * as fs from 'fs'

import { DataSource } from 'typeorm'

import mnemonicGenerator from './shared/generateMnemonic'
import seedGenerator from './shared/generateSeed'
import storeSeed from './shared/storeMnemonicInfo'
import { createAgent, IDataStore, IKeyManager } from '@veramo/core'
import { KeyManager } from '@veramo/key-manager'
import { IMnemonicSeedManager, MnemonicSeedManager, MnemonicSeedManagerEntities, MnemonicSeedManagerMigrations } from '../src'
import { Entities, KeyStore, migrations, PrivateKeyStore } from '@veramo/data-store'
import { KeyManagementSystem, SecretBox } from '@veramo/kms-local'
import { OrPromise } from '@veramo/utils'

jest.setTimeout(30000)

const KMS_SECRET_KEY = 'd17c8674f5db9396f8eecccde25e882bb0336316bc411ae38dc1f3dcd7ed100f'
let databaseFile = 'database.sqlite'
let dbConnection: OrPromise<DataSource>
let agent: any

const setup = async (): Promise<boolean> => {
  const db: OrPromise<DataSource> = new DataSource({
    type: 'sqlite',
    database: databaseFile,
    synchronize: false,
    logging: false,
    entities: [...MnemonicSeedManagerEntities, ...Entities],
    migrations: [...MnemonicSeedManagerMigrations, ...migrations],
    migrationsRun: true,
  }).initialize()
  const secretBox = new SecretBox(KMS_SECRET_KEY)

  const localAgent = createAgent<IKeyManager & IDataStore & IMnemonicSeedManager>({
    plugins: [
      new KeyManager({
        store: new KeyStore(db),
        kms: {
          local: new KeyManagementSystem(new PrivateKeyStore(db, secretBox)),
        },
      }),
      new MnemonicSeedManager(db, secretBox),
    ],
  })
  agent = localAgent
  dbConnection = db
  return true
}

const tearDown = async (): Promise<boolean> => {
  await (await dbConnection).destroy()
  fs.unlinkSync(databaseFile)
  return true
}

const getAgent = () => agent

const testContext = { getAgent, setup, tearDown }

describe('Local integration tests', () => {
  mnemonicGenerator(testContext)
  seedGenerator(testContext)
  storeSeed(testContext)
})
