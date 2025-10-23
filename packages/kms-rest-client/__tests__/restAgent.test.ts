import 'cross-fetch/polyfill'
// @ts-ignore
import express, { Router } from 'express'
import { Server } from 'http'
import { describe } from 'vitest'
import { createAgent, IAgent, IAgentOptions } from '@veramo/core'
import { AgentRestClient } from '@veramo/remote-client'
import { AgentRouter, RequestWithAgentRouter } from '@veramo/remote-server'
import { createObjects, getConfig } from '../../agent-config/src'
import kmsRestClientAgentLogic from './shared/kmsRestClientAgentLogic'
import { IKmsRestClient } from '../src'

const port = 3004
const basePath = '/agent'

let serverAgent: IAgent
let restServer: Server

const getAgent = (options?: IAgentOptions) =>
  createAgent<IKmsRestClient>({
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
  const config = await getConfig('packages/kms-rest-client/agent.yml')
  const { agent } = await createObjects(config, { agent: '/agent' })
  serverAgent = agent

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
  return true
}

const testContext = {
  getAgent,
  setup,
  tearDown,
}

// todo: for now we're skipping this test, uncomment if we want the integration tests
describe.skip('REST integration tests', (): void => {
  kmsRestClientAgentLogic(testContext)
})
