import 'cross-fetch/polyfill'
// @ts-ignore
import express, { Router } from 'express'
import { Server } from 'http'
import { createAgent, IAgent, IAgentOptions } from '@veramo/core'
import { AgentRestClient } from '@veramo/remote-client'
import { AgentRouter, RequestWithAgentRouter } from '@veramo/remote-server'
import oidfClientAgentLogic from './shared/oidfClientAgentLogic'
import { getConfig, createObjects } from '@sphereon/ssi-sdk.agent-config'
import { IOIDFClient } from '../src'
import { IJwtService } from '@sphereon/ssi-sdk-ext.jwt-service'

jest.setTimeout(60000)

const port = 4102
const basePath = '/agent'

let serverAgent: IAgent
let restServer: Server

const getAgent = (options?: IAgentOptions) =>
  createAgent<IOIDFClient & IJwtService>({
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
  const config = await getConfig('packages/oidf-client/agent.yml')
  const { agent } = await createObjects(config, { agent: '/agent' })
  serverAgent = agent

  const agentRouter = AgentRouter({
    exposedMethods: serverAgent.availableMethods(),
  })

  const requestWithAgent: Router = RequestWithAgentRouter({
    agent: serverAgent,
  })

  return new Promise((resolve): void => {
    const app = express()
    app.use(basePath, requestWithAgent, agentRouter)
    restServer = app.listen(port, (): void => {
      resolve(true)
    })
  })
}

const tearDown = async (): Promise<boolean> => {
  restServer.close()
  return true
}

const testContext = {
  getAgent,
  setup,
  tearDown,
}

describe.skip('REST integration tests', (): void => {
  oidfClientAgentLogic(testContext)
})
