import 'cross-fetch/polyfill'
// @ts-ignore
import express, { Router } from 'express'
import { Server } from 'http'
import { IAgent, createAgent, IAgentOptions } from '@veramo/core'
import { AgentRestClient } from '@veramo/remote-client'
import { AgentRouter, RequestWithAgentRouter } from '@veramo/remote-server'
import { createObjects, getConfig } from '../../agent-config/dist'
import { IOID4VCIRestClient } from '../src'
import issuanceRestClientAgentLogic from './shared/issuanceRestClientAgentLogic'
import { describe } from 'vitest'

const port = 3002
const basePath = '/agent'

let serverAgent: IAgent
let restServer: Server

const getAgent = (options?: IAgentOptions) =>
  createAgent<IOID4VCIRestClient>({
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
  const config = await getConfig('packages/oid4vci-issuer-rest-client/agent.yml')
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

const tearDown = async (): Promise<void> => {
  restServer.close()
}

const testContext = {
  getAgent,
  setup,
  tearDown,
}

// todo: for now we're skipping this test, uncomment if we want the integration tests
describe.skip('REST integration tests', () => {
  issuanceRestClientAgentLogic(testContext)
})
