import 'cross-fetch/polyfill'
import express from 'express'
import { Server } from 'http'
import { Connection, createConnection } from 'typeorm'
import { IAgent, createAgent, IAgentOptions } from '@veramo/core'
import { AgentRestClient } from '@veramo/remote-client'
import { AgentRouter, RequestWithAgentRouter } from '@veramo/remote-server'
import { IVcManager } from '../src/types/IVcManager'
import vcManagerAgentLogic from './shared/vcManagerAgentLogic'
import { Entities, DataStore, DataStoreORM } from '@veramo/data-store'
import { VcManager } from '../src'

jest.setTimeout(30000)

const port = 3002
const basePath = '/agent'

let serverAgent: IAgent
let restServer: Server
let dbConnection: Promise<Connection>

const getAgent = (options?: IAgentOptions) =>
  createAgent<IVcManager>({
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
  dbConnection = createConnection({
    type: 'sqlite',
    database: ':memory:',
    synchronize: true,
    logging: false,
    entities: Entities,
  })

  const serverAgent = createAgent<IVcManager>({
    plugins: [
      new VcManager(new DataStore(dbConnection), new DataStoreORM(dbConnection)),
    ],
  })

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
  await (await dbConnection).close()
  return true
}

const testContext = {
  getAgent,
  setup,
  tearDown
}

describe('REST integration tests', () => {
  vcManagerAgentLogic(testContext)
})
