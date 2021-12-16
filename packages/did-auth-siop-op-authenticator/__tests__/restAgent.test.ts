import 'cross-fetch/polyfill'
import express from 'express'
import { IAgent, createAgent, IAgentOptions } from '@veramo/core'
import { AgentRestClient } from '@veramo/remote-client'
import { Server } from 'http'
import { AgentRouter, RequestWithAgentRouter } from '@veramo/remote-server'
import { getConfig } from '@veramo/cli/build/setup'
import { createObjects } from '@veramo/cli/build/lib/objectCreator'
import { DidAuthSiopOpAuthenticator } from '../src/agent/DidAuthSiopOpAuthenticator'
import { IDidAuthSiopOpAuthenticator } from '../src/types/IDidAuthSiopOpAuthenticator'
import { Resolver } from 'did-resolver'
import { getDidKeyResolver } from '@veramo/did-provider-key'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { getUniResolver } from '@sphereon/did-uni-client'
import didAuthSiopOpAuthenticatorAgentLogic from './shared/didAuthSiopOpAuthenticatorAgentLogic'

jest.setTimeout(30000)

const port = 3002
const basePath = '/agent'
let serverAgent: IAgent
let restServer: Server

const getAgent = (options?: IAgentOptions) =>
  createAgent<IDidAuthSiopOpAuthenticator>({
    ...options,
    plugins: [
      new DidAuthSiopOpAuthenticator(),
      new DIDResolverPlugin({
        resolver: new Resolver({
          ...getDidKeyResolver(),
          ...getUniResolver('lto', { resolveUrl: 'https://uniresolver.test.sphereon.io/1.0/identifiers' }),
          ...getUniResolver('factom', { resolveUrl: 'https://uniresolver.test.sphereon.io/1.0/identifiers' }),
        }),
      }),
      new AgentRestClient({
        url: 'http://localhost:' + port + basePath,
        enabledMethods: serverAgent.availableMethods(),
        schema: serverAgent.getSchema(),
      }),
    ],
  })

const setup = async (): Promise<boolean> => {
  const config = getConfig('packages/did-auth-siop-op-authenticator/agent.yml')
  const { agent } = createObjects(config, { agent: '/agent' })
  agent.registerCustomApprovalForSiop({ key: 'success', customApproval: () => Promise.resolve() })
  agent.registerCustomApprovalForSiop({ key: 'failure', customApproval: () => Promise.reject(new Error('denied')) })
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

const testContext = {
  getAgent,
  setup,
  tearDown,
  isRestTest: true,
}

describe('REST integration tests', () => {
  didAuthSiopOpAuthenticatorAgentLogic(testContext)
})
