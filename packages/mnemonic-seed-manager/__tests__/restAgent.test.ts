import { createAgent, IAgent, IAgentOptions, IDataStore, IKeyManager, TAgent } from '@veramo/core'
import { Entities, KeyStore, migrations, PrivateKeyStore } from '@veramo/data-store'
import { KeyManager } from '@veramo/key-manager'
import { KeyManagementSystem, SecretBox } from '@veramo/kms-local'
import { AgentRestClient } from '@veramo/remote-client'
import { AgentRouter, RequestWithAgentRouter } from '@veramo/remote-server'
import { OrPromise } from '@veramo/utils'

// @ts-ignore
import express from 'express'
import { Server } from 'http'
import { DataSource } from 'typeorm'

import { describe } from 'vitest'

import { IMnemonicSeedManager, MnemonicSeedManager, MnemonicSeedManagerEntities, MnemonicSeedManagerMigrations } from '../src'

import mnemonicGenerator from './shared/generateMnemonic'
import seedGenerator from './shared/generateSeed'
import storeSeed from './shared/storeMnemonicInfo'

const databaseFile = ':memory:'
const port = 13002
const basePath = '/agent'

let serverAgent: IAgent
let clientAgent: TAgent<IKeyManager & IDataStore & IMnemonicSeedManager>
let restServer: Server
let dbConnection: OrPromise<DataSource>

const KMS_SECRET_KEY = 'd17c8674f5db9396f8eecccde25e882bb0336316bc411ae38dc1f3dcd7ed100f'

const getAgent = (options?: IAgentOptions) => {
  if (!serverAgent) {
    throw Error('Server agent not available yet (missed await?)')
  }
  if (!clientAgent) {
    clientAgent = createAgent<IMnemonicSeedManager & IKeyManager & IDataStore>({
      ...options,
      plugins: [
        new AgentRestClient({
          url: 'http://localhost:' + port + basePath,
          enabledMethods: serverAgent.availableMethods(),
          schema: serverAgent.getSchema(),
        }),
      ],
    })
  }

  return clientAgent
}

const setup = async (): Promise<boolean> => {
  if (serverAgent) {
    return true
  }
  const db: OrPromise<DataSource> = new DataSource({
    type: 'sqlite',
    database: databaseFile,
    synchronize: false,
    logging: ['info', 'warn'],
    entities: [...MnemonicSeedManagerEntities, ...Entities],
    migrations: [...MnemonicSeedManagerMigrations, ...migrations],
    migrationsRun: true,
  }).initialize()

  const secretBox = new SecretBox(KMS_SECRET_KEY)

  const agent = createAgent<IKeyManager & IDataStore & IMnemonicSeedManager>({
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
  return true
}

const testContext = { getAgent, setup, tearDown }

describe('REST integration tests', () => {
  mnemonicGenerator(testContext)
  seedGenerator(testContext)
  storeSeed(testContext)
})
