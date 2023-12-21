import 'cross-fetch/polyfill'
import { IAgent, createAgent, IAgentOptions } from '@veramo/core'
import { AgentRestClient } from '@veramo/remote-client'
// @ts-ignore
import express from 'express'
import { Server } from 'http'
import { AgentRouter, RequestWithAgentRouter } from '@veramo/remote-server'
import { getConfig } from '@veramo/cli/build/setup'
import { createObjects } from '@veramo/cli/build/lib/objectCreator'
import { IVcApiIssuerClient, VcApiIssuerClient } from '../src'
import vcApiIssuerAgentLogic from './shared/vcApiIssuerAgentLogic'

jest.setTimeout(60000)

const port = 3002
const basePath = '/agent'
let serverAgent: IAgent
let restServer: Server

/*
if (!process.env.VC_HTTP_API_AUTH_TOKEN) {
  jest.clearAllTimers()
  throw new Error('Authorization token must be provided')
}
*/

const getAgent = (options?: IAgentOptions) =>
  createAgent<IVcApiIssuerClient>({
    ...options,
    plugins: [
      new VcApiIssuerClient({
        issueUrl: 'https://vc-api.sphereon.io/services/issue/credentials',
        authorizationToken: process.env.VC_HTTP_API_AUTH_TOKEN!,
      }),
      new AgentRestClient({
        url: 'http://localhost:' + port + basePath,
        enabledMethods: serverAgent.availableMethods(),
        schema: serverAgent.getSchema(),
      }),
    ],
  })

const setup = async (): Promise<boolean> => {
  const config = getConfig('packages/w3c-vc-api-issuer-rest-client/agent.yml')
  config.agent.$args[0].plugins[0].$args[0].authorizationToken = process.env.VC_HTTP_API_AUTH_TOKEN
  const { agent } = createObjects(config, { agent: '/agent' })
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

const tearDown = async (): Promise<boolean> => {
  restServer.close()
  return true
}

const testContext = { getAgent, setup, tearDown }

describe('REST integration tests', () => {
  vcApiIssuerAgentLogic(testContext)
})
