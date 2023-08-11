import express from 'express'
import { Server } from 'http'
import { IAgent, createAgent, IAgentOptions, IDataStore, IDataStoreORM } from '@veramo/core'
import { AgentRestClient } from '@veramo/remote-client'
import { AgentRouter, RequestWithAgentRouter } from '@veramo/remote-server'
import { getConfig, createObjects } from '@sphereon/ssi-sdk.agent-config'
import { IMsRequestApi } from '../src/types/IMsRequestApi.mjs'
import msRequestApiAgentLogic from './shared/msRequestApiAgentLogic.mjs'
import { describe } from 'vitest'

const port = 3002
const basePath = '/agent'

let serverAgent: IAgent
let restServer: Server

const getAgent = (options?: IAgentOptions) =>
  createAgent<IMsRequestApi & IDataStore & IDataStoreORM>({
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
  const config = await getConfig('packages/ms-request-api/agent.yml')
  const { agent } = await createObjects(config, { agent: '/agent' })
  serverAgent = agent

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

const tearDown = async (): Promise<void> => {
  restServer.close()
}

const testContext = {
  getAgent,
  setup,
  tearDown,
}

describe.skip('REST integration tests', () => {
  msRequestApiAgentLogic(testContext)
})
