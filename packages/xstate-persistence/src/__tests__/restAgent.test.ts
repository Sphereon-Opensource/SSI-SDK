import 'cross-fetch/polyfill'
import { createAgent, IAgent, IAgentOptions } from '@veramo/core'
import { AgentRestClient } from '@veramo/remote-client'
import { AgentRouter, RequestWithAgentRouter } from '@veramo/remote-server'
// @ts-ignore
import express, { Router } from 'express'
import { Server } from 'http'
import { DataSource } from 'typeorm'
import { createObjects, getConfig } from '@sphereon/ssi-sdk.agent-config'
import { IMachineStatePersistence, MachineStatePersistence, MachineStatePersistEventType } from '../index'
import xStatePersistenceAgentLogic from './shared/MachineStatePersistenceAgentLogic'

const port = 6403
const basePath = '/agent'

let serverAgent: IAgent
let restServer: Server
let dbConnection: Promise<DataSource>

const getAgent = (options?: IAgentOptions) =>
  createAgent<IMachineStatePersistence>({
    ...options,
    plugins: [
      new MachineStatePersistence({
        eventTypes: [MachineStatePersistEventType.EVERY],
        isRESTClient: true,
      }),
      new AgentRestClient({
        url: 'http://localhost:' + port + basePath,
        enabledMethods: serverAgent.availableMethods(),
        schema: serverAgent.getSchema(),
      }),
    ],
  })

const setup = async (): Promise<boolean> => {
  const config = await getConfig('packages/xstate-persistence/agent.yml')
  const { agent, db } = await createObjects(config, { agent: '/agent', db: '/dbConnection' })
  serverAgent = agent
  dbConnection = db

  const agentRouter: Router = AgentRouter({
    exposedMethods: serverAgent.availableMethods(),
  })

  const requestWithAgent: Router = RequestWithAgentRouter({
    agent: serverAgent,
  })

  return new Promise((resolve): void => {
    const app = express()
    app.use(basePath, requestWithAgent, agentRouter)
    restServer = app.listen(port, () => {
      resolve(true)
    })
  })
}

const tearDown = async (): Promise<boolean> => {
  restServer?.close()
  await (await dbConnection).destroy()
  return true
}

const testContext = {
  getAgent,
  setup,
  tearDown,
}

describe('REST integration tests', (): void => {
  xStatePersistenceAgentLogic(testContext)
})
