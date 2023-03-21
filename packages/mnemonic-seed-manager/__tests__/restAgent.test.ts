import 'cross-fetch/polyfill'
import * as fs from 'fs'
import { Server } from 'http'

import { createAgent, IAgent, IAgentOptions, IDataStore, IDataStoreORM, IKeyManager } from '@veramo/core'
import { AgentRestClient } from '@veramo/remote-client'
import { AgentRouter, RequestWithAgentRouter } from '@veramo/remote-server'

// @ts-ignore
import express from 'express'
import { DataSource } from 'typeorm'

import { IMnemonicSeedManager, MnemonicSeedManager, MnemonicSeedManagerEntities, MnemonicSeedManagerMigrations } from '../src'

import mnemonicGenerator from './shared/generateMnemonic'
import seedGenerator from './shared/generateSeed'
import storeSeed from './shared/storeMnemonicInfo'
import { KeyManager } from '@veramo/key-manager'
import { DataStore, DataStoreORM, Entities, KeyStore, migrations, PrivateKeyStore } from '@veramo/data-store'
import { KeyManagementSystem, SecretBox } from '@veramo/kms-local'

jest.setTimeout(30000)

const databaseFile = 'rest-database.sqlite'
const port = 3002
const basePath = '/agent'

let serverAgent: IAgent
let restServer: Server
let dbConnection: Promise<DataSource>

const KMS_SECRET_KEY = 'd17c8674f5db9396f8eecccde25e882bb0336316bc411ae38dc1f3dcd7ed100f'

const getAgent = (options?: IAgentOptions) =>
  createAgent<IMnemonicSeedManager & IKeyManager & IDataStore>({
    ...options,
    plugins: [
      new AgentRestClient({
        url: 'http://localhost:' + port + basePath,
        enabledMethods: serverAgent.availableMethods(),
        schema: serverAgent.getSchema(),
      }),
    ],
  })

const setup = async (): Promise<boolean> => {
  const db = new DataSource({
    type: 'sqlite',
    database: databaseFile,
    synchronize: false,
    logging: false,
    entities: [...MnemonicSeedManagerEntities, ...Entities],
    migrations: [...MnemonicSeedManagerMigrations, ...migrations],
    migrationsRun: true,
  }).initialize()

  const secretBox = new SecretBox(KMS_SECRET_KEY)

  const agent = createAgent<IKeyManager & IDataStore & IDataStoreORM & IMnemonicSeedManager>({
    plugins: [
      new KeyManager({
        store: new KeyStore(db),
        kms: {
          local: new KeyManagementSystem(new PrivateKeyStore(db, secretBox)),
        },
      }),
      new MnemonicSeedManager(db, secretBox),
      new DataStore(db),
      new DataStoreORM(db),
    ],
  })

  serverAgent = agent
  dbConnection = db

  const agentRouter = AgentRouter({
    exposedMethods: serverAgent.availableMethods(),
  })

  const requestWithAgent = RequestWithAgentRouter({
    agent: serverAgent,
  })

  return new Promise((resolve) => {
    const app = express()
    app.use(basePath, requestWithAgent, agentRouter)
    restServer = app.listen(port, () => {
      resolve(true)
    })
  })
}

const tearDown = async (): Promise<boolean> => {
  restServer.close()
  await (await dbConnection).dropDatabase()
  await (await dbConnection).destroy()
  fs.unlinkSync(databaseFile)
  await new Promise((resolve) => setTimeout((v: void) => resolve(v), 500))
  return true
}

const testContext = { getAgent, setup, tearDown }

describe('REST integration tests', () => {
  mnemonicGenerator(testContext)
  seedGenerator(testContext)
  storeSeed(testContext)
})
