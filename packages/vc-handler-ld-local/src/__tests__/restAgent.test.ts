import 'cross-fetch/polyfill'
import { IAgent } from '@veramo/core'
import express from 'express'
import { Server } from 'http'
import { AgentRouter, RequestWithAgentRouter } from '@veramo/remote-server'
import { getConfig } from '@veramo/cli/build/setup'
import { createObjects } from '@veramo/cli/build/lib/objectCreator'
import { LdDefaultContexts, VeramoEd25519Signature2018 } from '@veramo/credential-ld'

jest.setTimeout(30000)

const port = 3002
const basePath = '/agent'
let serverAgent: IAgent
let restServer: Server

if (!process.env.VC_HTTP_API_AUTH_TOKEN) {
  jest.clearAllTimers()
  throw new Error('Authorization token must be provided')
}

/*
const getAgent = (options?: IAgentOptions) =>
  createAgent<ICredentialHandlerLDLocal>({
    ...options,
    plugins: [
      new CredentialHandlerLDLocal({
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
*/

const setup = async (): Promise<boolean> => {
  const config = getConfig('packages/vc-handler-ld-local/agent.yml');
  (config.agent.$args[0].plugins[0].$args[0].contextMaps = [LdDefaultContexts /*, customContext*/]),
    (config.agent.$args[0].plugins[0].$args[0].suites = [new VeramoEd25519Signature2018()])
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

const testContext = { /*getAgent, */ setup, tearDown }

describe('REST integration tests', () => {
  xit('handler', () => {
    // vcApiIssuerAgentLogic(testContext)
  })
})
