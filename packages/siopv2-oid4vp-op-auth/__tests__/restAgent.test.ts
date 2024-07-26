import * as fs from 'fs'
import 'cross-fetch/polyfill'
// @ts-ignore
import express from 'express'
import { IAgent, createAgent, IAgentOptions } from '@veramo/core'
import { AgentRestClient } from '@veramo/remote-client'
import { Server } from 'http'
import { AgentRouter, RequestWithAgentRouter } from '@veramo/remote-server'
import { createObjects, getConfig } from '@sphereon/ssi-sdk.agent-config'
import { DidAuthSiopOpAuthenticator, IDidAuthSiopOpAuthenticator } from '../src'
import { Resolver } from 'did-resolver'
import { getDidKeyResolver } from '@veramo/did-provider-key'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { getUniResolver } from '@sphereon/did-uni-client'
import didAuthSiopOpAuthenticatorAgentLogic from './shared/didAuthSiopOpAuthenticatorAgentLogic'
import { PresentationSignCallback } from '@sphereon/did-auth-siop'

jest.setTimeout(60000)

function getFile(path: string) {
  return fs.readFileSync(path, 'utf-8')
}

function getFileAsJson(path: string) {
  return JSON.parse(getFile(path))
}

const port = 3002
const basePath = '/agent'
let serverAgent: IAgent
let restServer: Server

const presentationSignCallback: PresentationSignCallback = async (args) => {
  const presentationSignProof = getFileAsJson('./packages/siopv2-openid4vp-op-auth/__tests__/vc_vp_examples/psc/psc.json')

  return {
    ...args.presentation,
    ...presentationSignProof,
  }
}

const getAgent = (options?: IAgentOptions) =>
  createAgent<IDidAuthSiopOpAuthenticator>({
    ...options,
    plugins: [
      new DidAuthSiopOpAuthenticator(presentationSignCallback),
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
  const config = await getConfig('packages/siopv2-openid4vp-op-auth/agent.yml')
  config.agent.$args[0].plugins[1].$args[0] = presentationSignCallback
  const { agent } = await createObjects(config, { agent: '/agent' })
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

xdescribe('REST integration tests', () => {
  didAuthSiopOpAuthenticatorAgentLogic(testContext)
})
