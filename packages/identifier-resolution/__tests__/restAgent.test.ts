import { JwkDIDProvider } from '@sphereon/ssi-sdk-ext.did-provider-jwk'
import { getDidJwkResolver } from '@sphereon/ssi-sdk-ext.did-resolver-jwk'
import { SphereonKeyManager } from '@sphereon/ssi-sdk-ext.key-manager'
import { SphereonKeyManagementSystem } from '@sphereon/ssi-sdk-ext.kms-local'

import { createAgent, IAgent, IAgentOptions, IDIDManager, IKeyManager, TAgent } from '@veramo/core'
import { Entities, KeyStore, migrations, PrivateKeyStore } from '@veramo/data-store'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { SecretBox } from '@veramo/kms-local'
import { AgentRestClient } from '@veramo/remote-client'
import { AgentRouter, RequestWithAgentRouter } from '@veramo/remote-server'
import { OrPromise } from '@veramo/utils'
import { Resolver } from 'did-resolver'

// @ts-ignore
import express from 'express'
import { Server } from 'http'
import { DataSource } from 'typeorm'
import { describe } from 'vitest'

import { IdentifierResolution, IIdentifierResolution } from '../src'
import identifierResolution from './shared/identifierResolution'

const databaseFile = ':memory:'
const port = 14312
const basePath = '/agent'

const DID_METHOD = 'did:jwk'

const jwkDIDProvider = new JwkDIDProvider({
  defaultKms: 'mem',
})

let serverAgent: IAgent
let clientAgent: TAgent<IKeyManager & IDIDManager & IIdentifierResolution>
let restServer: Server
let dbConnection: OrPromise<DataSource>

const KMS_SECRET_KEY = 'd17c8674f5db9396f8eecccde25e882bb0336316bc411ae38dc1f3dcd7ed100f'

const getAgent = (options?: IAgentOptions) => {
  if (!serverAgent) {
    throw Error('Server agent not available yet (missed await?)')
  }
  if (!clientAgent) {
    clientAgent = createAgent<IIdentifierResolution & IKeyManager & IDIDManager>({
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
    entities: [...Entities],
    migrations: [...migrations],
    migrationsRun: true,
  }).initialize()

  const secretBox = new SecretBox(KMS_SECRET_KEY)

  const agent = createAgent<IKeyManager & IDIDManager & IIdentifierResolution>({
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
  identifierResolution(testContext)
})
